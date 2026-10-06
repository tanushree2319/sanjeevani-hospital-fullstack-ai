import assert from 'node:assert/strict';
import test from 'node:test';

process.env.OPENAI_API_KEY = 'unit-test-provider-credential';
process.env.OPENAI_MODEL = 'gpt-4o-mini';

const { pool } = await import('../dist/db.js');
pool.query = async () => ({ rows: [] });
const { answerHospitalQuestion } = await import('../dist/ai/aiService.js');

test('quota 429 is classified as billing/quota, not retried, and logs no credential', async () => {
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  let requests = 0;
  let requestBody;
  const logs = [];
  console.error = (...values) => logs.push(JSON.stringify(values));
  globalThis.fetch = async (_url, options) => {
    requests += 1;
    requestBody = JSON.parse(options.body);
    return new Response(JSON.stringify({ error: { type: 'insufficient_quota', code: 'insufficient_quota', message: 'You exceeded your current quota.' } }), { status: 429 });
  };

  try {
    await assert.rejects(answerHospitalQuestion('What services does Sanjeevani Hospital provide?'), (error) => {
      assert.equal(error.code, 'AI_QUOTA_EXCEEDED');
      assert.equal(error.details.providerStatus, 429);
      assert.equal(error.details.category, 'quota_billing');
      return true;
    });
    assert.equal(requestBody.model, 'gpt-4o-mini');
    assert.equal(requests, 1);
    assert.ok(logs.some((line) => line.includes('insufficient_quota')));
    assert.ok(logs.every((line) => !line.includes(process.env.OPENAI_API_KEY)));
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
  }
});

test('short transient request-rate 429 is retried once and can succeed', async () => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests += 1;
    if (requests === 1) {
      return new Response(JSON.stringify({ error: { type: 'requests', code: 'rate_limit_exceeded', message: 'Rate limit reached on requests per min (RPM).' } }), {
        status: 429,
        headers: { 'retry-after': '0' },
      });
    }
    return new Response(JSON.stringify({ choices: [{ message: { content: 'Sanjeevani provides emergency, general medicine, cardiology, gynecology, orthopedics, and pediatric services.' } }] }), { status: 200 });
  };

  try {
    const result = await answerHospitalQuestion('What services does Sanjeevani Hospital provide?');
    assert.equal(requests, 2);
    assert.match(result.reply, /cardiology/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('token-per-minute 429 is classified distinctly and not retried when Retry-After is long', async () => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests += 1;
    return new Response(JSON.stringify({ error: { type: 'tokens', code: 'rate_limit_exceeded', message: 'Rate limit reached on tokens per min (TPM).' } }), {
      status: 429,
      headers: { 'retry-after': '30' },
    });
  };

  try {
    await assert.rejects(answerHospitalQuestion('What services does Sanjeevani Hospital provide?'), (error) => {
      assert.equal(error.code, 'AI_TOKEN_RATE_LIMITED');
      assert.equal(error.details.category, 'token_rate_limit');
      return true;
    });
    assert.equal(requests, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
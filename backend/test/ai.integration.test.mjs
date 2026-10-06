import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import test from 'node:test';

test('AI endpoint validates requests and reports missing provider configuration honestly', async () => {
  const portProbe = createServer();
  portProbe.listen(0, '127.0.0.1');
  await once(portProbe, 'listening');
  const port = portProbe.address().port;
  portProbe.close();
  await once(portProbe, 'close');

  const childEnv = { ...process.env, PORT: String(port), OPENAI_API_KEY: '' };
  delete childEnv.DATABASE_URL;
  const child = spawn(process.execPath, ['dist/server.js'], {
    cwd: process.cwd(),
    env: childEnv,
    stdio: 'ignore',
  });
  const baseUrl = `http://127.0.0.1:${port}`;

  async function post(message) {
    return fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message }),
    });
  }

  try {
    let ready = false;
    for (let attempt = 0; attempt < 40 && !ready; attempt += 1) {
      try {
        const response = await fetch(`${baseUrl}/api/health`);
        ready = response.status === 503;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    assert.equal(ready, true, 'Express should listen even when PostgreSQL is not configured');

    const invalid = await post('hi');
    assert.equal(invalid.status, 400);
    assert.deepEqual(await invalid.json(), {
      success: false,
      error: { code: 'INVALID_MESSAGE', message: 'Message must contain between 3 and 2000 characters.' },
    });

    const unconfigured = await post('What services does Sanjeevani Hospital provide?');
    assert.equal(unconfigured.status, 503);
    const unconfiguredBody = await unconfigured.json();
    assert.equal(unconfiguredBody.success, false);
    assert.equal(unconfiguredBody.error.code, 'AI_NOT_CONFIGURED');
    assert.match(unconfiguredBody.error.message, /OPENAI_API_KEY in backend\/\.env/);
    assert.equal('reply' in unconfiguredBody, false);

    const emergency = await post('I have chest pain and need emergency help');
    assert.equal(emergency.status, 200);
    const emergencyBody = await emergency.json();
    assert.equal(emergencyBody.success, true);
    assert.match(emergencyBody.reply, /emergency services/i);
  } finally {
    child.kill();
    await once(child, 'exit').catch(() => {});
  }
}, { timeout: 20000 });
import { pool } from '../db.js';
import { hospitalKnowledge } from './hospitalKnowledge.js';

type KnowledgeRecord = Record<string, unknown>;
type KnowledgeBase = {
  departments: KnowledgeRecord[];
  doctors: KnowledgeRecord[];
  services: KnowledgeRecord[];
  faqs: KnowledgeRecord[];
};

export class AiChatError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, string | number>,
  ) {
    super(message);
    this.name = 'AiChatError';
  }
}

type OpenAiErrorBody = {
  error?: {
    message?: unknown;
    type?: unknown;
    code?: unknown;
    param?: unknown;
  };
};

type ProviderFailureCategory = 'quota_billing' | 'request_rate_limit' | 'token_rate_limit' | 'token_limit' | 'authentication' | 'unknown_rate_limit' | 'provider_error';

function stringField(value: unknown) {
  return typeof value === 'string' ? value.slice(0, 500) : '';
}

function classifyProviderFailure(status: number, error: OpenAiErrorBody['error']): ProviderFailureCategory {
  const code = `${stringField(error?.code)} ${stringField(error?.type)}`.toLowerCase();
  const message = stringField(error?.message).toLowerCase();

  if (/insufficient_quota|billing|quota|hard_limit/.test(code) || /quota|billing|credit balance/.test(message)) return 'quota_billing';
  if (/context_length_exceeded|max_tokens|token_limit/.test(code) || /maximum context length|too many tokens/.test(message)) return 'token_limit';
  if (status === 401 || /invalid_api_key|authentication/.test(code)) return 'authentication';
  if (status === 429 && /tokens per (minute|min)|\btpm\b|token rate/.test(message)) return 'token_rate_limit';
  if (status === 429 && /requests per (minute|min)|\brpm\b|request rate/.test(message)) return 'request_rate_limit';
  if (status === 429 && /rate_limit/.test(code)) return 'request_rate_limit';
  if (status === 429) return 'unknown_rate_limit';
  return 'provider_error';
}

function safeDiagnosticField(value: unknown, apiKey: string) {
  if (typeof value !== 'string') return undefined;
  return value
    .replaceAll(apiKey, '[REDACTED]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]')
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, '[REDACTED]')
    .replace(/[\r\n\t]/g, ' ')
    .slice(0, 160);
}

function retryDelayMs(value: string | null) {
  if (!value) return 500;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const retryAt = Date.parse(value);
  return Number.isNaN(retryAt) ? 500 : Math.max(0, retryAt - Date.now());
}

function providerFailure(status: number, category: ProviderFailureCategory, providerCode: string) {
  const details = { providerStatus: status, category, ...(providerCode ? { providerCode } : {}) };
  switch (category) {
    case 'quota_billing':
      return new AiChatError(503, 'AI_QUOTA_EXCEEDED', 'OpenAI reports that this project has insufficient quota or has reached a billing limit. Check the project usage and billing settings.', details);
    case 'token_rate_limit':
      return new AiChatError(503, 'AI_TOKEN_RATE_LIMITED', 'OpenAI reports that the token-per-minute limit has been reached. Wait for the limit window to reset, then retry.', details);
    case 'request_rate_limit':
      return new AiChatError(503, 'AI_REQUEST_RATE_LIMITED', 'OpenAI reports that the request-per-minute limit has been reached. Wait briefly, then retry.', details);
    case 'token_limit':
      return new AiChatError(502, 'AI_TOKEN_LIMIT', 'The request exceeded the model token or context limit. Try a shorter question.', details);
    case 'authentication':
      return new AiChatError(503, 'AI_PROVIDER_AUTH_FAILED', 'OpenAI rejected the configured API key. Check the backend key configuration.', details);
    case 'unknown_rate_limit':
      return new AiChatError(503, 'AI_PROVIDER_429_UNCLASSIFIED', 'OpenAI returned HTTP 429 with an unrecognized error category. Check the backend diagnostic log.', details);
    default:
      return new AiChatError(502, 'AI_PROVIDER_ERROR', `OpenAI returned HTTP ${status}. Check the backend diagnostic log.`, details);
  }
}

function isEmergency(message: string) {
  return /\b(emergency|can't breathe|cannot breathe|trouble breathing|chest pain|unconscious|severe bleeding|suicid(?:e|al))\b/i.test(message);
}

function asksForMedicalAdvice(message: string) {
  return /\b(diagnos(?:e|is)|what (?:disease|condition) do i have|prescrib(?:e|ing)|dosage|dose of|which medicine|what medicine should|treatment for my|should i take)\b/i.test(message);
}

async function loadKnowledgeBase(): Promise<KnowledgeBase> {
  try {
    const [departments, doctors, services, faqs] = await Promise.all([
      pool.query('SELECT id, name, focus, description FROM departments'),
      pool.query('SELECT d.id, d.name, d.qualification, d.specialty, dep.name AS department FROM doctors d JOIN departments dep ON dep.id = d.department_id'),
      pool.query('SELECT id, title, description FROM services'),
      pool.query('SELECT question, answer FROM faqs'),
    ]);
    return {
      departments: departments.rows,
      doctors: doctors.rows,
      services: services.rows,
      faqs: faqs.rows,
    };
  } catch {
    return {
      departments: hospitalKnowledge.departments,
      doctors: hospitalKnowledge.doctors,
      services: hospitalKnowledge.services,
      faqs: hospitalKnowledge.faqs,
    };
  }
}

function retrieveContext(message: string, knowledge: KnowledgeBase) {
  const query = message.toLowerCase();
  const asksDoctors = /doctor|physician|specialist|surgeon/.test(query);
  const asksServices = /service|facility|provide|offer|available/.test(query);
  const asksDepartments = /department|specialty|speciality|which .*contact/.test(query);
  const asksAppointment = /appointment|book|visit|before visiting|consultation/.test(query);
  const asksInsurance = /insurance|cashless|coverage|plan/.test(query);
  const asksHours = /hour|timing|open|close|contact|phone|address|location/.test(query);

  const terms = query.split(/\W+/).filter((term) => term.length > 2);
  const matchedFaqs = knowledge.faqs
    .map((faq) => ({ faq, score: terms.reduce((score, term) => score + (JSON.stringify(faq).toLowerCase().includes(term) ? 1 : 0), 0) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map(({ faq }) => faq);

  return {
    hospital: hospitalKnowledge.hospital,
    departments: asksDepartments || asksAppointment ? knowledge.departments : [],
    doctors: asksDoctors ? knowledge.doctors : [],
    services: asksServices ? knowledge.services : [],
    faqs: asksAppointment || matchedFaqs.length ? matchedFaqs : [],
    appointmentProcess: asksAppointment ? hospitalKnowledge.appointmentGuide : undefined,
    insurance: asksInsurance ? hospitalKnowledge.insurance : undefined,
    hours: asksHours ? hospitalKnowledge.hospital.hours : undefined,
    informationGaps: [
      ...(asksInsurance ? ['The verified hospital content does not list insurance plans or cashless coverage.'] : []),
      ...(asksHours ? ['Specific outpatient timings are not listed in verified hospital content.'] : []),
    ],
  };
}

export async function answerHospitalQuestion(message: string): Promise<{ reply: string }> {
  if (isEmergency(message)) {
    return { reply: 'This assistant cannot assess emergencies. Please contact local emergency services or go to the nearest emergency department now.' };
  }

  if (asksForMedicalAdvice(message)) {
    return { reply: 'I can help with Sanjeevani Hospital information and patient navigation, but I cannot diagnose, recommend treatment, or advise on medication. Please contact a qualified healthcare professional.' };
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new AiChatError(503, 'AI_NOT_CONFIGURED', 'The hospital assistant is not configured yet. Set OPENAI_API_KEY in backend/.env and restart the backend.');
  }

  const context = retrieveContext(message, await loadKnowledgeBase());
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  console.info('[ai] OpenAI request starting', { model });
  let response: Response | undefined;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: 500,
          messages: [
            {
              role: 'system',
              content: [
                'You are the Sanjeevani Hospital AI Patient Assistant, a hospital information and patient-navigation assistant, not a doctor.',
                'Answer only using the verified hospital context supplied with the question. Do not invent services, facilities, doctors, availability, hours, insurance, or policies.',
                'If the context does not contain the requested information, say it is not available in the information you have and provide the hospital contact details when useful.',
                'Never diagnose, triage, claim certainty about a condition, prescribe medication, recommend a dosage, or replace a clinician.',
                'For potential emergencies, instruct the user to contact local emergency services or go to the nearest emergency department immediately.',
                'Keep answers concise, kind, and clear. Do not claim to be human or a doctor.',
              ].join(' '),
            },
            { role: 'user', content: `Verified hospital context (JSON):\n${JSON.stringify(context)}\n\nUser question: ${message}` },
          ],
        }),
      });
    } catch {
      throw new AiChatError(503, 'AI_PROVIDER_UNAVAILABLE', 'The AI service could not be reached. Please try again shortly.');
    }

    if (response.ok) break;

    const body = await response.json().catch(() => ({})) as OpenAiErrorBody;
    const providerError = body.error;
    const category = classifyProviderFailure(response.status, providerError);
    const providerCode = stringField(providerError?.code) || stringField(providerError?.type);
    console.error('[ai] OpenAI provider error', {
      model: safeDiagnosticField(model, apiKey),
      httpStatus: response.status,
      category,
      providerType: safeDiagnosticField(stringField(providerError?.type), apiKey),
      providerCode: safeDiagnosticField(providerCode, apiKey),
      providerParam: safeDiagnosticField(stringField(providerError?.param), apiKey),
      requestId: safeDiagnosticField(response.headers.get('x-request-id') || '', apiKey),
    });

    const isTransientRateLimit = category === 'request_rate_limit' || category === 'token_rate_limit';
    const waitMs = retryDelayMs(response.headers.get('retry-after'));
    if (attempt === 0 && isTransientRateLimit && waitMs <= 2000) {
      console.warn('[ai] Retrying transient OpenAI rate limit once', { category, waitMs, model: safeDiagnosticField(model, apiKey) });
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      continue;
    }

    throw providerFailure(response.status, category, safeDiagnosticField(providerCode, apiKey) || '');
  }

  if (!response?.ok) throw new AiChatError(502, 'AI_PROVIDER_ERROR', 'OpenAI did not return a successful response.');

  const result = await response.json() as { choices?: Array<{ message?: { content?: string | null } }> };
  const reply = result.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new AiChatError(502, 'AI_EMPTY_RESPONSE', 'The AI service returned an empty response. Please try again.');

  return { reply };
}
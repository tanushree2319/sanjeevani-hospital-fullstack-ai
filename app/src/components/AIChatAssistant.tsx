import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { aiNavigationHints, departments, doctors } from '../data/hospitalData';
import { apiRequest } from '../lib/api';

const systemNotice = 'This AI assistant provides general healthcare navigation and hospital information only, not diagnosis or treatment advice.';
const suggestedQuestions = [
  'What services does Sanjeevani Hospital provide?',
  'Which department should I contact for an appointment?',
  'How can I book an appointment?',
  'What doctors are available?',
  'What information do I need before visiting the hospital?',
];

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function AIChatAssistant() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retryQuestion, setRetryQuestion] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy, error]);

  const sendMessage = async (value: string, retry = false) => {
    const message = value.trim();
    if (message.length < 3 || busy) return;

    if (!retry) {
      setMessages((previous) => [...previous, { id: crypto.randomUUID(), role: 'user', content: message }]);
      setInput('');
    }
    setBusy(true);
    setError('');
    setRetryQuestion(message);

    try {
      const result = await apiRequest<{ success: boolean; reply?: string }>('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      if (!result.success || !result.reply?.trim()) throw new Error('The assistant returned an invalid response. Please try again.');
      setMessages((previous) => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: result.reply! }]);
      setRetryQuestion('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The assistant could not complete that request.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  };

  return (
    <section className="py-5 bg-light ai-assistant-section">
      <div className="container">
        <div className="text-center mb-4">
          <h2 className="display-6 fw-bold">Sanjeevani AI Patient Assistant</h2>
          <p className="text-muted">Hospital guidance, not diagnosis or treatment advice.</p>
        </div>

        <div className="row g-4 align-items-start">
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm h-100 p-4 chat-panel">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="h5 mb-0">Ask a hospital question</h3>
                <span className="badge text-bg-primary">Assistant</span>
              </div>

              <div className="chat-transcript" role="log" aria-label="Conversation with the hospital assistant" aria-live="polite" aria-relevant="additions text">
                {messages.length === 0 && (
                  <div className="chat-empty-state">
                    <p className="fw-semibold mb-2">How can we help you navigate your visit?</p>
                    <p className="text-muted small mb-3">Ask about hospital departments, doctors, services, or appointments.</p>
                    <div className="d-flex flex-wrap gap-2">
                      {suggestedQuestions.map((question) => (
                        <button key={question} className="btn btn-sm btn-outline-primary text-start" type="button" onClick={() => setInput(question)}>
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((message) => (
                  <div key={message.id} className={`chat-message chat-message-${message.role}`}>
                    <span className="chat-message-label">{message.role === 'user' ? 'You' : 'Sanjeevani Assistant'}</span>
                    <p className="mb-0">{message.content}</p>
                  </div>
                ))}
                {busy && (
                  <div className="chat-message chat-message-assistant" role="status" aria-label="Assistant is responding">
                    <span className="chat-message-label">Sanjeevani Assistant</span>
                    <span className="chat-typing-indicator"><i /><i /><i /></span>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {error && (
                <div className="chat-error" role="alert">
                  <p className="mb-2">{error}</p>
                  {retryQuestion && <button className="btn btn-sm btn-outline-danger" type="button" disabled={busy} onClick={() => void sendMessage(retryQuestion, true)}>Retry last message</button>}
                </div>
              )}

              <form className="chat-composer" onSubmit={handleSubmit}>
                <textarea
                  className="form-control mb-3"
                  rows={2}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  aria-label="Message the Sanjeevani Hospital assistant"
                  placeholder="Ask about doctors, services, or appointments"
                />
                <button className="btn btn-primary" type="submit" aria-label="Send message" disabled={busy || input.trim().length < 3}>
                  {busy ? 'Sending...' : 'Send'}
                </button>
              </form>

              <small className="d-block mt-3 text-muted">{systemNotice}</small>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card border-0 shadow-sm h-100 p-4">
              <h4>Suggested hospital navigation</h4>
              <div className="d-flex flex-wrap gap-2 mt-3">
                {aiNavigationHints.map((hint) => (
                  <span key={hint} className="badge rounded-pill bg-primary-subtle text-primary">{hint}</span>
                ))}
              </div>

              <div className="mt-4">
                <h5 className="doc-text-primary mb-3">Our doctors</h5>
                {doctors.slice(0, 3).map((doctor) => (
                  <div key={doctor.id} className="d-flex justify-content-between align-items-center border rounded p-3 mb-2">
                    <div>
                      <strong>{doctor.name}</strong>
                      <div className="text-muted small">{doctor.specialty}</div>
                    </div>
                    <Link className="btn btn-outline-primary btn-sm" to="/doctors">View</Link>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <h5 className="doc-text-primary mb-3">Departments</h5>
                <ul className="list-unstyled mb-0">
                  {departments.slice(0, 4).map((department) => (
                    <li key={department.id} className="mb-2 text-muted">• {department.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

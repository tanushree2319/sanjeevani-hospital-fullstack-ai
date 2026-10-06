import assert from 'node:assert/strict';
import test from 'node:test';

process.env.JWT_SECRET = 'unit-test-jwt-secret-long-enough-for-validation';
const { optionalAuth, requireAdmin, signToken } = await import('../dist/auth.js');

function responseMock() {
  return {
    locals: {},
    statusCode: 200,
    payload: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
}

test('JWT middleware accepts a signed patient token', () => {
  const token = signToken({ id: 'patient-id', email: 'patient@example.com', role: 'patient' });
  const req = { header: (name) => name === 'authorization' ? `Bearer ${token}` : undefined };
  const res = responseMock();
  let called = false;

  optionalAuth(req, res, () => { called = true; });

  assert.equal(called, true);
  assert.equal(res.locals.user.id, 'patient-id');
  assert.equal(res.locals.user.role, 'patient');
});

test('JWT middleware rejects a tampered token', () => {
  const token = signToken({ id: 'patient-id', email: 'patient@example.com', role: 'patient' });
  const req = { header: (name) => name === 'authorization' ? `Bearer ${token}tampered` : undefined };
  const res = responseMock();

  optionalAuth(req, res, () => assert.fail('next should not be called'));

  assert.equal(res.statusCode, 401);
});

test('admin middleware rejects a valid patient token', () => {
  const token = signToken({ id: 'patient-id', email: 'patient@example.com', role: 'patient' });
  const req = { header: (name) => name === 'authorization' ? `Bearer ${token}` : undefined };
  const res = responseMock();

  requireAdmin(req, res, () => assert.fail('next should not be called'));

  assert.equal(res.statusCode, 403);
});
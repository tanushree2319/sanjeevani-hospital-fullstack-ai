import assert from 'node:assert/strict';
import test from 'node:test';
import { SMTPServer } from 'smtp-server';
import {
  AppointmentEmailConfigurationError,
  AppointmentEmailDeliveryError,
  sendAppointmentEmail,
} from '../dist/appointmentEmail.js';

const environmentKeys = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'SMTP_FROM',
  'APPOINTMENT_RECIPIENT_EMAIL',
];
const previousEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));

test.before(() => {
  process.env.SMTP_HOST = 'smtp.example.test';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'hospital@example.test';
  process.env.SMTP_PASSWORD = 'test-password';
  process.env.SMTP_FROM = 'Sanjeevani Hospital <hospital@example.test>';
  process.env.APPOINTMENT_RECIPIENT_EMAIL = 'tanushreepal2319@gmail.com';
});

test.after(() => {
  for (const key of environmentKeys) {
    if (previousEnvironment[key] === undefined) delete process.env[key];
    else process.env[key] = previousEnvironment[key];
  }
});

test('sends the complete appointment to the configured recipient', async () => {
  let sentMessage;
  await sendAppointmentEmail({
    name: 'Test Patient',
    phone: '07123456789',
    email: 'patient@example.test',
    date: '2099-04-20',
    departmentId: 'general-medicine',
    message: 'Routine consultation',
  }, (options) => {
    assert.equal(options.host, 'smtp.example.test');
    assert.equal(options.secure, false);
    return {
      sendMail: async (message) => {
        sentMessage = message;
        return { accepted: [message.to], rejected: [] };
      },
    };
  });

  assert.equal(sentMessage.to, 'tanushreepal2319@gmail.com');
  assert.equal(sentMessage.replyTo, 'patient@example.test');
  assert.match(sentMessage.text, /Test Patient/);
  assert.match(sentMessage.text, /07123456789/);
  assert.match(sentMessage.text, /patient@example\.test/);
  assert.match(sentMessage.text, /2099-04-20/);
  assert.match(sentMessage.text, /general medicine/);
  assert.match(sentMessage.text, /Routine consultation/);
});

test('delivers mail through an SMTP server without requiring external credentials', async () => {
  let receivedMessage = '';
  const mailServer = new SMTPServer({
    allowInsecureAuth: true,
    hideSTARTTLS: true,
    onAuth(auth, _session, callback) {
      callback(null, { user: auth.username });
    },
    onData(stream, _session, callback) {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => {
        receivedMessage = Buffer.concat(chunks).toString('utf8');
        callback(null, 'Accepted by test SMTP server.');
      });
    },
  });
  await new Promise((resolve, reject) => {
    mailServer.once('error', reject);
    mailServer.listen(0, '127.0.0.1', resolve);
  });

  try {
    process.env.SMTP_HOST = '127.0.0.1';
    process.env.SMTP_PORT = String(mailServer.server.address().port);
    await sendAppointmentEmail({
      name: 'SMTP Test Patient',
      phone: '07123456789',
      email: 'patient@example.test',
      date: '2099-04-20',
      departmentId: 'cardiology',
      message: 'SMTP integration test',
    });
    assert.match(receivedMessage, /SMTP Test Patient/);
    assert.match(receivedMessage, /tanushreepal2319@gmail\.com/);
    assert.match(receivedMessage, /SMTP integration test/);
  } finally {
    await new Promise((resolve) => mailServer.close(resolve));
  }
});

test('does not claim delivery when the email service rejects the recipient', async () => {
  await assert.rejects(
    sendAppointmentEmail({
      name: 'Test Patient',
      phone: '07123456789',
      email: '',
      date: '2099-04-20',
      departmentId: 'general-medicine',
      message: '',
    }, () => ({
      sendMail: async () => ({ accepted: [], rejected: ['tanushreepal2319@gmail.com'] }),
    })),
    AppointmentEmailDeliveryError,
  );
});

test('fails clearly when SMTP configuration is missing', async () => {
  const host = process.env.SMTP_HOST;
  delete process.env.SMTP_HOST;
  await assert.rejects(
    sendAppointmentEmail({
      name: 'Test Patient',
      phone: '07123456789',
      email: '',
      date: '2099-04-20',
      departmentId: 'general-medicine',
      message: '',
    }),
    AppointmentEmailConfigurationError,
  );
  process.env.SMTP_HOST = host;
});

import nodemailer, { type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';

export type AppointmentEmail = {
  name: string;
  phone: string;
  email: string;
  date: string;
  departmentId: string;
  message: string;
};

export class AppointmentEmailConfigurationError extends Error {}
export class AppointmentEmailDeliveryError extends Error {}

type MailTransport = Pick<Transporter<SMTPTransport.SentMessageInfo>, 'sendMail'>;
type TransportFactory = (options: SMTPTransport.Options) => MailTransport;

export async function sendAppointmentEmail(
  appointment: AppointmentEmail,
  transportFactory: TransportFactory = (options) => nodemailer.createTransport(options),
) {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM?.trim();
  const recipient = process.env.APPOINTMENT_RECIPIENT_EMAIL?.trim();

  if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !user || !password || !from || !recipient) {
    throw new AppointmentEmailConfigurationError();
  }

  try {
    const transport = transportFactory({
      host,
      port,
      secure: port === 465,
      auth: { user, pass: password },
    });
    const result = await transport.sendMail({
      from,
      to: recipient,
      replyTo: appointment.email || undefined,
      subject: 'New appointment request',
      text: [
        `Patient name: ${appointment.name}`,
        `Phone: ${appointment.phone}`,
        `Email: ${appointment.email || 'Not provided'}`,
        `Preferred date: ${appointment.date}`,
        `Department: ${appointment.departmentId.replaceAll('-', ' ')}`,
        `Message: ${appointment.message || 'Not provided'}`,
      ].join('\n'),
    });

    const acceptedRecipient = result.accepted?.some((address) => (
      address.toLowerCase() === recipient.toLowerCase()
    )) ?? false;
    if (!acceptedRecipient) throw new AppointmentEmailDeliveryError();
  } catch {
    throw new AppointmentEmailDeliveryError();
  }
}

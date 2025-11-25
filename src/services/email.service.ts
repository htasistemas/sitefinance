import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export interface ContactMessage {
  nome: string;
  email: string;
  mensagem: string;
}

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'htasistemas@gmail.com';

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error(
      'Configuração de SMTP ausente. Defina SMTP_HOST, SMTP_PORT, SMTP_USER e SMTP_PASS para habilitar o envio de e-mails.'
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendContactEmail(payload: ContactMessage) {
  const transporter = getTransporter();

  const sanitizedName = payload.nome.trim();
  const sanitizedMessage = payload.mensagem.trim();

  await transporter.sendMail({
    from: {
      name: 'Finance Pro Master',
      address: process.env.SMTP_FROM || process.env.SMTP_USER || SUPPORT_EMAIL,
    },
    to: SUPPORT_EMAIL,
    replyTo: payload.email.trim(),
    subject: `Nova mensagem de contato: ${sanitizedName || 'Cliente Finance Pro Master'}`,
    text: `Nome: ${sanitizedName}\nE-mail: ${payload.email}\n\n${sanitizedMessage}`,
    html: `
      <h1>Nova mensagem recebida</h1>
      <p><strong>Nome:</strong> ${sanitizedName || 'Não informado'}</p>
      <p><strong>E-mail:</strong> ${payload.email}</p>
      <p><strong>Mensagem:</strong></p>
      <p>${sanitizedMessage.replace(/\n/g, '<br>')}</p>
    `,
  });
}

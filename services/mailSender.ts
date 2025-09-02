import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import logger from '@/config/logger';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

interface Attachment {
  filename: string;
  path: string;
}

const getEmailConfig = (): EmailConfig => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM;

  if (!host || !port || !user || !pass || !from) {
    throw new Error('Missing required email configuration in environment variables.');
  }

  return {
    host,
    port,
    secure,
    auth: { user, pass },
    from,
  };
};

export async function mailSender(
  to: string,
  subject: string,
  html: string,
  attachments?: Attachment[]
): Promise<void> {
  const config = getEmailConfig();

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  const mailOptions: nodemailer.SendMailOptions = {
    from: config.from,
    to,
    subject,
    html,
  };

  if (attachments && attachments.length > 0) {
    mailOptions.attachments = await Promise.all(
      attachments.map(async (attachment) => {
        await fs.access(attachment.path); // Check if file exists
        return {
          filename: attachment.filename,
          path: attachment.path,
        };
      })
    );
  }

  try {
    await transporter.sendMail(mailOptions);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log("err", errorMessage)
    logger.error('Error sending email:', errorMessage);
    throw new Error(`Failed to send email: ${errorMessage}`);
  }
}
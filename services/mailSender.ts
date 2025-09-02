import { Resend } from 'resend';
import fs from 'fs/promises';
import logger from '@/config/logger';

interface EmailConfig {
  apiKey: string;
  from: string;
}

interface Attachment {
  filename: string;
  path: string;
}

const getEmailConfig = (): EmailConfig => {
  const apiKey = process.env.AUTH_RESEND_KEY;
  const from = process.env.AUTH_RESEND_FROM;

  if (!apiKey || !from) {
    const missingVars = [
      !apiKey && 'AUTH_RESEND_KEY',
      !from && 'AUTH_RESEND_FROM',
    ].filter(Boolean).join(', ');
    const errorMessage = `Missing required email configuration in environment variables: ${missingVars}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  // Validate AUTH_RESEND_FROM is a valid email address
  if (!from.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
    const errorMessage = 'Invalid AUTH_RESEND_FROM format. Expected a valid email address.';
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  logger.info('Resend Configuration', { from });
  return {
    apiKey,
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
  const resend = new Resend(config.apiKey);

  try {
    const attachmentFiles = attachments
      ? await Promise.all(
        attachments.map(async (attachment) => {
          await fs.access(attachment.path); // Check if file exists
          const content = await fs.readFile(attachment.path);
          return {
            filename: attachment.filename,
            content: content, // Buffer for the file content
          };
        })
      )
      : [];

    await resend.emails.send({
      from: `PageOptima <${config.from}>`, // e.g., PageOptima <info@pageoptima.com>
      to,
      subject,
      html,
      attachments: attachmentFiles,
    });

    logger.info(`Email sent successfully to ${to}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log("err", errorMessage);
    logger.error('Error sending email:', errorMessage);
    throw new Error(`Failed to send email: ${errorMessage}`);
  }
}
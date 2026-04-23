// Type declarations for nodemailer (avoiding npm dependency to prevent vulnerabilities)
declare module 'nodemailer' {
  interface TransportOptions {
    service?: string;
    auth?: {
      user: string;
      pass: string;
    };
  }

  interface MailOptions {
    from: string;
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }

  interface SentMessageInfo {
    messageId?: string;
    accepted?: string[];
    rejected?: string[];
    pending?: string[];
    response?: string;
  }

  interface Transporter {
    sendMail(mailOptions: MailOptions): Promise<SentMessageInfo>;
  }

  function createTransport(options: TransportOptions): Transporter;
}

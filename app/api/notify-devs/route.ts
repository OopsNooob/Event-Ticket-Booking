import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Type declaration for nodemailer (avoiding @types/nodemailer dependency)
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GMAIL_USER?: string;
      GMAIL_APP_PASSWORD?: string;
      ALERT_EMAIL?: string;
      EMAIL_PROVIDER?: string;
      RESEND_API_KEY?: string;
      SENDGRID_API_KEY?: string;
      SENDGRID_FROM_EMAIL?: string;
      DISCORD_WEBHOOK_URL?: string;
      SENTRY_DSN?: string;
    }
  }
}

/**
 * POST /api/notify-devs
 * 
 * Handles error notifications from the global error handler.
 * Logs errors with 100% stack traces and sends alerts to developers.
 * 
 * ASR Requirement: "The Monitor Component detects the fault, analyzes it, 
 * and sends alert emails to the developers... logs must contain 100% stack traces."
 */

interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  name?: string;
  timestamp: string;
  url: string;
  userAgent: string;
}

/**
 * Parse and validate error report
 */
function parseErrorReport(data: unknown): ErrorReport | null {
  if (typeof data !== 'object' || !data) return null;

  const report = data as Record<string, unknown>;
  
  if (!report.id || !report.message || !report.timestamp) {
    return null;
  }

  return {
    id: String(report.id),
    message: String(report.message),
    stack: report.stack ? String(report.stack) : undefined,
    name: report.name ? String(report.name) : undefined,
    timestamp: String(report.timestamp),
    url: String(report.url || 'unknown'),
    userAgent: String(report.userAgent || 'unknown'),
  };
}

/**
 * Format error for logging and display
 */
function formatErrorLog(report: ErrorReport): string {
  return `
═══════════════════════════════════════════════════════════════
🚨 APPLICATION ERROR DETECTED
═══════════════════════════════════════════════════════════════
Error ID:       ${report.id}
Timestamp:      ${report.timestamp}
Error Type:     ${report.name || 'Unknown'}
Message:        ${report.message}
URL:            ${report.url}
User Agent:     ${report.userAgent}

📋 FULL STACK TRACE:
${report.stack || 'No stack trace available'}

═══════════════════════════════════════════════════════════════
`;
}

/**
 * Format error for email notification
 */
function formatEmailBody(report: ErrorReport): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
      .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
      .field { margin: 12px 0; }
      .label { font-weight: 600; color: #374151; }
      .value { color: #6b7280; margin-top: 4px; word-break: break-all; }
      .stack { background: #1f2937; color: #10b981; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 12px; overflow: auto; max-height: 400px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🚨 Application Error Alert</h1>
        <p>An unhandled error occurred in production</p>
      </div>
      <div class="content">
        <div class="field">
          <div class="label">Error Reference ID:</div>
          <div class="value">${report.id}</div>
        </div>
        <div class="field">
          <div class="label">Timestamp:</div>
          <div class="value">${new Date(report.timestamp).toLocaleString()}</div>
        </div>
        <div class="field">
          <div class="label">Error Type:</div>
          <div class="value">${report.name || 'Unknown'}</div>
        </div>
        <div class="field">
          <div class="label">Message:</div>
          <div class="value">${report.message}</div>
        </div>
        <div class="field">
          <div class="label">Page URL:</div>
          <div class="value">${report.url}</div>
        </div>
        <div class="field">
          <div class="label">User Agent:</div>
          <div class="value">${report.userAgent}</div>
        </div>
        <div class="field">
          <div class="label">Full Stack Trace:</div>
          <div class="stack">${(report.stack || 'No stack trace available').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">
          This error was automatically detected and reported at ${new Date(report.timestamp).toLocaleString()}.
          Please investigate and fix as soon as possible.
        </p>
      </div>
    </div>
  </body>
</html>
  `;
}

/**
 * Send email via Gmail using nodemailer
 */
async function sendEmailViaGmail(to: string, report: ErrorReport): Promise<void> {
  const gmailUser = process.env.GMAIL_USER || '';
  const gmailPassword = process.env.GMAIL_APP_PASSWORD || '';

  if (!gmailUser || !gmailPassword) {
    console.warn('⚠️ Gmail credentials not configured (GMAIL_USER or GMAIL_APP_PASSWORD)');
    return;
  }

  try {
    // Create transporter using Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"Event Booking Alerts" <${gmailUser}>`,
      to: to,
      subject: `🚨 [${report.name}] ${report.message.substring(0, 50)}...`,
      html: formatEmailBody(report),
      text: `
Error Reference: ${report.id}
Message: ${report.message}
Type: ${report.name || 'Unknown'}
Stack Trace:
${report.stack || 'No stack trace available'}
      `,
    });

    console.log(`✓ Email sent via Gmail to ${to} (Message ID: ${info.messageId})`);
  } catch (err) {
    console.error('Gmail send failed:', err);
    throw err;
  }
}

/**
 * Send email notification to developers
 */
async function notifyDevelopers(report: ErrorReport): Promise<void> {
  const email = process.env.ALERT_EMAIL || '';
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL || '';

  if (!email && !webhookUrl) {
    console.warn('⚠️ No alert channel configured (ALERT_EMAIL or DISCORD_WEBHOOK_URL)');
    return;
  }

  // Send to email if configured
  if (email) {
    try {
      const emailProvider = process.env.EMAIL_PROVIDER || 'gmail';

      if (emailProvider === 'gmail') {
        // Send via Gmail using nodemailer
        await sendEmailViaGmail(email, report);
      } else if (emailProvider === 'resend') {
        // Implementation with Resend
        try {
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);

          await resend.emails.send({
            from: 'alerts@eventbooking.com',
            to: email,
            subject: `🚨 [${report.name}] ${report.message.substring(0, 50)}...`,
            html: formatEmailBody(report),
          });

          console.log(`✓ Email sent to ${email}`);
        } catch (resendErr) {
          console.error('Resend email failed:', resendErr);
          // Fallback: log to console
          console.log(`📧 ERROR EMAIL TO ${email}:\n${formatEmailBody(report)}`);
        }
      } else if (emailProvider === 'sendgrid') {
        // Implementation with SendGrid (optional - install: npm install @sendgrid/mail)
        try {
          // Dynamically require to avoid build error if not installed
          const sgMail = (global as any).sgMail || require('@sendgrid/mail');
          sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

          await sgMail.send({
            to: email,
            from: process.env.SENDGRID_FROM_EMAIL || 'alerts@eventbooking.com',
            subject: `🚨 [${report.name}] ${report.message.substring(0, 50)}...`,
            html: formatEmailBody(report),
          });

          console.log(`✓ Email sent via SendGrid to ${email}`);
        } catch (sgErr) {
          if ((sgErr as any)?.code === 'MODULE_NOT_FOUND') {
            console.error('SendGrid module not installed. Install with: npm install @sendgrid/mail');
          } else {
            console.error('SendGrid email failed:', sgErr);
          }
          console.log(`📧 Fallback: ERROR EMAIL TO ${email}:\n${formatEmailBody(report)}`);
        }
      } else {
        // Console/Log fallback (always works)
        console.log(`📧 ALERT EMAIL TO ${email}:`);
        console.log(formatEmailBody(report));
      }
    } catch (err) {
      console.error('Failed to send email notification:', err);
    }
  }

  // Send to Discord webhook if configured
  if (webhookUrl) {
    try {
      const embed = {
        title: '🚨 Application Error Detected',
        description: report.message,
        color: 16711680, // Red
        fields: [
          { name: 'Error ID', value: `\`${report.id}\``, inline: true },
          { name: 'Type', value: report.name || 'Unknown', inline: true },
          { name: 'URL', value: report.url, inline: false },
          { name: 'Timestamp', value: report.timestamp, inline: true },
          {
            name: 'Stack Trace',
            value: `\`\`\`${(report.stack || 'No stack trace').substring(0, 1000)}\`\`\``,
            inline: false,
          },
        ],
        footer: { text: 'Event Ticket Booking System' },
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
      });

      console.log('✓ Discord notification sent');
    } catch (err) {
      console.error('Failed to send Discord notification:', err);
    }
  }
}

/**
 * Main handler - catches and logs errors
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const report = parseErrorReport(data);

    if (!report) {
      return NextResponse.json(
        { error: 'Invalid error report format' },
        { status: 400 }
      );
    }

    // Log to console with full stack trace (100% requirement)
    console.error(formatErrorLog(report));

    // Log to external service (e.g., Sentry, Datadog)
    if (process.env.SENTRY_DSN) {
      console.log(`📊 Would send to Sentry: ${report.id}`);
    }

    // Notify developers
    await notifyDevelopers(report);

    return NextResponse.json(
      {
        success: true,
        errorId: report.id,
        message: 'Error reported successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in notify-devs endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}

/**
 * Health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/notify-devs',
    description: 'Error notification endpoint',
    method: 'POST',
  });
}

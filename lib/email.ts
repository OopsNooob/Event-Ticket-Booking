import nodemailer from "nodemailer";

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  throw new Error("Gmail credentials are not set in environment variables");
}

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendTicketEmail({
  to,
  ticketId,
  eventName,
  eventDate,
  eventLocation,
  qrCodeDataUrl,
}: {
  to: string;
  ticketId: string;
  eventName: string;
  eventDate: number;
  eventLocation: string;
  qrCodeDataUrl: string;
}) {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Event Ticket</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(to right, #2563eb, #9333ea); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px;">🎟️ Your Ticket</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Event Ticket Booking</p>
            </td>
          </tr>
          
          <!-- Event Info -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">${eventName}</h2>
              
              <table width="100%" cellpadding="8" cellspacing="0">
                <tr>
                  <td style="color: #6b7280; font-size: 14px; border-bottom: 1px solid #e5e7eb;">📅 Date:</td>
                  <td style="color: #1f2937; font-weight: bold; text-align: right; border-bottom: 1px solid #e5e7eb;">
                    ${new Date(eventDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </td>
                </tr>
                <tr>
                  <td style="color: #6b7280; font-size: 14px; border-bottom: 1px solid #e5e7eb;">📍 Location:</td>
                  <td style="color: #1f2937; font-weight: bold; text-align: right; border-bottom: 1px solid #e5e7eb;">${eventLocation}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280; font-size: 14px; border-bottom: 1px solid #e5e7eb;">🎫 Ticket ID:</td>
                  <td style="color: #1f2937; font-weight: bold; text-align: right; font-family: monospace; border-bottom: 1px solid #e5e7eb;">
                    ${ticketId.slice(-8).toUpperCase()}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- QR Code -->
          <tr>
            <td style="padding: 0 30px 40px 30px; text-align: center;">
              <div style="background-color: #f9fafb; padding: 30px; border-radius: 12px; display: inline-block;">
                <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 250px; height: 250px; display: block;" />
              </div>
              <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
                Show this QR code at the event entrance for verification
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Thank you for your purchase!<br>
                If you have any questions, please contact our support team.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0;">
                © ${new Date().getFullYear()} Event Ticket Booking. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    console.log("📧 Sending email to:", to);

    const info = await transporter.sendMail({
      from: `"Event Ticket Booking" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: `Your Ticket for ${eventName}`,
      html: emailHtml,
    });

    console.log("✅ Email sent successfully:", info.messageId);
    return { success: true, data: { messageId: info.messageId } };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return { success: false, error };
  }
}

export async function sendMultipleTicketsEmail({
  to,
  tickets,
  eventName,
  eventDate,
  eventLocation,
}: {
  to: string;
  tickets: Array<{
    ticketId: string;
    qrCodeDataUrl: string;
  }>;
  eventName: string;
  eventDate: number;
  eventLocation: string;
}) {
  const ticketsHtml = tickets
    .map(
      (ticket, index) => `
    <div style="margin-bottom: 30px; padding: 20px; border: 2px dashed #e5e7eb; border-radius: 12px; background-color: #ffffff;">
      <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Ticket ${index + 1} of ${tickets.length}</h3>
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 15px 0;">
        <strong>Ticket ID:</strong> <span style="font-family: monospace; color: #2563eb;">${ticket.ticketId.slice(-8).toUpperCase()}</span>
      </p>
      <div style="text-align: center; background-color: #f9fafb; padding: 20px; border-radius: 8px;">
        <img src="${ticket.qrCodeDataUrl}" alt="QR Code ${index + 1}" style="width: 200px; height: 200px; display: block; margin: 0 auto;" />
      </div>
    </div>
  `
    )
    .join("");

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Event Tickets</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(to right, #2563eb, #9333ea); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px;">🎟️ Your Tickets</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Event Ticket Booking</p>
            </td>
          </tr>
          
          <!-- Event Info -->
          <tr>
            <td style="padding: 40px 30px 20px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">${eventName}</h2>
              
              <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                <p style="color: #1e40af; margin: 0; font-weight: bold; font-size: 16px;">
                  🎉 You have purchased ${tickets.length} ticket${tickets.length > 1 ? 's' : ''}
                </p>
              </div>
              
              <table width="100%" cellpadding="8" cellspacing="0">
                <tr>
                  <td style="color: #6b7280; font-size: 14px; border-bottom: 1px solid #e5e7eb;">📅 Date:</td>
                  <td style="color: #1f2937; font-weight: bold; text-align: right; border-bottom: 1px solid #e5e7eb;">
                    ${new Date(eventDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </td>
                </tr>
                <tr>
                  <td style="color: #6b7280; font-size: 14px; border-bottom: 1px solid #e5e7eb;">📍 Location:</td>
                  <td style="color: #1f2937; font-weight: bold; text-align: right; border-bottom: 1px solid #e5e7eb;">${eventLocation}</td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Tickets -->
          <tr>
            <td style="padding: 0 30px 40px 30px;">
              ${ticketsHtml}
              <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0; text-align: center;">
                Show these QR codes at the event entrance for verification
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Thank you for your purchase!<br>
                If you have any questions, please contact our support team.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0;">
                © ${new Date().getFullYear()} Event Ticket Booking. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    console.log("📧 Sending email with", tickets.length, "tickets to:", to);

    const info = await transporter.sendMail({
      from: `"Event Ticket Booking" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: `Your ${tickets.length} Ticket${tickets.length > 1 ? 's' : ''} for ${eventName}`,
      html: emailHtml,
    });

    console.log("✅ Email sent successfully:", info.messageId);
    return { success: true, data: { messageId: info.messageId } };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return { success: false, error };
  }
}
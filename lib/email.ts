import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set");
}

const resend = new Resend(process.env.RESEND_API_KEY);

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
  try {
    const { data, error } = await resend.emails.send({
      from: "ETB Tickets <onboarding@resend.dev>", // Change to your verified domain
      to: [to],
      subject: `Your Ticket for ${eventName}`,
      html: `
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
      `,
    });

    if (error) {
      console.error("Error sending email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}
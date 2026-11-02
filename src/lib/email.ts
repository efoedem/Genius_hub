import { Resend } from "resend";

export async function sendOrderEmail({
  toEmail,
  orderId,
  serviceName,
  totalAmount,
  status,
}: {
  toEmail: string;
  orderId: string;
  serviceName: string;
  totalAmount: string;
  status: "received" | "completed";
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is missing. Skipping email dispatch.");
    return;
  }

  const resend = new Resend(apiKey);
  const fromEmail = process.env.EMAIL_FROM || "Genius Engineering & Tech <onboarding@resend.dev>";
  const isCompleted = status === "completed";

  const subject = isCompleted
    ? `Your Project is Completed! (${orderId})`
    : `Order Confirmation: ${orderId}`;

  const messageHeading = isCompleted
    ? "Your order has been completed!"
    : "Your order has been successfully received.";

  const callToActionText = isCompleted ? "Download Completed Work" : "View Order Portal";

  // Create a unique key using the order ID, status, and current timestamp
  const idempotencyKey = `email-${orderId}-${status}-${Date.now()}`;

  try {
    const { data, error } = await resend.emails.send(
      {
        from: fromEmail,
        to: [toEmail],
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #7f1d1d; margin-top: 0;">${messageHeading}</h2>
            <p>Hello,</p>
            <p>Your order for <strong>${serviceName}</strong> has been updated.</p>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
              <p style="margin: 5px 0;"><strong>Total Amount:</strong> GH₵${totalAmount}</p>
              <p style="margin: 5px 0;"><strong>Current Status:</strong> <span style="text-transform: uppercase; color: ${
                isCompleted ? "#16a34a" : "#ca8a04"
              }; font-weight: bold;">${status}</span></p>
            </div>
            <p>You can track, download files, or check updates live at:</p>
            <a href="http://localhost:8081/order/${orderId}" style="display: inline-block; background-color: #7f1d1d; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">${callToActionText}</a>
            <p style="margin-top: 30px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px;">Genius Engineering & Tech Automated Notifications</p>
          </div>
        `,
      },
      {
        // Add options with unique idempotencyKey header
        idempotencyKey,
      }
    );

    if (error) {
      console.error(`Failed to send email via Resend to ${toEmail}:`, error);
      return;
    }

    console.log(`Email (${status}) successfully dispatched to ${toEmail}: ID ${data?.id}`);
  } catch (err) {
    console.error("Email dispatch exception:", err);
  }
}

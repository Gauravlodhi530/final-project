const { subscribeToQueue } = require("./broker");
const {sendEmail} = require("../email");

module.exports = function () {
  subscribeToQueue("AUTH_NOTIFICATION.USER_CREATED", async (data) => {


      const fullName = `${data.fullName.firstName} ${data.fullName.lastName || ""}`.trim();

  const emailTemplate = `
    <h1>Welcome to Our Service!</h1>
    <p>Dear ${fullName},</p>
    <p>Thank you for registering with us. We're excited to have you on board!</p>
    <p>If you have any questions, feel free to contact our support team.</p>
    <p>Best regards,<br/>The Team</p>
    <p style="font-size:12px;color:gray;">
      This is an automated message, please do not reply.
    </p>
  `;

  await sendEmail(
    data.email,
    "Welcome to Our Service",
    "Thank you for registering with us.",   // fallback text
    emailTemplate                           // html version
  );
    console.log("Received message from AUTH_NOTIFICATION.USER_CREATED:", data);
  });

  subscribeToQueue("PAYMENT_NOTIFICATION.PAYMENT_COMPLETED", async (data) => {
    const emailTemplate = `
      <h1>Payment Successful!</h1>
      <p>Dear ${data.fullName || "User"},</p>
      <p>Your payment for order ID ${data.orderId} has been successfully processed.</p>
      <p>Payment Details:</p>
      <p>Amount: ${data.price.amount / 100} ${data.price.currency}</p>
      <p>Payment ID: ${data.paymentId}</p>
      <p>Thank you for your purchase! If you have any questions, feel free to contact our support team.</p>
      <p>Best regards,<br/>The Team</p>
      <p style="font-size:12px;color:gray;">
        This is an automated message, please do not reply.
      </p>
    `;

    await sendEmail(
      data.email,
      "Payment Successful",
      "Your payment has been successfully processed.",   // fallback text
      emailTemplate                           // html version
    );
  });

    subscribeToQueue("PAYMENT_NOTIFICATION.PAYMENT_FAILED", async (data) => {
      const emailTemplate = `
        <h1>Payment Failed!</h1>
        <p>Dear ${data.fullName || "User"},</p>
        <p>Your payment for order ID ${data.orderId} has failed.</p>
        <p>Please try again or contact our support team for assistance.</p>
        <p>Best regards,<br/>The Team</p>
        <p style="font-size:12px;color:gray;">
          This is an automated message, please do not reply.
        </p>
      `;

      await sendEmail(
        data.email,
        "Payment Failed",
        "Your payment has failed.",   // fallback text
        emailTemplate                           // html version
      );
    });
}
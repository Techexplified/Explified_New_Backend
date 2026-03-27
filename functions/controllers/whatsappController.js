const twilio = require("twilio");

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

exports.sendWhatsAppMessage = async (req, res) => {
  const { receiver, message } = req.body;

  if (!receiver || !message) {
    return res
      .status(400)
      .json({ error: "Receiver and message are required." });
  }

  const MAX_LENGTH = 1600;
  const trimmedMessage =
    message.length > MAX_LENGTH
      ? message.slice(0, MAX_LENGTH - 3) + "..."
      : message;

  try {
    const response = await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${receiver}`,
      body: trimmedMessage,
    });

    res.json({
      success: true,
      sid: response.sid,
      message: "WhatsApp message sent successfully!",
    });
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    res.status(500).json({ error: "Failed to send WhatsApp message." });
  }
};

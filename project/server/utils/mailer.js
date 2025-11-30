const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendCertificateEmail = async (to, participantName, workshopTitle, pdfBuffer) => {
  const mailOptions = {
    from: `"Eventity" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Workshop Certificate 🎓",

    // ✅ Plain text fallback
    text: `Congratulations ${participantName}! Your certificate for "${workshopTitle}" is attached.`,

    // ✅ SAFE CLEAN HTML (NO EXTERNAL LINKS – NO CRASHING)
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #2c3e50;">🎓 Congratulations ${participantName}!</h2>
        <p>You have successfully completed the workshop:</p>

        <p style="font-weight: bold; color: #16a085;">
          ${workshopTitle}
        </p>

        <p>Your official certificate is attached as a PDF file.</p>

        <br/>
        <p>Best regards,</p>
        <p><strong>Eventity Team</strong></p>
      </div>
    `,

    attachments: [
      {
        filename: "certificate.pdf",
        content: pdfBuffer,
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("✅ CERTIFICATE EMAIL SENT:", info.response);
};

module.exports = sendCertificateEmail;

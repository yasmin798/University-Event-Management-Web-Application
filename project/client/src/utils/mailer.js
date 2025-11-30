const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendCertificateEmail = async (to, pdfBuffer) => {
  const info = await transporter.sendMail({
    from: `"Eventity" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Workshop Certificate",
    text: "Congratulations! Your certificate is attached.",
    attachments: [
      {
        filename: "certificate.pdf",
        content: pdfBuffer,
      },
    ],
  });

  console.log("✅ REAL EMAIL SENT:", info.response);
};

module.exports = sendCertificateEmail;

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendCertificateEmail = async (to, pdfBuffer) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Workshop Certificate",
    text: "Congratulations! Your certificate is attached.",
    attachments: [
      {
        filename: "certificate.pdf",
        content: pdfBuffer,
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("✅ REAL EMAIL SENT:", info.response);
};

module.exports = sendCertificateEmail;

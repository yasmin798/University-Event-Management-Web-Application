const PDFDocument = require("pdfkit");

const generateCertificatePDF = ({ name, workshopTitle }) => {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: "A4" });
    let buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    doc.fontSize(26).text("Certificate of Attendance", { align: "center" });
    doc.moveDown(2);
    doc.fontSize(18).text(`This certifies that`, { align: "center" });
    doc.moveDown();
    doc.fontSize(22).text(name, { align: "center" });
    doc.moveDown();
    doc.fontSize(16).text(`has attended the workshop`, { align: "center" });
    doc.moveDown();
    doc.fontSize(18).text(workshopTitle, { align: "center" });
    doc.moveDown(3);
    doc.fontSize(12).text(`Issued on: ${new Date().toDateString()}`, {
      align: "center",
    });

    doc.end();
  });
};

module.exports = generateCertificatePDF;

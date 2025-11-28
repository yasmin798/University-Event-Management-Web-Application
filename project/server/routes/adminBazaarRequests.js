// server/routes/adminBazaarRequests.js
const express = require("express");
const router = express.Router();
const BazaarApplication = require("../models/BazaarApplication");
const Bazaar = require("../models/Bazaar");
const nodemailer = require("nodemailer");

// Price table for bazaar booths
const BAZAAR_PRICE_TABLE = {
  "2x2": 300,
  "4x4": 1000,
};

// PATCH: update vendor request status (accept/reject)
router.patch("/:id", async (req, res) => {
  console.log("=== ADMIN BAZAAR REQUESTS PATCH ROUTE HIT ===");
  console.log("ID:", req.params.id);
  console.log("Body:", req.body);
  
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const validStatuses = ["pending", "accepted", "rejected"];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res
        .status(400)
        .json({ error: "Invalid status. Must be pending, accepted, or rejected." });
    }

    const request = await BazaarApplication.findById(id).populate("bazaar");
    if (!request) {
      return res.status(404).json({ error: "Vendor request not found" });
    }

    // Update status and payment deadline using direct MongoDB update to bypass Mongoose validation
    let paymentDeadline = null;
    const updateFields = {
      status: status.toLowerCase(),
    };
    
    // Set payment deadline if accepted (14 days from now)
    if (status.toLowerCase() === "accepted") {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 14);
      updateFields.paymentDeadline = deadline;
      paymentDeadline = deadline;
    }
    
    // Use updateOne to bypass all validation
    await BazaarApplication.collection.updateOne(
      { _id: request._id },
      { $set: updateFields }
    );

    // Send email notification to vendor
    if (request.attendees && request.attendees.length > 0) {
      const vendorEmail = request.attendees[0].email;
      const vendorName = request.attendees[0].name;

      if (vendorEmail) {
        try {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });

          let emailSubject = "";
          let emailBody = "";

          if (status.toLowerCase() === "accepted") {
            const boothPrice = BAZAAR_PRICE_TABLE[request.boothSize] || 0;
            const bazaarTitle = request.bazaar?.title || "Bazaar Event";
            const deadlineStr = paymentDeadline ? paymentDeadline.toLocaleDateString() : "within 14 days";

            emailSubject = `Bazaar Vendor Application Accepted – ${bazaarTitle}`;
            emailBody = `Dear ${vendorName},

Congratulations! Your application for a ${request.boothSize} booth at ${bazaarTitle} has been ACCEPTED.

Application Details:
- Booth Size: ${request.boothSize}
- Price: ${boothPrice} EGP
- Payment Deadline: ${deadlineStr}

Please complete your payment before the deadline to secure your booth.

Best regards,
Eventity Team`;
          } else if (status.toLowerCase() === "rejected") {
            const bazaarTitle = request.bazaar?.title || "Bazaar Event";

            emailSubject = `Bazaar Vendor Application Status – ${bazaarTitle}`;
            emailBody = `Dear ${vendorName},

Thank you for your interest in participating at ${bazaarTitle}.

Unfortunately, your application for a ${request.boothSize} booth has not been accepted at this time.

If you have any questions, please contact us.

Best regards,
Eventity Team`;
          }

          if (emailSubject && emailBody) {
            await transporter.sendMail({
              from: `"Eventity" <${process.env.EMAIL_USER}>`,
              to: vendorEmail,
              subject: emailSubject,
              text: emailBody,
            });
            console.log(`Email sent successfully to ${vendorEmail}`);
          }
        } catch (emailErr) {
          console.error("Error sending email to vendor:", emailErr);
          console.error("Email details:", {
            to: vendorEmail,
            vendorName,
            boothSize: request.boothSize,
            bazaarTitle: request.bazaar?.title
          });
          // Don't fail the request if email fails
        }
      }
    }

    res.json({
      success: true,
      message: `Request ${status} successfully`,
      request,
    });
  } catch (err) {
    console.error("Error updating vendor request:", err);
    res.status(500).json({ error: "Server error updating vendor request" });
  }
});

module.exports = router;

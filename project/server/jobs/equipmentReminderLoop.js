const nodemailer = require("nodemailer");
const EquipmentReservation = require("../models/EquipmentReservation");

function parseStartDateTime(dateStr, timeRangeStr) {
  // Robust parse: dateStr = YYYY-MM-DD, timeRangeStr = "h:mm AM - h:mm PM"
  // Build a local Date using explicit components to avoid locale parsing issues
  try {
    const [startStr] = String(timeRangeStr)
      .split("-")
      .map((s) => s.trim());
    const match = startStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();

    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;

    const [y, m, d] = dateStr.split("-").map((x) => parseInt(x, 10));
    // Construct local time (not UTC) so comparisons with new Date() work as expected
    const dt = new Date(y, m - 1, d, hour, minute, 0, 0);
    return dt;
  } catch (e) {
    console.error("Reminder parse error:", e);
    return null;
  }
}

async function sendReminderEmail({ to, sport, date, time, items }) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    logger: true,
    debug: true,
  });

  try {
    const ok = await transporter.verify();
    console.log("📮 SMTP verify:", ok ? "OK" : "FAILED");
  } catch (e) {
    console.error("❌ SMTP verify failed:", e?.message || e);
  }

  const itemsList = items.map((i) => `${i.name} × ${i.quantity}`).join(", ");
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 16px;">
      <h3 style="color:#1D4ED8;">Equipment Pickup Reminder</h3>
      <p>You reserved equipment for <strong>${sport}</strong> on <strong>${new Date(
    date
  ).toLocaleDateString()}</strong> at <strong>${time}</strong>.</p>
      <p>Please pick up the following items <strong>5 minutes before</strong> your booking time:</p>
      <p style="background:#F3F4F6; padding:10px; border-radius:8px;">${itemsList}</p>
      <p>Have fun and play safely!</p>
      <p style="color:#64748B; font-size:12px;">— Eventity Team</p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Eventity" <${process.env.EMAIL_USER}>`,
      to,
      bcc: process.env.EMAIL_USER, // receive a copy to verify delivery
      subject: "Equipment Pickup Reminder",
      html,
      text: `Equipment Pickup Reminder\nSport: ${sport}\nDate: ${new Date(
        date
      ).toLocaleDateString()}\nTime: ${time}\nItems: ${items
        .map((i) => `${i.name} x ${i.quantity}`)
        .join(", ")}`,
      replyTo: process.env.EMAIL_USER,
    });
    console.log("📦 Nodemailer response messageId:", info.messageId);
    if (info?.accepted?.length) console.log("✅ Accepted:", info.accepted);
    if (info?.rejected?.length) console.warn("⚠️ Rejected:", info.rejected);
    if (info?.response) console.log("📨 SMTP response:", info.response);
  } catch (e) {
    console.error("❌ sendMail error:", e?.message || e);
  }
}

function startEquipmentReminderLoop() {
  console.log("🔔 Equipment reminder loop started");
  const intervalMs = 60 * 1000; // every minute
  setInterval(async () => {
    try {
      const now = new Date();
      const upcoming = await EquipmentReservation.find({ reminderSent: false });
      console.log(
        `🔎 Checking ${
          upcoming.length
        } equipment reservations at ${now.toLocaleString()}`
      );
      for (const r of upcoming) {
        const startAt = parseStartDateTime(r.date, r.time);
        if (!startAt) continue;
        const fiveMinMs = 5 * 60 * 1000;
        const target = new Date(startAt.getTime() - fiveMinMs);
        const diffToTargetMs = now.getTime() - target.getTime();
        const sendWindowMs = 60 * 1000; // send within 60s window centered at target
        // Send when we enter the 1-minute window starting exactly 5 minutes before
        if (diffToTargetMs >= 0 && diffToTargetMs < sendWindowMs) {
          await sendReminderEmail({
            to: r.studentEmail,
            sport: r.courtName,
            date: r.date,
            time: r.time,
            items: r.items,
          });
          r.reminderSent = true;
          await r.save();
          console.log(
            `📧 Equipment reminder sent to ${
              r.studentEmail
            } at ${now.toLocaleTimeString()} (target ${target.toLocaleTimeString()})`
          );
        } else {
          // Verbose logging to diagnose timing mismatches
          console.log(
            `⏱ Reservation ${
              r._id
            }: start ${startAt.toLocaleString()} | target ${target.toLocaleTimeString()} | now ${now.toLocaleTimeString()} | Δtarget ${(
              diffToTargetMs / 60000
            ).toFixed(2)} min`
          );
        }
      }
    } catch (err) {
      console.error("Equipment reminder loop error:", err);
    }
  }, intervalMs);
}

module.exports = { startEquipmentReminderLoop };

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const mongoose = require('mongoose');

// GET /api/vendors/loyalty
// Returns list of vendors participating in GUC loyalty program
router.get('/loyalty', async (req, res) => {
  try {
    // Only vendors who have isLoyaltyPartner true
    const partners = await User.find({ role: 'vendor', isLoyaltyPartner: true })
      .select('companyName email loyalty')
      .lean();

    // Format response: include human-friendly discount rate and promo code
    const formatted = partners.map((p) => ({
      id: p._id,
      companyName: p.companyName || p.email,
      email: p.email,
      discountRate: p.loyalty?.discountRate || 0,
      promoCode: p.loyalty?.promoCode || null,
      terms: p.loyalty?.terms || null,
      validFrom: p.loyalty?.validFrom || null,
      validTo: p.loyalty?.validTo || null,
    }));

    res.json({ partners: formatted });
  } catch (err) {
    console.error('GET /api/vendors/loyalty error:', err);
    res.status(500).json({ error: 'Failed to fetch loyalty partners' });
  }
});

module.exports = router;

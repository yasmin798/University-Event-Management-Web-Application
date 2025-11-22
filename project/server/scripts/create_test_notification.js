require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const Notification = require('../models/Notification');

async function run() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI not set in .env');
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const eventsOffice = await User.findOne({ role: 'events_office', status: 'active' });
    if (!eventsOffice) {
      console.log('No events_office user found. Create one first.');
      process.exit(0);
    }

    const n = new Notification({
      userId: eventsOffice._id,
      message: 'Test: New vendor application pending',
      type: 'vendor_application',
    });

    const saved = await n.save();
    console.log('Created notification:', saved._id.toString());
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();

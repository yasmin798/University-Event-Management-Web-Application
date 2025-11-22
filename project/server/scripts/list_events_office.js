require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({ role: 'events_office' }).select('email status');
    if (!users.length) {
      console.log('No events_office users found.');
    } else {
      console.log('events_office users:');
      users.forEach(u => console.log(`- ${u._id}  ${u.email}  (${u.status})`));
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

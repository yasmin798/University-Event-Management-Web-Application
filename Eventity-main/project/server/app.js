require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');  // For hashing

const app = express();
app.use(express.json());
const cors = require('cors');
app.use(cors({ origin: 'http://localhost:3001' }));  // Allows React on 3001
// Connect to "signup" database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to signup DB'))
  .catch(err => console.error('❌ DB connection error:', err));

const User = require('./models/User');  // Import from models folder

// Signup route: Saves student info to "signup" DB
app.post('/api/register', async (req, res) => {
  try {
    const { firstName, lastName, roleSpecificId, email, password, role: requestedRole } = req.body;

    // Enforce role
    let correctRole;
    switch (requestedRole) {
      case 'student': correctRole = 'student'; break;
      case 'professor': correctRole = 'professor'; break;
      case 'staff': correctRole = 'staff'; break;
      case 'ta': correctRole = 'ta'; break;
      default: return res.status(400).json({ error: 'Invalid role' });
    }

    // Check duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    // Create and save user directly (isVerified true by default)
    const newUser = new User({
      firstName,
      lastName,
      roleSpecificId,
      email,
      password,
      role: correctRole
    });
    await newUser.save();  // Saves to "signup" DB immediately

    res.status(201).json({ message: '✅ Signup successful! Your info has been stored in the signup database for later use.' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// Login route: Queries "signup" DB for authentication
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user in "signup" DB
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    // Compare hashed password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

    // Success: Return user info (no password)
    res.json({
      message: '✅ Login successful!',
      user: {
        id: user._id,
        firstName: user.firstName,
        email: user.email,
        role: user.role,
        roleSpecificId: user.roleSpecificId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
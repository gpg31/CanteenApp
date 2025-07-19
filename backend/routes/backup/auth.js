const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { auth } = require('../middleware/auth');
const supabase = require('../config/supabase');

// Register
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, role = 'customer' } = req.body;

    // Register the user with Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role
        }
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      return res.status(400).json({ message: authError.message });
    }

    // Create record in our User model to maintain compatibility with existing code
    // This syncs Supabase Auth with our database model
    const user = await User.create({
      user_id: authData.user.id,
      full_name,
      email,
      password_hash: '**SUPABASE_MANAGED**', // We don't store actual password hash as Supabase manages it
      role
    });

    // Get the session token from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return res.status(500).json({ message: 'Failed to generate session token' });
    }

    res.status(201).json({
      user: {
        id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      },
      token: session.access_token
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get user details from our database
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // This would be unusual since we should have created this record during registration
      // But we'll handle it by creating the record now
      try {
        const { data: userData } = await supabase.auth.getUser(authData.session.access_token);
        const userMetadata = userData.user.user_metadata;
        
        // Create the user record in our database
        const newUser = await User.create({
          user_id: userData.user.id,
          full_name: userMetadata.full_name || 'User',
          email,
          password_hash: '**SUPABASE_MANAGED**',
          role: userMetadata.role || 'customer'
        });
        
        return res.json({
          user: {
            id: newUser.user_id,
            full_name: newUser.full_name,
            email: newUser.email,
            role: newUser.role
          },
          token: authData.session.access_token
        });
      } catch (error) {
        return res.status(500).json({ message: 'Error syncing user data' });
      }
    }

    res.json({
      user: {
        id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      },
      token: authData.session.access_token
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Get user details from our database
    const user = await User.findOne({ where: { user_id: userData.user.id } });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      user: {
        id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) {
      return res.status(401).json({ valid: false, message: 'Invalid token' });
    }
    
    // Get user details from our database
    const user = await User.findOne({ where: { user_id: data.user.id } });
    
    if (!user) {
      return res.status(404).json({ valid: false, message: 'User not found' });
    }
    
    res.json({
      valid: true,
      user: {
        id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ valid: false, message: 'Server error' });
  }
});

module.exports = router;

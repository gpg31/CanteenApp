const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { auth } = require('../middleware/auth');
const { supabase } = require('../config/database');

// Register
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, role = 'customer' } = req.body;

    console.log('Starting registration process for:', email);

    // First check if user already exists in Supabase
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Register the user with Supabase Auth
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
      console.error('Supabase Auth Error:', authError);
      return res.status(400).json({ message: authError.message });
    }

    if (!authData.user) {
      console.error('No user data returned from Supabase');
      return res.status(500).json({ message: 'Failed to create user' });
    }

    console.log('User created in Supabase Auth:', authData.user.id);

    // Create user record in Supabase database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        full_name,
        email,
        role
      }])
      .select()
      .single();

    if (userError) {
      console.error('Database Error:', userError);
      return res.status(500).json({ message: 'Failed to create user profile' });
    }

    console.log('User profile created:', userData);

    // Get the session token
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

    console.log('Login attempt for:', email);

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Login Error:', authError);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!authData.user) {
      console.error('No user data returned from Supabase');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Get user profile from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.error('Database Error:', userError);
      return res.status(500).json({ message: 'Error retrieving user profile' });
    }

    if (!userData) {
      console.error('No user profile found for id:', authData.user.id);
      return res.status(404).json({ message: 'User profile not found' });
    }

    console.log('User logged in successfully:', userData);

    // Return user data and session token
    res.json({
      user: {
        user_id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role
      },
      token: authData.session.access_token
    });
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
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

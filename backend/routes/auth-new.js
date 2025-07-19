const express = require('express');
const router = express.Router();
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
        user_id: userData.id,
        full_name: userData.full_name,
        email: userData.email,
        role: userData.role
      },
      token: session.access_token
    });
  } catch (error) {
    console.error('Server Error:', error);
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

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (userError) {
      return res.status(500).json({ message: 'Error retrieving user profile' });
    }

    if (!userData) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    res.json({
      user: {
        user_id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

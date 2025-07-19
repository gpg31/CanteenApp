const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { auth } = require('../middleware/auth');
const { roleAuth } = require('../middleware/roleAuth');
const bcrypt = require('bcryptjs');

// Get user profile
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findOne({
      where: { user_id: req.user.user_id },
      attributes: ['user_id', 'full_name', 'email', 'role', 'created_at']
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.patch('/', auth, async (req, res) => {
  try {
    const { full_name, phone, address } = req.body;
    
    if (!full_name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const user = await User.findOne({ where: { user_id: req.user.user_id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.full_name = full_name;
    if (phone !== undefined) user.phone_number = phone;
    if (address !== undefined) user.address = address;
    await user.save();

    res.json({
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.patch('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ where: { user_id: req.user.user_id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, 10);
    user.password_hash = password_hash;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get profile for a specific user (admin only)
router.get('/:user_id', roleAuth(['admin']), async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const user = await User.findOne({
      where: { user_id },
      attributes: ['user_id', 'full_name', 'email', 'role', 'created_at']
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile for a specific user (admin only)
router.put('/:user_id', roleAuth(['admin']), async (req, res) => {
  try {
    const { user_id } = req.params;
    const { full_name, role } = req.body;
    
    const user = await User.findOne({ where: { user_id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (full_name) user.full_name = full_name;
    if (role && ['customer', 'vendor', 'admin'].includes(role)) user.role = role;

    await user.save();

    res.json({
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Handle profile picture uploads
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../public/uploads/profile-pictures');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const fileExtension = path.extname(file.originalname);
    cb(null, `${uuidv4()}${fileExtension}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Upload profile picture
router.post('/upload-picture', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const user = await User.findOne({ where: { user_id: req.user.user_id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate URL for the uploaded file
    const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3001}`;
    const imageUrl = `${serverUrl}/uploads/profile-pictures/${req.file.filename}`;
    
    // Update user profile with new image URL
    user.profile_picture_url = imageUrl;
    await user.save();
    
    res.json({ 
      message: 'Profile picture uploaded successfully',
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

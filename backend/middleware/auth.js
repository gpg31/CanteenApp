const { supabase } = require('../config/database');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No token provided');
    }

    // Verify token with Supabase
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      throw new Error('Invalid or expired token');
    }

    // Get user from our database
    const user = await User.findById(authUser.id);

    if (!user) {
      throw new Error('User not found');
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate.' });
  }
};

const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    next();
  };
};

module.exports = { auth, checkRole };

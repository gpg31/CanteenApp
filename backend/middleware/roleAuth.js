const supabase = require('../config/supabase');
const { User } = require('../models');

const roleAuth = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Get token from header (check both formats)
      const token = req.header('Authorization')?.replace('Bearer ', '') || req.header('x-auth-token');
      
      // Check if no token
      if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
      }
      
      // Verify token with Supabase
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
      
      // Get user from database to check current role
      const user = await User.findOne({ where: { user_id: data.user.id } });
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      // Check if user role is allowed
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: 'Access denied. Not authorized for this resource' });
      }
      
      // Add user to request object
      req.user = user;
      next();
    } catch (err) {
      res.status(401).json({ message: 'Token is not valid' });
    }
  };
};

module.exports = { roleAuth };

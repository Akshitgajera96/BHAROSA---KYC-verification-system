// 🔒 Authentication Middleware
import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

/**
 * Protect routes - require authentication
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      console.log('⚠️  No token provided in request');
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please provide a valid token.'
      });
    }

    try {
      // Verify token
      console.log('🔑 Verifying token...');
      const decoded = verifyToken(token);
      console.log(`✅ Token valid for user ID: ${decoded.id}`);

      // Get user from token with timeout
      console.log('👤 Fetching user from database...');
      const userPromise = User.findById(decoded.id).select('-password');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      );
      
      req.user = await Promise.race([userPromise, timeoutPromise]);

      if (!req.user) {
        console.log('❌ User not found in database');
        return res.status(401).json({
          success: false,
          message: 'User not found. Token may be invalid.'
        });
      }

      console.log(`✅ User authenticated: ${req.user.email}`);
      next();
    } catch (error) {
      console.error('❌ Token verification error:', error.message);
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication',
      error: error.message
    });
  }
};

/**
 * Authorize specific roles
 * @param  {...String} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

/**
 * Optional authentication - attach user if token is valid but don't block
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = verifyToken(token);
        req.user = await User.findById(decoded.id).select('-password');
      } catch (error) {
        // Token is invalid but we don't block the request
        console.log('Optional auth failed:', error.message);
      }
    }

    next();
  } catch (error) {
    next();
  }
};

export default {
  protect,
  authorize,
  optionalAuth
};

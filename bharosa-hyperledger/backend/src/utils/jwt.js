// 🔐 JWT Token Utility Functions
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET_KEY;
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '2d';

/**
 * Generate JWT token for user
 * @param {Object} payload - User data to encode in token
 * @returns {String} JWT token
 */
export const generateToken = (payload) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET_KEY is not defined in environment variables');
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY
  });
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Decode token without verification (for debugging)
 * @param {String} token - JWT token
 * @returns {Object} Decoded token
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};

export default {
  generateToken,
  verifyToken,
  decodeToken
};

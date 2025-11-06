// 👤 Authentication Controller
import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { email, password, fullName, phoneNumber } = req.body;

    // Validate input
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, and full name'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      fullName,
      phoneNumber
    });

    // Generate token
    const token = generateToken({ id: user._id, email: user.email, role: user.role });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          kycStatus: user.kycStatus,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken({ id: user._id, email: user.email, role: user.role });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          kycStatus: user.kycStatus,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('kycRecordId');

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          kycStatus: user.kycStatus,
          role: user.role,
          kycRecord: user.kycRecordId,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber } = req.body;

    const user = await User.findById(req.user.id);

    if (fullName) user.fullName = fullName;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber
        }
      }
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

export default {
  register,
  login,
  getMe,
  updateProfile
};

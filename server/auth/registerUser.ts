import { Request, Response } from 'express';
import User from "../models/user";
import { generateToken, setTokenCookie } from '../utils/jwt';

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { first_name, last_name, email, password, confirmPassword, profile_img } = req.body;

    // Validation
    if (!first_name || !last_name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'First name, last name, email and password are required'
      });
      return;
    }

    // Email format validation
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
      return;
    }

    // Password length validation
    if (password.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
      return;
    }

    // Confirm password validation
    if (confirmPassword && password !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
      return;
    }

    // Create new user
    const user = new User({ 
      first_name, 
      last_name, 
      email, 
      password,
      profile_img: profile_img || ""
    });
    await user.save();

    // Generate JWT token
    const token = generateToken({
      userId: (user._id as any).toString(),
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      profile_img: user.profile_img,
    });

    // Set cookie
    setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id as any,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          profile_img: user.profile_img,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
// verify jwt token from frontend
import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';
import User from '../models/user';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticateToken = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    // Check for token in cookie first, then Authorization header
    let token = req.cookies?.authToken;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
      return;
    }

    // Verify the token
    const decoded = verifyToken(token);
    
    // Optional: Check if user still exists in database
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ 
        success: false, 
        message: 'User no longer exists' 
      });
      return;
    }

    // Add user info to request
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

// Route handler for /auth/me endpoint
export const getCurrentUser = async (
  req: Request, 
  res: Response
): Promise<void> => {
  try {
    let token = req.cookies?.authToken;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
      return;
    }

    // Verify the token
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ 
        success: false, 
        message: 'User no longer exists' 
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Token verified successfully',
      data: {
        user: {
          id: user._id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          profile_img: user.profile_img,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token
      }
    });

  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};


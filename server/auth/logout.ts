import { Request, Response } from 'express';
import { clearTokenCookie } from '../utils/jwt';

export const logoutUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Clear the authentication cookie
    clearTokenCookie(res);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

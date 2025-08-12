import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { connectMongoDB } from './utils/connect-mogodb'
import { loginUser } from './auth/login'
import { registerUser } from './auth/registerUser'
import { logoutUser } from './auth/logout'
import { authenticateToken, getCurrentUser } from './auth/check-token'
import { 
  createForm, 
  createFormWithImages,
  getUserForms, 
  getFormById, 
  updateForm, 
  updateFormWithImages,
  deleteForm, 
  toggleFormPublish, 
  getPublicForm,
  makeFormLive,
  registerParticipant,
  submitPublicFormResponse,
  debugScoring
} from './controllers/formController'
import { 
  generateQuestions 
} from './controllers/geminiController'
import { upload } from './utils/cloudinary'

// Load environment variables
dotenv.config()

const app = express()
const port = process.env.PORT || 3000

// CORS configuration - strict in production, permissive in development
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.CLIENT_URL ? [process.env.CLIENT_URL] : false) // Only allow specified client URL in production
    : ['http://localhost:8080', 'http://localhost:3000', 'http://127.0.0.1:8080'], // Development URLs
  credentials: true, // Allow cookies
  optionsSuccessStatus: 200
}

// Middleware
app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' })) // Increased limit for images
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// Security middleware for production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next): void => {
    const origin = req.get('origin');
    const allowedOrigins = process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [];
    
    // Log the request origin for monitoring
    console.log(`Request from origin: ${origin}`);
    
    // Additional security check for production
    if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
      console.warn(`Rejected request from unauthorized origin: ${origin}`);
      res.status(403).json({ 
        success: false, 
        message: 'Forbidden: Unauthorized origin' 
      });
      return;
    }
    
    next();
  });
}

// Connect to MongoDB
connectMongoDB()

// Health check route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Hello World.... Form Builder API Server :)',
        status: 'running',
        timestamp: new Date().toISOString()
    })
})

// Auth routes
app.post('/api/auth/register', registerUser)
app.post('/api/auth/login', loginUser)
app.post('/api/auth/logout', logoutUser)
app.get('/api/auth/me', getCurrentUser)

// Form management routes (protected)
app.post('/api/forms', authenticateToken, createForm)
app.post('/api/forms/with-images', authenticateToken, upload.any(), createFormWithImages)
app.get('/api/forms', authenticateToken, getUserForms)
app.get('/api/forms/:formId', authenticateToken, getFormById)
app.put('/api/forms/:formId', authenticateToken, updateForm)
app.put('/api/forms/:formId/with-images', authenticateToken, upload.any(), updateFormWithImages)
app.delete('/api/forms/:formId', authenticateToken, deleteForm)
app.patch('/api/forms/:formId/publish', authenticateToken, toggleFormPublish)
app.patch('/api/forms/:formId/make-live', authenticateToken, makeFormLive)

// Public form routes (for form filling)
app.get('/api/public/forms/:formUrl', getPublicForm)
app.post('/api/public/forms/:formUrl/participants', registerParticipant)
app.post('/api/public/forms/:formUrl/responses', submitPublicFormResponse)
app.post('/api/debug/forms/:formUrl/scoring', debugScoring)

// Gemini API route
app.post('/api/ai/generate-questions', generateQuestions)

// Protected route example
app.get('/api/profile', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'This is a protected route',
        user: req.user
    })
})

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack)
    res.status(500).json({
        success: false,
        message: 'Something went wrong!'
    })
})

// 404 handler
app.all('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    })
})

app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`)
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`)
})
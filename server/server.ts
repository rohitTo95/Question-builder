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
  getUserForms, 
  getFormById, 
  updateForm, 
  deleteForm, 
  toggleFormPublish, 
  getPublicForm,
  makeFormLive,
  registerParticipant,
  submitPublicFormResponse
} from './controllers/formController'
import { 
  submitFormResponse, 
  getFormResponses
} from './controllers/responseController'
import { 
  generateQuestions 
} from './controllers/geminiController'

// Load environment variables
dotenv.config()

const app = express()
const port = process.env.PORT || 3000

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:8080', 'http://localhost:3000'], // Add your frontend URLs
  credentials: true, // Allow cookies
  optionsSuccessStatus: 200
}

// Middleware
app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' })) // Increased limit for images
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

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
app.get('/api/forms', authenticateToken, getUserForms)
app.get('/api/forms/:formId', authenticateToken, getFormById)
app.put('/api/forms/:formId', authenticateToken, updateForm)
app.delete('/api/forms/:formId', authenticateToken, deleteForm)
app.patch('/api/forms/:formId/publish', authenticateToken, toggleFormPublish)
app.patch('/api/forms/:formId/make-live', authenticateToken, makeFormLive)

// Public form routes (for form filling)
app.get('/api/public/forms/:formUrl', getPublicForm)
app.post('/api/public/forms/:formUrl/participants', registerParticipant)
app.post('/api/public/forms/:formUrl/responses', submitPublicFormResponse)

// Gemini AI routes
app.post('/api/ai/generate-questions', generateQuestions)

// Response management routes (protected)
// app.get('/api/forms/:formId/responses', authenticateToken, getFormResponses)
// app.get('/api/responses/:responseId', authenticateToken, getResponseById)
// app.delete('/api/responses/:responseId', authenticateToken, deleteResponse)
// app.get('/api/forms/:formId/analytics', authenticateToken, getFormAnalytics)

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
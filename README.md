# 📝 Form Builder - Interactive Quiz & Survey Platform

A full-stack MERN application for creating, managing, and taking interactive forms with advanced question types, real-time scoring, and cloud image storage.

Live Demo: https://question-builder.vercel.app/
<br>
Postman Collection: https://.postman.co/workspace/API-DEV~ee750a99-084d-4bcd-aaae-4319aba45ff7/request/42553015-453c10ff-dd81-4c71-a4b5-d2fec37b10cd?action=share&creator=42553015&ctx=documentation
## 🌟 Features

### 🎯 Core Functionality
- **Dynamic Form Creation**: Build forms with multiple question types
- **Interactive Form Taking**: Drag-and-drop interface for participants
- **Real-time Scoring**: Automatic calculation and display of results
- **User Authentication**: Secure JWT-based authentication system
- **Cloud Storage**: Cloudinary integration for image uploads
- **Responsive Design**: Mobile-first, fully responsive interface

### 📊 Question Types
1. **Categorize Questions**: Drag-and-drop items into categories
2. **Cloze (Fill-in-the-blanks)**: Interactive text completion
3. **Comprehension Questions**: Multiple-choice with passages

### 🔐 Security Features
- JWT authentication with httpOnly cookies
- CORS protection with environment-based origins
- Production-ready security middleware
- Input validation and sanitization

### 🖼️ Image Management
- Cloudinary integration for optimized image storage
- WebP conversion and size optimization
- Organized folder structure: `/[user_id]/forms/[form_id]/`
- Progressive loading with skeleton states

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Shadcn/ui** for component library
- **DnD Kit** for drag-and-drop functionality
- **React Router** for navigation

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Cloudinary** for image storage
- **Multer** for file uploads

### AI Integration
- **Google Gemini API** for question generation

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB database
- Cloudinary account
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd form-builder
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**

   **Backend (.env)**
   ```env
   # Database
   MONGODB_CONNECTION=your_mongodb_connection_string
   
   # Authentication
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d
   
   # API Keys
   GEMINI_API_KEY=your_gemini_api_key
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   
   # Environment
   NODE_ENV=development
   PORT=3000
   CLIENT_URL=http://localhost:8080
   ```

   **Frontend (.env)**
   ```env
   # Server Configuration
   VITE_SERVER_URL=http://localhost:3000
   VITE_NODE_ENV=development
   ```

4. **Start the application**
   ```bash
   # Start backend server
   cd server
   npm run dev

   # Start frontend (in new terminal)
   cd client
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3000

## 📁 Project Structure

```
form-builder/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── sections/   # Question type components
│   │   │   └── ui/         # Shadcn/ui components
│   │   ├── pages/          # Main application pages
│   │   ├── services/       # API service layer
│   │   ├── utils/          # Utility functions
│   │   └── hooks/          # Custom React hooks
│   └── public/             # Static assets
│
├── server/                 # Backend Node.js application
│   ├── auth/              # Authentication logic
│   ├── controllers/       # Route controllers
│   ├── models/            # MongoDB models
│   └── utils/             # Backend utilities
│
└── docs/                  # Documentation files
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Form Management
- `GET /api/forms` - Get user's forms
- `POST /api/forms` - Create new form
- `POST /api/forms/with-images` - Create form with images
- `GET /api/forms/:formId` - Get specific form
- `PUT /api/forms/:formId` - Update form
- `PUT /api/forms/:formId/with-images` - Update form with images
- `DELETE /api/forms/:formId` - Delete form
- `PATCH /api/forms/:formId/publish` - Toggle form publish status
- `PATCH /api/forms/:formId/make-live` - Make form publicly accessible

### Public Form Access
- `GET /api/public/forms/:formUrl` - Get public form
- `POST /api/public/forms/:formUrl/participants` - Register participant
- `POST /api/public/forms/:formUrl/responses` - Submit form response

### AI Integration
- `POST /api/ai/generate-questions` - Generate questions using Gemini AI

## 🎮 Usage Guide

### Creating a Form

1. **Sign up/Login** to your account
2. **Navigate** to the Form Builder page
3. **Add Header** information (title, description, optional image)
4. **Add Questions** using the question type buttons:
   - **Categorize**: Create categories and options
   - **Cloze**: Write text with blanks and provide options
   - **Comprehension**: Add passage and multiple-choice questions
5. **Configure** points for each question
6. **Preview** your form before publishing
7. **Publish** to make it accessible to participants

### Taking a Form

1. **Access** the public form URL
2. **Register** with name and email
3. **Complete** questions using drag-and-drop interface
4. **Submit** and view your score

### Managing Forms

- **Dashboard**: View all your created forms
- **Analytics**: Track responses and performance
- **Edit**: Modify existing forms
- **Share**: Get public URLs for distribution

## 🔧 Configuration

### Image Upload Configuration
Images are automatically:
- Converted to WebP format
- Resized to max 1200px width
- Stored in organized folders on Cloudinary
- Optimized for quality and performance

### Scoring System
- Automatic calculation based on question types
- Real-time feedback to participants
- Percentage-based scoring
- Detailed result breakdowns

### Security Configuration
- Environment-based CORS origins
- JWT token expiration management
- Request origin validation in production
- Secure file upload handling

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables:
   ```
   VITE_SERVER_URL=https://your-backend-domain.com
   VITE_NODE_ENV=production
   ```
3. Deploy automatically on push

### Backend (Railway/Render/Heroku)
1. Set production environment variables
2. Ensure `CLIENT_URL` matches your frontend domain
3. Configure MongoDB Atlas connection
4. Deploy with your preferred platform

### Environment Variables for Production
```env
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.com
MONGODB_CONNECTION=your_production_mongodb_url
# ... other production configs
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🛠️ Development

### Available Scripts

**Backend**
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm start          # Start production server
```

**Frontend**
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Lint code
```

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Consistent naming conventions

## 🐛 Troubleshooting

### Common Issues

**CORS Errors**
- Ensure `CLIENT_URL` is set correctly in backend
- Check CORS origins in production

**Image Upload Issues**
- Verify Cloudinary credentials
- Check file size limits (10MB max)
- Ensure proper file types (images only)

**Authentication Problems**
- Clear browser cookies
- Check JWT secret configuration
- Verify token expiration settings

## 📞 Support

For support, please:
1. Check the troubleshooting section
2. Review the API documentation
3. Create an issue on GitHub
4. Contact the development team

## 🔄 Updates

### Latest Features
- ✅ Cloudinary image integration
- ✅ Progressive image loading
- ✅ Enhanced security middleware
- ✅ Environment-based configuration
- ✅ Real-time scoring system

### Upcoming Features
- 📊 Advanced analytics dashboard
- 🔔 Email notifications
- 📱 Mobile app
- 🎨 Custom themes
- 📈 Export functionality

---

**Built with ❤️ using the MERN stack**

*For API documentation and live demo links, see the links section below.*

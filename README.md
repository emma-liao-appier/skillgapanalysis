# Skill Gap Assessment Tool with 360 Feedback

A comprehensive skill assessment platform built with React, Node.js, and MongoDB, featuring AI-powered skill generation and 360-degree feedback capabilities.

## 🌟 Features

### Core Assessment Features
- **Multi-language Support**: English, Chinese, Japanese, Korean, Turkish, French
- **AI-Powered Skill Generation**: Uses Google Gemini AI to generate personalized skills
- **Business & Career Skills**: Separate assessment tracks for business and career development
- **Smart Recommendations**: AI-generated next steps and career advice

### 360 Feedback System
- **Invitation Management**: Send feedback requests to managers, peers, and direct reports
- **Secure Links**: Token-based access for external assessors
- **Anonymized Results**: Aggregate feedback with privacy protection
- **Real-time Notifications**: Track pending feedback requests

### Data Management
- **Google Sheets Import**: Import existing user data from spreadsheets
- **MongoDB Storage**: Scalable NoSQL database for assessments and feedback
- **User Management**: Complete user profiles and assessment history

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React/Vite)  │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
│   Port 3000     │    │   Port 3001     │    │   Port 27017    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐             │
         │              │   Gemini AI     │             │
         └──────────────►│   (Backend)     │◄────────────┘
                        └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- MongoDB (or use Docker)
- Google Gemini API key

### Option 1: Docker Setup (Recommended)

1. **Clone and Setup**
   ```bash
   git clone <your-repo-url>
   cd skillgapanalysis
   ./setup.sh
   ```

2. **Configure Environment**
   ```bash
   # Edit backend environment
   nano backend/.env
   # Add your GEMINI_API_KEY
   ```

3. **Start Services**
   ```bash
   docker-compose up -d
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - MongoDB: localhost:27017

### Option 2: Local Development

1. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

2. **Setup Frontend**
   ```bash
   npm install
   npm run dev
   ```

3. **Start MongoDB**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:7.0
   
   # Or using local MongoDB installation
   mongod
   ```

## 📊 API Endpoints

### Assessment Management
- `POST /api/assessments` - Create new assessment
- `GET /api/assessments/:id` - Get assessment by ID
- `PUT /api/assessments/:id` - Update assessment
- `DELETE /api/assessments/:id` - Delete assessment
- `GET /api/assessments/user/:userId` - Get user's assessments

### AI-Powered Generation
- `POST /api/assessments/:id/generate-business-skills` - Generate business skills
- `POST /api/assessments/:id/generate-career-skills` - Generate career skills
- `POST /api/assessments/:id/generate-key-results` - Generate key results
- `POST /api/assessments/:id/generate-summary` - Generate assessment summary
- `POST /api/assessments/optimize-text` - Optimize text with AI

### 360 Feedback System
- `POST /api/feedback/invites` - Create feedback invites
- `GET /api/feedback/invites` - Get invites for user
- `GET /api/feedback/invites/:inviteId` - Get specific invite
- `POST /api/feedback/invites/:inviteId/accept` - Accept invite
- `POST /api/feedback/invites/:inviteId/decline` - Decline invite
- `POST /api/feedback/invites/:inviteId/respond` - Submit feedback
- `GET /api/feedback/assessees/:assessmentId/summary` - Get feedback summary

### Data Import
- `POST /api/sheets/import` - Import from Google Sheets
- `GET /api/sheets/available` - Get available sheets
- `POST /api/sheets/validate` - Validate sheet data

## 🔧 Configuration

### Environment Variables

#### Backend (`backend/.env`)
```bash
# Server
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/skill-gap-assessment

# AI
GEMINI_API_KEY=your_gemini_api_key_here

# Security
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:3000

# Email (for 360 feedback)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

#### Frontend (`.env`)
```bash
REACT_APP_API_URL=http://localhost:3001
```

## 📋 Database Schema

### Users Collection
```typescript
{
  email: string;
  name: string;
  department?: string;
  role?: string;
  assessments: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Assessments Collection
```typescript
{
  userId: ObjectId;
  language: string;
  role: string;
  careerGoal: string;
  businessGoal: string;
  keyResults: string;
  businessSkills: Skill[];
  careerSkills: Skill[];
  summary?: SummaryData;
  status: 'draft' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}
```

### 360 Feedback Collections
```typescript
// FeedbackInvite
{
  assessmentId: ObjectId;
  assesseeUserId: ObjectId;
  assessorEmail: string;
  relationship: 'manager' | 'peer' | 'directReport' | 'other';
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'responded';
  tokenHash: string;
  expiresAt: Date;
}

// FeedbackResponse
{
  inviteId: ObjectId;
  assessmentId: ObjectId;
  ratings: { skillId: string; rating: number; comment?: string }[];
  overallComments?: string;
  submittedAt: Date;
}
```

## 🔄 Google Sheets Import

### Supported Data Format
Your Google Sheet should include columns for:
- **Email** (required): User email address
- **Name** (required): User full name
- **Role**: Current job role
- **Department**: User department
- **Business Goal**: Business objectives
- **Career Goal**: Career aspirations

### Import Process
1. Share your Google Sheet or export as CSV
2. Use the `/api/sheets/import` endpoint
3. System will create users and assessments automatically
4. Validate data before import using `/api/sheets/validate`

## 🚀 GCP Deployment

### Phase 1: Local Development ✅
- ✅ Backend API with MongoDB
- ✅ 360 Feedback system
- ✅ Docker containerization
- ✅ Google Sheets import

### Phase 2: GCP Migration (Next Steps)
1. **Container Registry**: Push images to GCR
2. **Cloud Run**: Deploy frontend and backend
3. **Cloud Firestore**: Migrate from MongoDB
4. **Secret Manager**: Store API keys securely
5. **Cloud Functions**: Email notifications
6. **Cloud Scheduler**: Automated tasks

### GCP Services Mapping
```
Local Development    →    GCP Production
─────────────────────────────────────────
MongoDB             →    Cloud Firestore
Docker Compose      →    Cloud Run
Local Storage       →    Cloud Storage
Email SMTP          →    Cloud Functions + SendGrid
Direct API Keys     →    Secret Manager
```

## 🛠️ Development

### Project Structure
```
skillgapanalysis/
├── backend/                 # Node.js API
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── config/         # Configuration
│   ├── Dockerfile
│   └── package.json
├── components/             # React components
├── services/              # Frontend services
├── docker-compose.yml     # Local development
└── setup.sh              # Setup script
```

### Available Scripts

#### Backend
```bash
npm run dev          # Development server
npm run build        # Build for production
npm run start        # Start production server
npm test            # Run tests
```

#### Frontend
```bash
npm run dev         # Development server
npm run build       # Build for production
npm run preview     # Preview production build
```

#### Docker
```bash
docker-compose up -d        # Start all services
docker-compose down         # Stop all services
docker-compose logs -f      # View logs
docker-compose restart      # Restart services
```

## 🔒 Security Features

- **Rate Limiting**: API request throttling
- **CORS Protection**: Configured origins
- **Helmet Security**: Security headers
- **Input Validation**: Joi schema validation
- **Secure Tokens**: JWT for authentication
- **Environment Variables**: Sensitive data protection

## 📈 Monitoring & Logging

- **Health Checks**: `/health` endpoint
- **Error Handling**: Global error middleware
- **Request Logging**: Comprehensive request/response logging
- **Database Monitoring**: Connection status tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

---

**Next Steps**: Share your Google Sheets data to enable the import functionality and test the complete 360-feedback workflow!
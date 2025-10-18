#!/bin/bash

echo "🚀 Setting up Skill Gap Assessment Tool with 360 Feedback"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create environment file for backend if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend environment file..."
    cp backend/env.example backend/.env
    echo "⚠️  Please edit backend/.env with your actual configuration values"
fi

# Create environment file for frontend if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating frontend environment file..."
    cat > .env << EOF
REACT_APP_API_URL=http://localhost:3001
EOF
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Build the applications
echo "🔨 Building applications..."
cd backend
npm run build
cd ..

# Start the services
echo "🐳 Starting services with Docker Compose..."
docker-compose up -d

echo "✅ Setup complete!"
echo ""
echo "🌐 Services are now running:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   MongoDB: localhost:27017"
echo ""
echo "📊 To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 To stop services:"
echo "   docker-compose down"
echo ""
echo "⚠️  Don't forget to:"
echo "   1. Edit backend/.env with your Gemini API key"
echo "   2. Share your Google Sheets data for import functionality"

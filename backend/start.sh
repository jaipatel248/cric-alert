#!/bin/bash

echo "🏏 Cricket Alert API - Quick Start"
echo "=================================="
echo ""

# Check if .venv exists (in backend folder)
if [ ! -d ".venv" ]; then
    echo "❌ Virtual environment not found in backend folder"
    echo "   Creating virtual environment..."
    python3 -m venv .venv
    echo "✅ Virtual environment created"
    echo ""
fi

# Check if .env exists (in backend folder)
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found in backend directory"
    echo "   Please create backend/.env with your GEMINI_API_KEY"
    echo "   You can copy from .env.example:"
    echo "   cp .env.example .env"
    echo ""
fi

# Activate venv and run
source .venv/bin/activate

echo "📦 Installing/updating dependencies..."
pip install -q -r requirements.txt

echo ""
echo "🚀 Starting FastAPI server..."
echo "📡 API: http://localhost:8000"
echo "📚 Docs: http://localhost:8000/docs"
echo "📖 ReDoc: http://localhost:8000/redoc"
echo ""
echo "Press Ctrl+C to stop"
echo ""

python run.py

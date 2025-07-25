#!/bin/bash

# Database initialization script for Glimpse

echo "🔧 Initializing Glimpse Database..."

# Check if .env file exists
if [ ! -f "../server/.env" ]; then
    echo "❌ Error: .env file not found in server directory"
    echo "Please copy .env.example to .env and configure your database connection"
    exit 1
fi

# Navigate to server directory
cd ../server || exit

# Check if PostgreSQL is running
echo "📊 Checking PostgreSQL connection..."
if ! npx prisma db pull --force 2>/dev/null; then
    echo "❌ Error: Cannot connect to PostgreSQL"
    echo "Please ensure PostgreSQL is running and DATABASE_URL is correctly configured"
    exit 1
fi

echo "✅ Database connection successful"

# Generate Prisma client
echo "🔨 Generating Prisma client..."
npx prisma generate

# Create initial migration
echo "📝 Creating initial migration..."
npx prisma migrate dev --name init --create-only

# Apply migrations
echo "🚀 Applying migrations..."
npx prisma migrate deploy

# Seed database (optional)
if [ -f "prisma/seed.ts" ]; then
    echo "🌱 Seeding database..."
    npx tsx prisma/seed.ts
fi

echo "✅ Database initialization complete!"
echo ""
echo "You can now:"
echo "  - View your database: npx prisma studio"
echo "  - Start the server: npm run dev"
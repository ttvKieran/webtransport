#!/bin/bash
set -e

echo "🔧 Installing root dependencies..."
npm install

echo "🔧 Installing client dependencies..."
cd packages/client
npm ci --include=dev
echo "📦 Client dependencies installed, vite available: $(npx vite --version 2>/dev/null || echo 'not found')"

echo "🏗️ Building client..."
npx vite build --mode production

cd ../..

echo "🔧 Installing server dependencies..."
cd packages/server
npm ci

echo "✅ Build completed successfully!"
#!/bin/bash
set -e

echo "🔧 Step 1: Installing root dependencies..."
npm install

echo "🔧 Step 2: Installing client dependencies..."
cd packages/client
npm install
echo "📦 Vite version: $(npx vite --version 2>/dev/null || echo 'not found')"

echo "🏗️ Step 3: Building client with npx..."
npx vite build

echo "✅ Client build completed!"
cd ../..

echo "🔧 Step 4: Installing server dependencies..."
cd packages/server
npm install

echo "✅ Build completed successfully!"
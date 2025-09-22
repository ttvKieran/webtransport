#!/bin/bash
set -e

echo "🔧 Installing dependencies..."
npm install

echo "🔧 Installing client dependencies..."
cd packages/client
npm install

echo "🏗️ Building client..."
npm run build

cd ../..

echo "🔧 Installing server dependencies..."
cd packages/server
npm install

echo "✅ Build completed successfully!"
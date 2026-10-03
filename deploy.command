#!/bin/bash
# Change to the directory where this script is located
cd "$(dirname "$0")"

echo "Installing dependencies..."
npm install

echo "Starting local deployment server..."
npm run dev

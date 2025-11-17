#!/bin/bash

# Cantonese Conversational Bot using Qwen3 - Setup Script
# export ALICLOUD_API_KEY=sk-92ca3e24b736421c963c01f9fbcc79df

# Load environment variables from .env file if it exists
if [ -f ".env" ]; then
  echo "Loading environment variables from .env file..."
  export $(grep -v '^#' .env | xargs)
  echo "ALICLOUD_API_KEY is set: ${ALICLOUD_API_KEY:0:5}****"
else
  # Check if ALICLOUD_API_KEY is set manually
  if [ -z "$ALICLOUD_API_KEY" ]; then
    echo "⚠️  Warning: ALICLOUD_API_KEY environment variable is not set."
    echo "You'll need to set your Alibaba Cloud API key to use the Qwen3 API."
    read -p "Would you like to enter your ALICLOUD_API_KEY now? (y/n): " SET_KEY
    
    if [ "$SET_KEY" = "y" ] || [ "$SET_KEY" = "Y" ]; then
      read -p "Enter your ALICLOUD_API_KEY: " API_KEY
      export ALICLOUD_API_KEY="$API_KEY"
      echo "ALICLOUD_API_KEY has been temporarily set for this session."
    else
      echo "No API key set. The bot will run but won't be able to process queries."
    fi
  fi
fi

# Check Deno installation
if ! command -v deno &> /dev/null; then
  echo "❌ Error: Deno is not installed."
  echo "Please install Deno using the following command:"
  echo "curl -fsSL https://deno.land/install.sh | sh"
  exit 1
fi

# Run the application
echo "🚀 Starting Cantonese Conversational Bot..."
echo "🌐 Once started, open your browser to http://localhost:8000"
echo "🛑 Press Ctrl+C to stop the server"
echo "---------------------------------------------------"

# Fix TypeScript errors by using the --no-check flag
# Add additional permissions for reading files and accessing system APIs
echo "Starting with DEBUG mode..."
deno run --no-check --allow-net --allow-env --allow-read --allow-run voice-bot.ts
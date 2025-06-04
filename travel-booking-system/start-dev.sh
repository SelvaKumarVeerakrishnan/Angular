#!/bin/bash

# Print colored messages
print_info() {
  echo -e "\033[0;34m[INFO]\033[0m $1"
}

print_success() {
  echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

print_error() {
  echo -e "\033[0;31m[ERROR]\033[0m $1"
}

print_warning() {
  echo -e "\033[0;33m[WARNING]\033[0m $1"
}

# Set environment variables for development
export ASPNETCORE_ENVIRONMENT=Development

# Kill any existing ng serve processes
print_info "Stopping any running Angular processes..."
pkill -f "ng serve" || true

# Kill any existing dotnet run processes
print_info "Stopping any running .NET processes..."
pkill -f "dotnet run" || true

# Wait a moment for processes to clean up
sleep 2

# Check if concurrently is installed
if ! npm list -g concurrently > /dev/null 2>&1; then
  print_info "Installing concurrently package globally..."
  npm install -g concurrently
  if [ $? -ne 0 ]; then
    print_error "Failed to install concurrently. Please install it manually with 'npm install -g concurrently'"
    exit 1
  fi
fi

print_info "Starting development servers..."

# Run both services using concurrently
FRONTEND_CMD="cd $(pwd) && ng serve --ssl false --watch"
BACKEND_CMD="cd $(pwd)/travel-booking-api && dotnet run --urls=\"http://0.0.0.0:9000\""

concurrently --kill-others-on-fail \
  --names "ANGULAR,DOTNET" \
  --prefix "[{name}]" \
  --prefix-colors "cyan.bold,green.bold" \
  "$FRONTEND_CMD" "$BACKEND_CMD"

# This part will only execute if concurrently exits
print_warning "Development servers stopped"

print_info "To access the applications, open these URLs in your browser:"
print_info "Angular: http://localhost:4200"
print_info "API: http://localhost:9000"
print_info "Swagger: http://localhost:9000/swagger"
print_info ""

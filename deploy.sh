#!/bin/bash

# Hack-a-Byte Deployment Script
# This script helps deploy the application to production

set -e  # Exit on any error

echo "🚀 Starting Hack-a-Byte deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."

    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi

    print_success "Dependencies check passed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm ci --production=false
    print_success "Dependencies installed"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    npm test
    print_success "All tests passed"
}

# Build application
build_application() {
    print_status "Building application..."
    npm run build
    print_success "Application built successfully"
}

# Run linting
run_linting() {
    print_status "Running linting..."
    npm run lint
    print_success "Linting passed"
}

# Check environment variables
check_environment() {
    print_status "Checking environment variables..."

    required_vars=("MONGODB_URI" "JWT_SECRET" "NEXTAUTH_SECRET" "RAZORPAY_KEY_ID" "RAZORPAY_KEY_SECRET")

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            print_error "Required environment variable $var is not set"
            exit 1
        fi
    done

    print_success "Environment variables check passed"
}

# Health check
health_check() {
    print_status "Running health check..."

    # Wait for application to start
    sleep 5

    # Check if health endpoint is responding
    if curl -f -s http://localhost:3000/api/health > /dev/null; then
        print_success "Health check passed"
    else
        print_error "Health check failed"
        exit 1
    fi
}

# Main deployment function
deploy() {
    print_status "Starting deployment process..."

    check_dependencies
    install_dependencies
    run_tests
    run_linting
    check_environment
    build_application

    print_success "🎉 Deployment completed successfully!"
    print_status "Your application is ready for production"
    print_status "Don't forget to:"
    echo "  - Set up your production environment variables"
    echo "  - Configure your domain and SSL certificates"
    echo "  - Set up monitoring and alerting"
    echo "  - Configure backup strategies"
    echo "  - Test the application in production"
}

# Show help
show_help() {
    echo "Hack-a-Byte Deployment Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help          Show this help message"
    echo "  --deploy        Run full deployment process"
    echo "  --test          Run only tests"
    echo "  --build         Run only build"
    echo "  --lint          Run only linting"
    echo "  --health        Run health check"
    echo ""
    echo "Examples:"
    echo "  $0 --deploy     # Full deployment"
    echo "  $0 --test       # Run tests only"
    echo "  $0 --build      # Build only"
}

# Parse command line arguments
case "${1:-}" in
    --help|-h)
        show_help
        ;;
    --deploy)
        deploy
        ;;
    --test)
        run_tests
        ;;
    --build)
        build_application
        ;;
    --lint)
        run_linting
        ;;
    --health)
        health_check
        ;;
    *)
        echo "Invalid option. Use --help for usage information."
        exit 1
        ;;
esac

#!/bin/bash

# CeesarWallet Local Development Setup Script
# This script sets up the complete local development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="$PROJECT_ROOT/setup.log"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macOS"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="Linux"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="Windows"
    else
        error "Unsupported operating system: $OSTYPE"
    fi
    
    log "Detected OS: $OS"
    
    # Check required tools
    local required_tools=("git" "curl" "wget")
    for tool in "${required_tools[@]}"; do
        if ! command_exists "$tool"; then
            error "$tool is required but not installed"
        fi
    done
    
    log "System requirements check passed"
}

# Install Node.js
install_nodejs() {
    if command_exists "node"; then
        local node_version=$(node --version | cut -d'v' -f2)
        local major_version=$(echo "$node_version" | cut -d'.' -f1)
        
        if [ "$major_version" -ge 18 ]; then
            log "Node.js v$node_version is already installed"
            return
        else
            warning "Node.js version $node_version is too old. Need v18+"
        fi
    fi
    
    log "Installing Node.js v18..."
    
    if [[ "$OS" == "macOS" ]]; then
        if command_exists "brew"; then
            brew install node@18
        else
            # Install using official installer
            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
            export NVM_DIR="$HOME/.nvm"
            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
            nvm install 18
            nvm use 18
        fi
    elif [[ "$OS" == "Linux" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$OS" == "Windows" ]]; then
        # Download and install Node.js for Windows
        curl -o nodejs.msi https://nodejs.org/dist/v18.19.0/node-v18.19.0-x64.msi
        msiexec /i nodejs.msi /quiet
    fi
    
    log "Node.js installation completed"
}

# Install Python
install_python() {
    if command_exists "python3"; then
        local python_version=$(python3 --version | cut -d' ' -f2)
        local major_version=$(echo "$python_version" | cut -d'.' -f1)
        local minor_version=$(echo "$python_version" | cut -d'.' -f2)
        
        if [ "$major_version" -eq 3 ] && [ "$minor_version" -ge 11 ]; then
            log "Python $python_version is already installed"
            return
        else
            warning "Python version $python_version is too old. Need v3.11+"
        fi
    fi
    
    log "Installing Python 3.11..."
    
    if [[ "$OS" == "macOS" ]]; then
        if command_exists "brew"; then
            brew install python@3.11
        else
            # Install using pyenv
            curl https://pyenv.run | bash
            export PATH="$HOME/.pyenv/bin:$PATH"
            pyenv install 3.11.0
            pyenv global 3.11.0
        fi
    elif [[ "$OS" == "Linux" ]]; then
        sudo apt-get update
        sudo apt-get install -y software-properties-common
        sudo add-apt-repository ppa:deadsnakes/ppa
        sudo apt-get update
        sudo apt-get install -y python3.11 python3.11-pip python3.11-venv
    elif [[ "$OS" == "Windows" ]]; then
        # Download and install Python for Windows
        curl -o python.exe https://www.python.org/ftp/python/3.11.0/python-3.11.0-amd64.exe
        python.exe /quiet InstallAllUsers=1 PrependPath=1
    fi
    
    log "Python installation completed"
}

# Install Docker
install_docker() {
    if command_exists "docker"; then
        log "Docker is already installed"
        return
    fi
    
    log "Installing Docker..."
    
    if [[ "$OS" == "macOS" ]]; then
        if command_exists "brew"; then
            brew install --cask docker
        else
            # Download Docker Desktop for Mac
            curl -o Docker.dmg https://desktop.docker.com/mac/main/amd64/Docker.dmg
            hdiutil attach Docker.dmg
            cp -R /Volumes/Docker/Docker.app /Applications/
            hdiutil detach /Volumes/Docker
        fi
    elif [[ "$OS" == "Linux" ]]; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
    elif [[ "$OS" == "Windows" ]]; then
        # Download Docker Desktop for Windows
        curl -o DockerDesktopInstaller.exe https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
        DockerDesktopInstaller.exe /quiet
    fi
    
    log "Docker installation completed"
}

# Install AWS CLI
install_aws_cli() {
    if command_exists "aws"; then
        log "AWS CLI is already installed"
        return
    fi
    
    log "Installing AWS CLI..."
    
    if [[ "$OS" == "macOS" ]]; then
        if command_exists "brew"; then
            brew install awscli
        else
            curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
            sudo installer -pkg AWSCLIV2.pkg -target /
        fi
    elif [[ "$OS" == "Linux" ]]; then
        curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
        unzip awscliv2.zip
        sudo ./aws/install
    elif [[ "$OS" == "Windows" ]]; then
        curl "https://awscli.amazonaws.com/AWSCLIV2.msi" -o "AWSCLIV2.msi"
        msiexec /i AWSCLIV2.msi /quiet
    fi
    
    log "AWS CLI installation completed"
}

# Install CDK
install_cdk() {
    if command_exists "cdk"; then
        log "AWS CDK is already installed"
        return
    fi
    
    log "Installing AWS CDK..."
    npm install -g aws-cdk@2.100.0
    
    log "AWS CDK installation completed"
}

# Install Expo CLI
install_expo_cli() {
    # Check for both expo and expo-internal commands
    if command_exists "expo" || command_exists "expo-internal"; then
        log "Expo CLI is already installed"
        return
    fi
    
    log "Installing Expo CLI..."
    
    # Try different installation methods
    if npm install -g @expo/cli@latest --legacy-peer-deps; then
        log "Expo CLI installed successfully"
        
        # Create expo symlink if only expo-internal exists
        if command_exists "expo-internal" && ! command_exists "expo"; then
            log "Creating expo symlink..."
            npm_prefix=$(npm config get prefix)
            if [ -f "$npm_prefix/bin/expo-internal" ]; then
                ln -sf "$npm_prefix/bin/expo-internal" "$npm_prefix/bin/expo" 2>/dev/null || true
            fi
        fi
    else
        log "Standard installation failed, trying alternative method..."
        
        # Alternative: Install via npx
        if command_exists "npx"; then
            log "Using npx to install Expo CLI..."
            npx @expo/cli@latest --version > /dev/null 2>&1
            if [ $? -eq 0 ]; then
                log "Expo CLI available via npx"
                return 0
            fi
        fi
        
        # Alternative: Install via yarn if available
        if command_exists "yarn"; then
            log "Trying yarn installation..."
            yarn global add @expo/cli@latest
            if [ $? -eq 0 ]; then
                log "Expo CLI installed via yarn"
                return 0
            fi
        fi
        
        log "ERROR: All Expo CLI installation methods failed"
        log "You can install it manually with: npm install -g @expo/cli@latest"
        return 1
    fi
    
    # Verify installation
    if command_exists "expo" || command_exists "expo-internal"; then
        log "Expo CLI installation completed"
        if command_exists "expo-internal" && ! command_exists "expo"; then
            log "Note: Use 'expo-internal' command instead of 'expo'"
        fi
    else
        log "WARNING: Expo CLI installed but command not found in PATH"
        log "You may need to restart your terminal or add npm global bin to PATH"
        log "Try running: export PATH=\$PATH:\$(npm config get prefix)/bin"
    fi
}

# Install Redis
install_redis() {
    if command_exists "redis-server"; then
        log "Redis is already installed"
        return
    fi
    
    log "Installing Redis..."
    
    if [[ "$OS" == "macOS" ]]; then
        if command_exists "brew"; then
            brew install redis
        else
            log "ERROR: Homebrew not found. Please install Redis manually."
            return 1
        fi
    elif [[ "$OS" == "Linux" ]]; then
        if command_exists "apt-get"; then
            sudo apt-get update
            sudo apt-get install -y redis-server
        elif command_exists "yum"; then
            sudo yum install -y redis
        else
            log "ERROR: Package manager not found. Please install Redis manually."
            return 1
        fi
    else
        log "ERROR: Unsupported OS. Please install Redis manually."
        return 1
    fi
    
    log "Redis installation completed"
}

# Setup Python virtual environment
setup_python_env() {
    log "Setting up Python virtual environment..."
    
    cd "$PROJECT_ROOT/ml-algorithm" || {
        log "ERROR: Cannot access ml-algorithm directory at $PROJECT_ROOT/ml-algorithm"
        return 1
    }
    
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    
    source venv/bin/activate
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install requirements
    pip install -r requirements.txt
    
    log "Python environment setup completed"
}

# Setup Node.js dependencies
setup_nodejs_deps() {
    log "Setting up Node.js dependencies..."
    
    # Frontend Web
    cd "$PROJECT_ROOT/frontend/web"
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    # Frontend Mobile
    cd "$PROJECT_ROOT/frontend/mobile"
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    # Infrastructure
    cd "$PROJECT_ROOT/infra/cdk"
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    log "Node.js dependencies setup completed"
}

# Create environment files
create_env_files() {
    log "Creating environment files..."
    
    # Backend environment
    cat > "$PROJECT_ROOT/ml-algorithm/.env" << EOF
# Development Environment
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=DEBUG

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=476114151082

# Database Configuration
DYNAMODB_ENDPOINT=http://localhost:8000
REDIS_ENDPOINT=localhost:6379

# Broker Configuration
ALPACA_API_KEY=your_alpaca_api_key
ALPACA_SECRET_KEY=your_alpaca_secret_key
ALPACA_BASE_URL=https://paper-api.alpaca.markets

BINANCE_API_KEY=your_binance_api_key
BINANCE_SECRET_KEY=your_binance_secret_key
BINANCE_BASE_URL=https://api.binance.com

OANDA_API_KEY=your_oanda_api_key
OANDA_SECRET_KEY=your_oanda_secret_key
OANDA_BASE_URL=https://api-fxpractice.oanda.com

# ML Configuration
MODEL_REGISTRY_URL=http://localhost:5000
INFERENCE_ENDPOINT=http://localhost:5001

# Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=DEBUG
EOF

    # Frontend Web environment
    cat > "$PROJECT_ROOT/frontend/web/.env.local" << EOF
# Development Environment
NODE_ENV=development
NEXT_PUBLIC_ENVIRONMENT=development

# AWS Configuration
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_AWS_ACCOUNT_ID=476114151082

# Cognito Configuration (will be updated after CDK deployment)
NEXT_PUBLIC_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID=your_client_id

# API Configuration
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3001
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:3002/graphql

# S3 Configuration
NEXT_PUBLIC_S3_BUCKET=ceesar-wallet-assets-local

# Pinpoint Configuration
NEXT_PUBLIC_PINPOINT_APP_ID=your_pinpoint_app_id

# WebSocket Configuration
NEXT_PUBLIC_WS_URL=ws://localhost:3003
EOF

    # Frontend Mobile environment
    cat > "$PROJECT_ROOT/frontend/mobile/.env" << EOF
# Development Environment
EXPO_PUBLIC_ENVIRONMENT=development

# AWS Configuration
EXPO_PUBLIC_AWS_REGION=us-east-1
EXPO_PUBLIC_AWS_ACCOUNT_ID=476114151082

# Cognito Configuration (will be updated after CDK deployment)
EXPO_PUBLIC_USER_POOL_ID=us-east-1_XXXXXXXXX
EXPO_PUBLIC_USER_POOL_WEB_CLIENT_ID=your_client_id

# API Configuration
EXPO_PUBLIC_API_GATEWAY_URL=http://localhost:3001
EXPO_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:3002/graphql

# S3 Configuration
EXPO_PUBLIC_S3_BUCKET=ceesar-wallet-assets-local

# Pinpoint Configuration
EXPO_PUBLIC_PINPOINT_APP_ID=your_pinpoint_app_id
EOF

    log "Environment files created"
}

# Setup local databases
setup_local_databases() {
    log "Setting up local databases..."
    
    # Start DynamoDB Local
    if ! command_exists "dynamodb-local"; then
        log "Installing DynamoDB Local..."
        npm install -g dynamodb-local
    fi
    
    # Start Redis
    if [[ "$OS" == "macOS" ]]; then
        if command_exists "brew"; then
            brew install redis
            brew services start redis
        fi
    elif [[ "$OS" == "Linux" ]]; then
        sudo apt-get install -y redis-server
        sudo systemctl start redis-server
    fi
    
    log "Local databases setup completed"
}

# Run tests
run_tests() {
    log "Running tests..."
    
    # Backend tests
    cd "$PROJECT_ROOT/ml-algorithm"
    source venv/bin/activate
    export PYTHONPATH="$PROJECT_ROOT/ml-algorithm/src:$PYTHONPATH"
    python -m pytest src/trading/tests/ -v --tb=short
    
    # Frontend Web tests
    cd "$PROJECT_ROOT/frontend/web"
    npm run test -- --watchAll=false --passWithNoTests
    
    # Frontend Mobile tests
    cd "$PROJECT_ROOT/frontend/mobile"
    npm run test -- --watchAll=false --passWithNoTests
    
    log "All tests completed successfully"
}

# Main setup function
main() {
    log "Starting CeesarWallet local development setup..."
    
    # Clear log file
    > "$LOG_FILE"
    
    # Check requirements
    check_requirements
    
    # Install tools
    install_nodejs
    install_python
    install_docker
    install_aws_cli
    install_cdk
    
    # Install Expo CLI (optional for mobile development)
    if install_expo_cli; then
        log "Expo CLI installation successful"
    else
        warning "Expo CLI installation failed - mobile development may not work"
        warning "You can install it manually later with: npm install -g @expo/cli@latest"
    fi
    
    install_redis
    
    # Setup environments
    setup_python_env
    setup_nodejs_deps
    
    # Create configuration files
    create_env_files
    setup_local_databases
    
    # Run tests
    run_tests
    
    log "Local development setup completed successfully!"
    
    echo ""
    echo "🎉 Setup Complete!"
    echo ""
    echo "Next steps:"
    echo "1. Configure AWS credentials: aws configure"
    echo "2. Update environment files with your API keys"
    echo "3. Start local services: ./scripts/start-local.sh"
    echo "4. Open http://localhost:3000 for web app"
    echo "5. Run 'expo start' in frontend/mobile for mobile app"
    echo ""
    echo "For more information, see README.md"
}

# Run main function
main "$@"

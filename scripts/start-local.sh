#!/bin/bash

# CeesarWallet Local Services Startup Script
# This script starts all local development services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="$PROJECT_ROOT/local-services.log"

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

# Check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        return 1
    else
        return 0
    fi
}

# Kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        log "Killing process on port $port (PID: $pid)"
        kill -9 $pid
    fi
}

# Start DynamoDB Local
start_dynamodb() {
    log "Starting DynamoDB Local..."
    
    if ! check_port 8000; then
        warning "Port 8000 is already in use. Killing existing process..."
        kill_port 8000
    fi
    
    # Start DynamoDB Local
    dynamodb-local -port 8000 -sharedDb -inMemory > /dev/null 2>&1 &
    local dynamodb_pid=$!
    echo $dynamodb_pid > "$PROJECT_ROOT/.dynamodb.pid"
    
    # Wait for DynamoDB to start
    sleep 3
    
    # Create tables
    log "Creating DynamoDB tables..."
    aws dynamodb create-table \
        --table-name CeesarWallet-MarketData \
        --attribute-definitions \
            AttributeName=symbol,AttributeType=S \
            AttributeName=timestamp,AttributeType=S \
        --key-schema \
            AttributeName=symbol,KeyType=HASH \
            AttributeName=timestamp,KeyType=RANGE \
        --billing-mode PAY_PER_REQUEST \
        --endpoint-url http://localhost:8000 \
        --region us-east-1 > /dev/null 2>&1 || true
    
    aws dynamodb create-table \
        --table-name CeesarWallet-TradeSignals \
        --attribute-definitions \
            AttributeName=id,AttributeType=S \
        --key-schema \
            AttributeName=id,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --endpoint-url http://localhost:8000 \
        --region us-east-1 > /dev/null 2>&1 || true
    
    aws dynamodb create-table \
        --table-name CeesarWallet-TradeExecutions \
        --attribute-definitions \
            AttributeName=id,AttributeType=S \
        --key-schema \
            AttributeName=id,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --endpoint-url http://localhost:8000 \
        --region us-east-1 > /dev/null 2>&1 || true
    
    aws dynamodb create-table \
        --table-name CeesarWallet-Positions \
        --attribute-definitions \
            AttributeName=id,AttributeType=S \
        --key-schema \
            AttributeName=id,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --endpoint-url http://localhost:8000 \
        --region us-east-1 > /dev/null 2>&1 || true
    
    aws dynamodb create-table \
        --table-name CeesarWallet-Portfolio \
        --attribute-definitions \
            AttributeName=userId,AttributeType=S \
        --key-schema \
            AttributeName=userId,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --endpoint-url http://localhost:8000 \
        --region us-east-1 > /dev/null 2>&1 || true
    
    log "DynamoDB Local started on port 8000"
}

# Start Redis
start_redis() {
    log "Starting Redis..."
    
    # Check if Redis is installed
    if ! command_exists "redis-server"; then
        error "Redis is not installed. Please run setup-local.sh first."
        return 1
    fi
    
    if ! check_port 6379; then
        warning "Port 6379 is already in use. Killing existing process..."
        kill_port 6379
    fi
    
    # Start Redis
    redis-server --port 6379 --daemonize yes
    echo "redis" > "$PROJECT_ROOT/.redis.pid"
    
    log "Redis started on port 6379"
}

# Start Backend Services
start_backend() {
    log "Starting Backend Services..."
    
    cd "$PROJECT_ROOT/ml-algorithm"
    source venv/bin/activate
    export PYTHONPATH="$PWD/src:$PYTHONPATH"
    
    # Start Inference Service
    if ! check_port 5001; then
        warning "Port 5001 is already in use. Killing existing process..."
        kill_port 5001
    fi
    
    python -m trading.inference_service > /dev/null 2>&1 &
    local inference_pid=$!
    echo $inference_pid > "$PROJECT_ROOT/.inference.pid"
    
    # Start Engine Service
    if ! check_port 5002; then
        warning "Port 5002 is already in use. Killing existing process..."
        kill_port 5002
    fi
    
    python -m trading.engine_service > /dev/null 2>&1 &
    local engine_pid=$!
    echo $engine_pid > "$PROJECT_ROOT/.engine.pid"
    
    # Start Fraud Detection Service
    if ! check_port 5003; then
        warning "Port 5003 is already in use. Killing existing process..."
        kill_port 5003
    fi
    
    python -m trading.fraud_detection_service > /dev/null 2>&1 &
    local fraud_pid=$!
    echo $fraud_pid > "$PROJECT_ROOT/.fraud.pid"
    
    # Wait for services to start
    sleep 5
    
    log "Backend services started"
}

# Start API Gateway Mock
start_api_gateway() {
    log "Starting API Gateway Mock..."
    
    if ! check_port 3001; then
        warning "Port 3001 is already in use. Killing existing process..."
        kill_port 3001
    fi
    
    cd "$PROJECT_ROOT/ml-algorithm"
    source venv/bin/activate
    
    # Set Python path for trading modules
    export PYTHONPATH="$PROJECT_ROOT/ml-algorithm/src:$PYTHONPATH"
    
    # Start FastAPI server
    python -m uvicorn trading.api:app --host 0.0.0.0 --port 3001 --reload > /dev/null 2>&1 &
    local api_pid=$!
    echo $api_pid > "$PROJECT_ROOT/.api.pid"
    
    # Wait for API to start
    sleep 3
    
    log "API Gateway Mock started on port 3001"
}

# Start GraphQL Mock
start_graphql() {
    log "Starting GraphQL Mock..."
    
    if ! check_port 3002; then
        warning "Port 3002 is already in use. Killing existing process..."
        kill_port 3002
    fi
    
    cd "$PROJECT_ROOT/ml-algorithm"
    source venv/bin/activate
    
    # Set Python path for trading modules
    export PYTHONPATH="$PROJECT_ROOT/ml-algorithm/src:$PYTHONPATH"
    
    # Start GraphQL server
    python -m uvicorn trading.graphql_server:app --host 0.0.0.0 --port 3002 --reload > /dev/null 2>&1 &
    local graphql_pid=$!
    echo $graphql_pid > "$PROJECT_ROOT/.graphql.pid"
    
    # Wait for GraphQL to start
    sleep 3
    
    log "GraphQL Mock started on port 3002"
}

# Start WebSocket Server
start_websocket() {
    log "Starting WebSocket Server..."
    
    if ! check_port 3003; then
        warning "Port 3003 is already in use. Killing existing process..."
        kill_port 3003
    fi
    
    cd "$PROJECT_ROOT/ml-algorithm"
    source venv/bin/activate
    
    # Set Python path for trading modules
    export PYTHONPATH="$PROJECT_ROOT/ml-algorithm/src:$PYTHONPATH"
    
    # Start WebSocket server
    python -m uvicorn trading.websocket_server:app --host 0.0.0.0 --port 3003 --reload > /dev/null 2>&1 &
    local websocket_pid=$!
    echo $websocket_pid > "$PROJECT_ROOT/.websocket.pid"
    
    # Wait for WebSocket to start
    sleep 3
    
    log "WebSocket Server started on port 3003"
}

# Start Frontend Web
start_frontend_web() {
    log "Starting Frontend Web..."
    
    if ! check_port 3000; then
        warning "Port 3000 is already in use. Killing existing process..."
        kill_port 3000
    fi
    
    cd "$PROJECT_ROOT/frontend/web"
    
    # Start Next.js development server
    npm run dev > /dev/null 2>&1 &
    local web_pid=$!
    echo $web_pid > "$PROJECT_ROOT/.web.pid"
    
    # Wait for web server to start
    sleep 5
    
    log "Frontend Web started on port 3000"
}

# Start Frontend Mobile
start_frontend_mobile() {
    log "Starting Frontend Mobile..."
    
    cd "$PROJECT_ROOT/frontend/mobile"
    
    # Start Expo development server
    expo start --web > /dev/null 2>&1 &
    local mobile_pid=$!
    echo $mobile_pid > "$PROJECT_ROOT/.mobile.pid"
    
    # Wait for mobile server to start
    sleep 5
    
    log "Frontend Mobile started"
}

# Health check
health_check() {
    log "Performing health check..."
    
    local services=(
        "DynamoDB:http://localhost:8000"
        "Redis:redis://localhost:6379"
        "API Gateway:http://localhost:3001/health"
        "GraphQL:http://localhost:3002/graphql"
        "WebSocket:ws://localhost:3003"
        "Frontend Web:http://localhost:3000"
    )
    
    for service in "${services[@]}"; do
        local name=$(echo $service | cut -d: -f1)
        local url=$(echo $service | cut -d: -f2-)
        
        if [[ $url == http* ]]; then
            if curl -s "$url" > /dev/null; then
                log "✅ $name is healthy"
            else
                warning "❌ $name is not responding"
            fi
        elif [[ $url == redis* ]]; then
            if redis-cli -u "$url" ping > /dev/null 2>&1; then
                log "✅ $name is healthy"
            else
                warning "❌ $name is not responding"
            fi
        elif [[ $url == ws* ]]; then
            # WebSocket health check would need a more complex implementation
            log "✅ $name is running"
        fi
    done
}

# Stop all services
stop_services() {
    log "Stopping all services..."
    
    local pid_files=(
        ".dynamodb.pid"
        ".redis.pid"
        ".inference.pid"
        ".engine.pid"
        ".fraud.pid"
        ".api.pid"
        ".graphql.pid"
        ".websocket.pid"
        ".web.pid"
        ".mobile.pid"
    )
    
    for pid_file in "${pid_files[@]}"; do
        if [ -f "$PROJECT_ROOT/$pid_file" ]; then
            local pid=$(cat "$PROJECT_ROOT/$pid_file")
            if kill -0 "$pid" 2>/dev/null; then
                log "Stopping process $pid"
                kill -TERM "$pid"
                sleep 2
                if kill -0 "$pid" 2>/dev/null; then
                    kill -KILL "$pid"
                fi
            fi
            rm "$PROJECT_ROOT/$pid_file"
        fi
    done
    
    # Kill any remaining processes on our ports
    kill_port 8000  # DynamoDB
    kill_port 6379  # Redis
    kill_port 5001  # Inference
    kill_port 5002  # Engine
    kill_port 5003  # Fraud
    kill_port 3001  # API
    kill_port 3002  # GraphQL
    kill_port 3003  # WebSocket
    kill_port 3000  # Web
    kill_port 19006 # Expo
    
    log "All services stopped"
}

# Show status
show_status() {
    log "Service Status:"
    
    local services=(
        "DynamoDB:8000"
        "Redis:6379"
        "Inference Service:5001"
        "Engine Service:5002"
        "Fraud Detection:5003"
        "API Gateway:3001"
        "GraphQL:3002"
        "WebSocket:3003"
        "Frontend Web:3000"
        "Frontend Mobile:19006"
    )
    
    for service in "${services[@]}"; do
        local name=$(echo $service | cut -d: -f1)
        local port=$(echo $service | cut -d: -f2)
        
        if check_port $port; then
            echo "  ❌ $name (port $port) - Not running"
        else
            echo "  ✅ $name (port $port) - Running"
        fi
    done
}

# Main function
main() {
    case "${1:-start}" in
        "start")
            log "Starting CeesarWallet local services..."
            
            # Clear log file
            > "$LOG_FILE"
            
            # Start services
            start_dynamodb
            start_redis
            start_backend
            start_api_gateway
            start_graphql
            start_websocket
            start_frontend_web
            start_frontend_mobile
            
            # Health check
            health_check
            
            log "All services started successfully!"
            
            echo ""
            echo "🎉 Local Development Environment Ready!"
            echo ""
            echo "Services running:"
            echo "  🌐 Frontend Web: http://localhost:3000"
            echo "  📱 Frontend Mobile: Run 'expo start' in frontend/mobile"
            echo "  🔌 API Gateway: http://localhost:3001"
            echo "  📊 GraphQL: http://localhost:3002/graphql"
            echo "  🔄 WebSocket: ws://localhost:3003"
            echo "  🗄️  DynamoDB: http://localhost:8000"
            echo "  📦 Redis: redis://localhost:6379"
            echo ""
            echo "To stop all services: ./scripts/start-local.sh stop"
            echo "To check status: ./scripts/start-local.sh status"
            ;;
        "stop")
            stop_services
            ;;
        "status")
            show_status
            ;;
        "restart")
            stop_services
            sleep 2
            main start
            ;;
        *)
            echo "Usage: $0 {start|stop|status|restart}"
            echo "  start   - Start all local services (default)"
            echo "  stop    - Stop all local services"
            echo "  status  - Show service status"
            echo "  restart - Restart all services"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"

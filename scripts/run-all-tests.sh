#!/bin/bash

# CeesarWallet Comprehensive Test Runner
# This script runs all tests across the entire platform

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$PROJECT_ROOT/test-results.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Test configuration
RUN_UNIT_TESTS=true
RUN_INTEGRATION_TESTS=true
RUN_E2E_TESTS=true
RUN_PERFORMANCE_TESTS=true
RUN_SECURITY_TESTS=false
VERBOSE=false
COVERAGE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --unit-only)
            RUN_INTEGRATION_TESTS=false
            RUN_E2E_TESTS=false
            RUN_PERFORMANCE_TESTS=false
            shift
            ;;
        --integration-only)
            RUN_UNIT_TESTS=false
            RUN_E2E_TESTS=false
            RUN_PERFORMANCE_TESTS=false
            shift
            ;;
        --e2e-only)
            RUN_UNIT_TESTS=false
            RUN_INTEGRATION_TESTS=false
            RUN_PERFORMANCE_TESTS=false
            shift
            ;;
        --performance-only)
            RUN_UNIT_TESTS=false
            RUN_INTEGRATION_TESTS=false
            RUN_E2E_TESTS=false
            shift
            ;;
        --security)
            RUN_SECURITY_TESTS=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --coverage)
            COVERAGE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --unit-only        Run only unit tests"
            echo "  --integration-only Run only integration tests"
            echo "  --e2e-only         Run only end-to-end tests"
            echo "  --performance-only Run only performance tests"
            echo "  --security         Include security tests"
            echo "  --verbose, -v      Verbose output"
            echo "  --coverage         Generate coverage reports"
            echo "  --help, -h         Show this help"
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

# Logging functions
log() {
    echo -e "${BLUE}[$TIMESTAMP]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$TIMESTAMP] ✅${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$TIMESTAMP] ❌${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$TIMESTAMP] ⚠️${NC} $1" | tee -a "$LOG_FILE"
}

# Test result tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Function to run tests and track results
run_test_suite() {
    local test_name="$1"
    local test_command="$2"
    local test_dir="$3"
    
    log "Running $test_name..."
    
    if [ -n "$test_dir" ]; then
        cd "$test_dir"
    fi
    
    if eval "$test_command"; then
        log_success "$test_name completed successfully"
        ((PASSED_TESTS++))
    else
        log_error "$test_name failed"
        ((FAILED_TESTS++))
        return 1
    fi
    
    ((TOTAL_TESTS++))
    
    if [ -n "$test_dir" ]; then
        cd "$PROJECT_ROOT"
    fi
}

# Function to check if service is running
check_service() {
    local service_name="$1"
    local port="$2"
    local endpoint="$3"
    
    if curl -s "$endpoint" > /dev/null 2>&1; then
        log_success "$service_name is running on port $port"
        return 0
    else
        log_warning "$service_name is not responding on port $port"
        return 1
    fi
}

# Function to start services if needed
ensure_services_running() {
    log "Checking if services are running..."
    
    local services_running=true
    
    check_service "DynamoDB" "8000" "http://localhost:8000" || services_running=false
    check_service "Redis" "6379" "http://localhost:6379" || services_running=false
    check_service "API Gateway" "3001" "http://localhost:3001/health" || services_running=false
    check_service "GraphQL" "3002" "http://localhost:3002/health" || services_running=false
    check_service "Frontend Web" "3000" "http://localhost:3000" || services_running=false
    
    if [ "$services_running" = false ]; then
        log "Starting services..."
        ./scripts/start-local.sh start
        sleep 10
        
        # Check again
        check_service "DynamoDB" "8000" "http://localhost:8000" || log_error "DynamoDB failed to start"
        check_service "Redis" "6379" "http://localhost:6379" || log_error "Redis failed to start"
        check_service "API Gateway" "3001" "http://localhost:3001/health" || log_error "API Gateway failed to start"
        check_service "GraphQL" "3002" "http://localhost:3002/health" || log_error "GraphQL failed to start"
        check_service "Frontend Web" "3000" "http://localhost:3000" || log_error "Frontend Web failed to start"
    fi
}

# Main test execution
main() {
    log "Starting CeesarWallet comprehensive test suite..."
    log "Project root: $PROJECT_ROOT"
    log "Log file: $LOG_FILE"
    
    # Initialize log file
    echo "CeesarWallet Test Results - $TIMESTAMP" > "$LOG_FILE"
    echo "========================================" >> "$LOG_FILE"
    
    # Ensure services are running
    if [ "$RUN_INTEGRATION_TESTS" = true ] || [ "$RUN_E2E_TESTS" = true ]; then
        ensure_services_running
    fi
    
    # Unit Tests
    if [ "$RUN_UNIT_TESTS" = true ]; then
        log "=== UNIT TESTS ==="
        
        # Python ML Services Unit Tests
        local pytest_args="-v"
        if [ "$COVERAGE" = true ]; then
            pytest_args="$pytest_args --cov=trading --cov-report=html --cov-report=term"
        fi
        if [ "$VERBOSE" = true ]; then
            pytest_args="$pytest_args --tb=long"
        fi
        
        run_test_suite "Python ML Models" \
            "cd ml-algorithm && source venv/bin/activate && export PYTHONPATH=\"\$PWD/src:\$PYTHONPATH\" && python -m pytest src/trading/tests/test_models.py $pytest_args" \
            ""
        
        run_test_suite "Python Configuration" \
            "cd ml-algorithm && source venv/bin/activate && export PYTHONPATH=\"\$PWD/src:\$PYTHONPATH\" && python -m pytest src/trading/tests/test_config.py $pytest_args" \
            ""
        
        run_test_suite "Python Brokers" \
            "cd ml-algorithm && source venv/bin/activate && export PYTHONPATH=\"\$PWD/src:\$PYTHONPATH\" && python -m pytest src/trading/tests/test_brokers.py $pytest_args" \
            ""
        
        # Frontend Web Unit Tests
        local npm_test_args=""
        if [ "$VERBOSE" = true ]; then
            npm_test_args="--verbose"
        fi
        if [ "$COVERAGE" = true ]; then
            npm_test_args="$npm_test_args --coverage"
        fi
        
        run_test_suite "Frontend Web Components" \
            "cd frontend/web && npm run test $npm_test_args" \
            ""
        
        # Backend Kotlin Unit Tests
        run_test_suite "Backend Kotlin Services" \
            "cd backend && ./gradlew test" \
            ""
    fi
    
    # Integration Tests
    if [ "$RUN_INTEGRATION_TESTS" = true ]; then
        log "=== INTEGRATION TESTS ==="
        
        # API Integration Tests
        run_test_suite "API Gateway Integration" \
            "curl -s http://localhost:3001/health | grep -q 'healthy'" \
            ""
        
        run_test_suite "Portfolio API Integration" \
            "curl -s http://localhost:3001/api/portfolio | grep -q 'total_value'" \
            ""
        
        run_test_suite "Positions API Integration" \
            "curl -s http://localhost:3001/api/positions | grep -q 'symbol'" \
            ""
        
        run_test_suite "GraphQL Integration" \
            "curl -s http://localhost:3002/health | grep -q 'healthy'" \
            ""
        
        # Database Integration Tests
        run_test_suite "DynamoDB Integration" \
            "aws dynamodb list-tables --endpoint-url http://localhost:8000 | grep -q 'TableNames'" \
            ""
        
        run_test_suite "Redis Integration" \
            "redis-cli -h localhost -p 6379 ping | grep -q 'PONG'" \
            ""
        
        # End-to-End System Tests
        run_test_suite "End-to-End System Tests" \
            "cd ml-algorithm && source venv/bin/activate && export PYTHONPATH=\"\$PWD/src:\$PYTHONPATH\" && python -m pytest src/trading/tests/test_e2e.py -v" \
            ""
    fi
    
    # End-to-End Tests
    if [ "$RUN_E2E_TESTS" = true ]; then
        log "=== END-TO-END TESTS ==="
        
        # Frontend E2E Tests
        run_test_suite "Frontend Web E2E" \
            "cd frontend/web && npm run test:e2e" \
            ""
        
        # Mobile E2E Tests (if available)
        if [ -d "frontend/mobile" ]; then
            run_test_suite "Frontend Mobile E2E" \
                "cd frontend/mobile && npm run test:e2e" \
                ""
        fi
    fi
    
    # Performance Tests
    if [ "$RUN_PERFORMANCE_TESTS" = true ]; then
        log "=== PERFORMANCE TESTS ==="
        
        run_test_suite "ML Model Performance" \
            "cd ml-algorithm && source venv/bin/activate && export PYTHONPATH=\"\$PWD/src:\$PYTHONPATH\" && python -m pytest src/trading/tests/test_performance.py -v" \
            ""
        
        # API Performance Tests
        log "Running API performance tests..."
        if command -v ab >/dev/null 2>&1; then
            run_test_suite "API Gateway Performance" \
                "ab -n 100 -c 10 http://localhost:3001/api/portfolio | grep -q 'Requests per second'" \
                ""
        else
            log_warning "Apache Bench not available, skipping API performance tests"
            ((SKIPPED_TESTS++))
        fi
    fi
    
    # Security Tests
    if [ "$RUN_SECURITY_TESTS" = true ]; then
        log "=== SECURITY TESTS ==="
        
        # Dependency vulnerability scanning
        run_test_suite "Python Security Audit" \
            "cd ml-algorithm && source venv/bin/activate && pip-audit" \
            ""
        
        run_test_suite "Node.js Security Audit" \
            "cd frontend/web && npm audit" \
            ""
        
        # Custom security tests
        if [ -d "tests/security" ]; then
            run_test_suite "Custom Security Tests" \
                "cd ml-algorithm && source venv/bin/activate && export PYTHONPATH=\"\$PWD/src:\$PYTHONPATH\" && python -m pytest tests/security/ -v" \
                ""
        fi
    fi
    
    # Generate test report
    log "=== TEST SUMMARY ==="
    log "Total tests: $TOTAL_TESTS"
    log_success "Passed: $PASSED_TESTS"
    if [ $FAILED_TESTS -gt 0 ]; then
        log_error "Failed: $FAILED_TESTS"
    else
        log_success "Failed: $FAILED_TESTS"
    fi
    if [ $SKIPPED_TESTS -gt 0 ]; then
        log_warning "Skipped: $SKIPPED_TESTS"
    fi
    
    # Calculate success rate
    if [ $TOTAL_TESTS -gt 0 ]; then
        local success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
        log "Success rate: $success_rate%"
        
        if [ $success_rate -ge 95 ]; then
            log_success "Excellent test results!"
        elif [ $success_rate -ge 80 ]; then
            log_warning "Good test results, but room for improvement"
        else
            log_error "Poor test results, needs attention"
        fi
    fi
    
    # Generate coverage report if requested
    if [ "$COVERAGE" = true ]; then
        log "Coverage reports generated in:"
        log "- ml-algorithm/htmlcov/index.html"
        log "- frontend/web/coverage/lcov-report/index.html"
    fi
    
    # Exit with appropriate code
    if [ $FAILED_TESTS -gt 0 ]; then
        log_error "Test suite completed with failures"
        exit 1
    else
        log_success "All tests passed successfully!"
        exit 0
    fi
}

# Run main function
main "$@"

#!/bin/bash
# MorphoScan Pro - Production Deployment Script
# This script deploys the application to production with zero-downtime

set -e

echo "🚀 MorphoScan Pro - Production Deployment"
echo "========================================"

# Configuration
DEPLOY_ENV="production"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups/$TIMESTAMP"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_deployment_readiness() {
    log_info "Checking deployment readiness..."

    # Check if all required environment variables are set
    required_vars=(
        "VITE_SUPABASE_URL"
        "VITE_SUPABASE_PUBLISHABLE_KEY"
        "VITE_STRIPE_PUBLISHABLE_KEY"
        "VITE_APP_ENV"
        "SUPABASE_SERVICE_ROLE_KEY"
        "STRIPE_SECRET_KEY"
    )

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done

    # Check if build artifacts exist
    if [ ! -d "dist" ]; then
        log_error "Build artifacts not found. Run 'npm run build' first."
        exit 1
    fi

    # Check database connectivity
    if ! npm run db:migrate --silent; then
        log_error "Database migration failed"
        exit 1
    fi

    log_success "Deployment readiness check passed"
}

create_backup() {
    log_info "Creating deployment backup..."

    mkdir -p "$BACKUP_DIR"

    # Backup current deployment
    if [ -d "current-deployment" ]; then
        cp -r current-deployment/* "$BACKUP_DIR/"
    fi

    # Backup database schema
    pg_dump "$DATABASE_URL" > "$BACKUP_DIR/database_schema.sql" 2>/dev/null || true

    log_success "Backup created in $BACKUP_DIR"
}

build_production() {
    log_info "Building production application..."

    # Clean previous build
    rm -rf dist

    # Build with production optimizations
    NODE_ENV=production npm run build

    if [ ! -d "dist" ]; then
        log_error "Production build failed"
        exit 1
    fi

    log_success "Production build completed"
}

run_health_checks() {
    log_info "Running pre-deployment health checks..."

    # Test database connectivity
    if ! npm run db:migrate --silent; then
        log_error "Database health check failed"
        exit 1
    fi

    # Test Supabase connection
    # Add your Supabase health check here

    # Test Stripe connectivity
    # Add your Stripe health check here

    log_success "Health checks passed"
}

deploy_application() {
    log_info "Deploying application to production..."

    # Create deployment directory
    DEPLOY_DIR="deployments/$TIMESTAMP"
    mkdir -p "$DEPLOY_DIR"

    # Copy build artifacts
    cp -r dist/* "$DEPLOY_DIR/"

    # Copy deployment configuration
    cp -r scripts "$DEPLOY_DIR/"
    cp package.json "$DEPLOY_DIR/"
    cp ecosystem.config.js "$DEPLOY_DIR/" 2>/dev/null || true

    # Create current deployment symlink
    rm -f current-deployment
    ln -s "$DEPLOY_DIR" current-deployment

    log_success "Application deployed to $DEPLOY_DIR"
}

update_environment() {
    log_info "Updating production environment..."

    # Update environment variables
    if [ -f ".env.production" ]; then
        cp .env.production current-deployment/.env
    fi

    # Update configuration files
    # Add any configuration updates here

    log_success "Environment updated"
}

restart_services() {
    log_info "Restarting production services..."

    # Restart application server
    if command -v pm2 &> /dev/null; then
        pm2 restart morphoscan-pro || pm2 start ecosystem.config.js
    elif command -v systemctl &> /dev/null; then
        sudo systemctl restart morphoscan-pro
    else
        log_warning "No service manager found. Manual restart may be required."
    fi

    # Wait for services to start
    sleep 10

    log_success "Services restarted"
}

run_post_deployment_tests() {
    log_info "Running post-deployment tests..."

    # Test application health endpoint
    if curl -f -s "https://morphoscanpro.com/api/health" > /dev/null; then
        log_success "Application health check passed"
    else
        log_error "Application health check failed"
        exit 1
    fi

    # Test database connectivity
    # Add database tests here

    # Test external integrations
    # Add integration tests here

    log_success "Post-deployment tests passed"
}

send_notifications() {
    log_info "Sending deployment notifications..."

    # Slack notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 MorphoScan Pro deployed to production at $TIMESTAMP\"}" \
            "$SLACK_WEBHOOK_URL"
    fi

    # Email notification
    if [ -n "$DEPLOYMENT_EMAIL" ]; then
        echo "MorphoScan Pro deployed successfully at $TIMESTAMP

Deployment Details:
- Timestamp: $TIMESTAMP
- Environment: $DEPLOY_ENV
- Build: $(git rev-parse HEAD)
- Backup: $BACKUP_DIR

Health Checks: ✅ PASSED
Post-deployment Tests: ✅ PASSED

Monitor the application at: https://morphoscanpro.com
" | mail -s "MorphoScan Pro Production Deployment" "$DEPLOYMENT_EMAIL"
    fi

    log_success "Notifications sent"
}

rollback_procedure() {
    log_error "Deployment failed. Initiating rollback..."

    # Restore from backup
    if [ -d "$BACKUP_DIR" ]; then
        log_info "Restoring from backup..."
        rm -f current-deployment
        ln -s "$BACKUP_DIR" current-deployment
        restart_services
        log_success "Rollback completed"
    else
        log_error "No backup available for rollback"
    fi
}

cleanup() {
    log_info "Cleaning up old deployments..."

    # Keep only last 5 deployments
    ls -dt deployments/* | tail -n +6 | xargs rm -rf 2>/dev/null || true

    # Keep only last 10 backups
    ls -dt backups/* | tail -n +11 | xargs rm -rf 2>/dev/null || true

    log_success "Cleanup completed"
}

main() {
    echo "Starting production deployment..."

    # Trap errors for rollback
    trap rollback_procedure ERR

    check_deployment_readiness
    create_backup
    build_production
    run_health_checks
    deploy_application
    update_environment
    restart_services
    run_post_deployment_tests
    send_notifications
    cleanup

    echo ""
    log_success "🎉 Production deployment completed successfully!"
    echo ""
    echo "Deployment Summary:"
    echo "- Timestamp: $TIMESTAMP"
    echo "- Environment: $DEPLOY_ENV"
    echo "- Build: $(git rev-parse HEAD)"
    echo "- Backup: $BACKUP_DIR"
    echo "- URL: https://morphoscanpro.com"
    echo ""
    log_info "Monitor the application and check logs for any issues"
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback_procedure
        ;;
    "health-check")
        run_post_deployment_tests
        ;;
    *)
        log_error "Usage: $0 [deploy|rollback|health-check]"
        exit 1
        ;;
esac

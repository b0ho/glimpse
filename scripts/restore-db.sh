#!/bin/bash

# Database Restore Script for Glimpse
# This script restores PostgreSQL database from backup

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/glimpse}"
BACKUP_FILE="${1:-}"

# Database connection settings
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-glimpse_db}"
DB_USER="${DB_USER:-glimpse}"

# AWS S3 settings (optional)
S3_BUCKET="${S3_BUCKET:-}"
S3_PATH="${S3_PATH:-database-backups}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if backup file is specified
if [ -z "$BACKUP_FILE" ]; then
    log_error "Usage: $0 <backup_file>"
    echo ""
    echo "Available local backups:"
    ls -lh "$BACKUP_DIR"/glimpse_backup_*.sql.gz 2>/dev/null || echo "No local backups found"
    echo ""
    
    if [ -n "$S3_BUCKET" ]; then
        echo "Available S3 backups:"
        aws s3 ls "s3://${S3_BUCKET}/${S3_PATH}/" | grep glimpse_backup || echo "No S3 backups found"
    fi
    exit 1
fi

# Check if backup file exists locally
if [ ! -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    log_warning "Backup file not found locally: ${BACKUP_DIR}/${BACKUP_FILE}"
    
    # Try to download from S3
    if [ -n "$S3_BUCKET" ]; then
        log_info "Attempting to download from S3..."
        S3_FULL_PATH="s3://${S3_BUCKET}/${S3_PATH}/${BACKUP_FILE}"
        
        if aws s3 cp "$S3_FULL_PATH" "${BACKUP_DIR}/${BACKUP_FILE}"; then
            log_info "Backup downloaded from S3 successfully"
        else
            log_error "Failed to download backup from S3"
            exit 1
        fi
    else
        log_error "Backup file not found and S3 is not configured"
        exit 1
    fi
fi

# Create temporary directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Decompress backup
log_info "Decompressing backup..."
DECOMPRESSED_FILE="${TEMP_DIR}/restore.sql"

if gunzip -c "${BACKUP_DIR}/${BACKUP_FILE}" > "$DECOMPRESSED_FILE"; then
    log_info "Decompression completed"
else
    log_error "Decompression failed"
    exit 1
fi

# Confirm restoration
echo ""
log_warning "WARNING: This will restore the database from backup!"
log_warning "Database: $DB_NAME"
log_warning "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log_info "Restoration cancelled"
    exit 0
fi

# Stop application services (if using Docker)
if command -v docker-compose &> /dev/null; then
    log_info "Stopping application services..."
    docker-compose stop server web || true
fi

# Create backup of current database before restoration
CURRENT_BACKUP="glimpse_before_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
log_info "Creating backup of current database: $CURRENT_BACKUP"

if PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --verbose \
    --clean \
    --no-owner \
    --no-privileges \
    --if-exists \
    --format=plain | gzip -9 > "${BACKUP_DIR}/${CURRENT_BACKUP}"; then
    
    log_info "Current database backed up successfully"
else
    log_error "Failed to backup current database"
    exit 1
fi

# Restore database
log_info "Starting database restoration..."

# Drop existing connections
PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d postgres \
    -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" || true

# Restore the backup
if PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f "$DECOMPRESSED_FILE"; then
    
    log_info "Database restored successfully"
else
    log_error "Database restoration failed"
    log_error "You can restore the previous state using: $0 $CURRENT_BACKUP"
    exit 1
fi

# Run migrations (if needed)
log_info "Running database migrations..."
if [ -d "server" ]; then
    cd server
    npx prisma migrate deploy || log_warning "Migration failed, this might be expected if backup is up-to-date"
    cd ..
fi

# Restart application services (if using Docker)
if command -v docker-compose &> /dev/null; then
    log_info "Restarting application services..."
    docker-compose start server web || true
fi

log_info "Database restoration completed successfully!"

# Send notification (optional)
if [ -n "$SLACK_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"Database restored successfully from: ${BACKUP_FILE}\"}" \
        "$SLACK_WEBHOOK"
fi
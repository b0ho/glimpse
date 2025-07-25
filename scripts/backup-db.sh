#!/bin/bash

# Database Backup Script for Glimpse
# This script creates automated backups of the PostgreSQL database

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/glimpse}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="glimpse_backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

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

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Start backup
log_info "Starting database backup..."
log_info "Database: $DB_NAME"
log_info "Backup file: $BACKUP_FILE"

# Create database backup
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
    --format=plain \
    > "${BACKUP_DIR}/${BACKUP_FILE}"; then
    
    log_info "Database backup completed successfully"
else
    log_error "Database backup failed"
    exit 1
fi

# Compress backup
log_info "Compressing backup..."
if gzip -9 "${BACKUP_DIR}/${BACKUP_FILE}"; then
    log_info "Compression completed: $COMPRESSED_FILE"
else
    log_error "Compression failed"
    exit 1
fi

# Upload to S3 if configured
if [ -n "$S3_BUCKET" ]; then
    log_info "Uploading backup to S3..."
    S3_FULL_PATH="s3://${S3_BUCKET}/${S3_PATH}/${COMPRESSED_FILE}"
    
    if aws s3 cp "${BACKUP_DIR}/${COMPRESSED_FILE}" "$S3_FULL_PATH"; then
        log_info "Backup uploaded to S3: $S3_FULL_PATH"
    else
        log_error "Failed to upload backup to S3"
        exit 1
    fi
fi

# Clean up old local backups
log_info "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "glimpse_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# Clean up old S3 backups if configured
if [ -n "$S3_BUCKET" ]; then
    log_info "Cleaning up old S3 backups..."
    CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
    
    aws s3api list-objects-v2 \
        --bucket "$S3_BUCKET" \
        --prefix "${S3_PATH}/" \
        --query "Contents[?LastModified<='${CUTOFF_DATE}'].Key" \
        --output text | \
    while read -r key; do
        if [ -n "$key" ]; then
            aws s3 rm "s3://${S3_BUCKET}/${key}"
            log_info "Deleted old S3 backup: $key"
        fi
    done
fi

# Verify backup
BACKUP_SIZE=$(stat -f%z "${BACKUP_DIR}/${COMPRESSED_FILE}" 2>/dev/null || stat -c%s "${BACKUP_DIR}/${COMPRESSED_FILE}" 2>/dev/null)
if [ -n "$BACKUP_SIZE" ] && [ "$BACKUP_SIZE" -gt 0 ]; then
    log_info "Backup size: $(numfmt --to=iec-i --suffix=B $BACKUP_SIZE)"
else
    log_error "Backup file is empty or missing"
    exit 1
fi

log_info "Database backup completed successfully!"

# Send notification (optional)
if [ -n "$SLACK_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"Database backup completed successfully: ${COMPRESSED_FILE} ($(numfmt --to=iec-i --suffix=B $BACKUP_SIZE))\"}" \
        "$SLACK_WEBHOOK"
fi
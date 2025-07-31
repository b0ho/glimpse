#!/bin/bash
set -e

# Configuration
BACKUP_DIR="/tmp/backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="glimpse"

echo "[$(date)] Starting backup process..."

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
echo "[$(date)] Backing up PostgreSQL database..."
PGPASSWORD=$DB_PASSWORD pg_dump \
    -h postgres \
    -U $DB_USER \
    -d $DB_NAME \
    --no-owner \
    --no-privileges \
    -f "$BACKUP_DIR/postgres_${TIMESTAMP}.sql"

# Compress backup
echo "[$(date)] Compressing backup..."
gzip "$BACKUP_DIR/postgres_${TIMESTAMP}.sql"

# Upload to S3
echo "[$(date)] Uploading to S3..."
aws s3 cp "$BACKUP_DIR/postgres_${TIMESTAMP}.sql.gz" \
    "s3://${S3_BACKUP_BUCKET}/postgres/postgres_${TIMESTAMP}.sql.gz" \
    --storage-class STANDARD_IA

# Clean up old local backups (keep last 7 days)
echo "[$(date)] Cleaning up old local backups..."
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

# Clean up old S3 backups (keep last 30 days)
echo "[$(date)] Cleaning up old S3 backups..."
aws s3 ls "s3://${S3_BACKUP_BUCKET}/postgres/" | \
    while read -r line; do
        createDate=$(echo $line | awk '{print $1" "$2}')
        createDate=$(date -d"$createDate" +%s)
        olderThan=$(date -d"30 days ago" +%s)
        if [[ $createDate -lt $olderThan ]]; then
            fileName=$(echo $line | awk '{print $4}')
            if [[ $fileName != "" ]]; then
                aws s3 rm "s3://${S3_BACKUP_BUCKET}/postgres/$fileName"
            fi
        fi
    done

echo "[$(date)] Backup completed successfully!"

# Log backup completion
echo "{\"timestamp\":\"$(date -Iseconds)\",\"status\":\"success\",\"file\":\"postgres_${TIMESTAMP}.sql.gz\"}" >> /backup/backup.log
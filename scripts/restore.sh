#!/bin/bash
set -e

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <backup-filename>"
    echo "Example: $0 postgres_20250128_120000.sql.gz"
    exit 1
fi

BACKUP_FILE=$1
TEMP_DIR="/tmp/restore"

echo "[$(date)] Starting restore process..."

# Create temp directory
mkdir -p $TEMP_DIR

# Download from S3
echo "[$(date)] Downloading backup from S3..."
aws s3 cp "s3://${S3_BACKUP_BUCKET}/postgres/${BACKUP_FILE}" "$TEMP_DIR/${BACKUP_FILE}"

# Decompress
echo "[$(date)] Decompressing backup..."
gunzip "$TEMP_DIR/${BACKUP_FILE}"

# Get SQL filename
SQL_FILE="${BACKUP_FILE%.gz}"

# Restore to PostgreSQL
echo "[$(date)] Restoring to PostgreSQL..."
echo "WARNING: This will drop and recreate the database. Continue? (y/N)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    # Drop existing database
    PGPASSWORD=$DB_PASSWORD psql \
        -h postgres \
        -U $DB_USER \
        -d postgres \
        -c "DROP DATABASE IF EXISTS $DB_NAME;"
    
    # Create new database
    PGPASSWORD=$DB_PASSWORD psql \
        -h postgres \
        -U $DB_USER \
        -d postgres \
        -c "CREATE DATABASE $DB_NAME;"
    
    # Restore backup
    PGPASSWORD=$DB_PASSWORD psql \
        -h postgres \
        -U $DB_USER \
        -d $DB_NAME \
        -f "$TEMP_DIR/$SQL_FILE"
    
    echo "[$(date)] Restore completed successfully!"
else
    echo "[$(date)] Restore cancelled."
fi

# Clean up
rm -rf $TEMP_DIR
FROM alpine:3.18

# Install required packages
RUN apk add --no-cache \
    postgresql-client \
    aws-cli \
    bash \
    coreutils \
    gzip

# Create backup directory
RUN mkdir -p /backup /scripts

# Copy backup scripts
COPY scripts/* /scripts/
RUN chmod +x /scripts/*

# Set working directory
WORKDIR /backup

# Run backup script every 6 hours
CMD ["/bin/bash", "-c", "while true; do /scripts/backup.sh; sleep 21600; done"]
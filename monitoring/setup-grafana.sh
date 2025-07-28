#!/bin/bash

# Grafana dashboard setup script

GRAFANA_URL="http://localhost:3000"
GRAFANA_USER="admin"
GRAFANA_PASSWORD="admin"

# Wait for Grafana to be ready
echo "Waiting for Grafana to be ready..."
while ! curl -s $GRAFANA_URL/api/health > /dev/null; do
  sleep 5
done

echo "Grafana is ready. Setting up dashboards..."

# Import main dashboard
curl -X POST \
  -H "Content-Type: application/json" \
  -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
  -d @grafana-dashboard.json \
  $GRAFANA_URL/api/dashboards/db

# Create alert notification channels
echo "Creating notification channels..."

# Slack notification channel
curl -X POST \
  -H "Content-Type: application/json" \
  -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
  -d '{
    "name": "Slack Alerts",
    "type": "slack",
    "settings": {
      "url": "'"$SLACK_WEBHOOK_URL"'",
      "recipient": "#alerts",
      "username": "Grafana"
    },
    "isDefault": true
  }' \
  $GRAFANA_URL/api/alert-notifications

# Email notification channel
curl -X POST \
  -H "Content-Type: application/json" \
  -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
  -d '{
    "name": "Email Alerts",
    "type": "email",
    "settings": {
      "addresses": "alerts@glimpse.app"
    },
    "isDefault": false
  }' \
  $GRAFANA_URL/api/alert-notifications

echo "Grafana setup complete!"
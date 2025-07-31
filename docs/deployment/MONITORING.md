# Glimpse Monitoring & Logging Guide

## Overview

This guide covers the comprehensive monitoring and logging setup for Glimpse, including metrics collection, log aggregation, distributed tracing, and alerting.

## Architecture

### Monitoring Stack
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Jaeger**: Distributed tracing
- **OpenTelemetry**: Unified observability framework

### Logging Stack
- **Elasticsearch**: Log storage and indexing
- **Logstash**: Log processing and enrichment
- **Kibana**: Log search and visualization
- **Filebeat**: Log collection and shipping

## Accessing Monitoring Tools

### Production URLs
- **Grafana**: https://glimpse.app:3030
  - Username: `admin` (from env)
  - Password: (from env)
- **Kibana**: https://glimpse.app:5601
- **Jaeger**: https://glimpse.app:16686
- **Prometheus**: https://glimpse.app:9090

### Local Development
```bash
# Start monitoring stack
docker-compose up -d

# Access URLs
- Grafana: http://localhost:3030
- Kibana: http://localhost:5601
- Jaeger: http://localhost:16686
- Prometheus: http://localhost:9090
```

## Metrics

### Application Metrics
- **HTTP Metrics**
  - Request rate by endpoint
  - Response time percentiles
  - Error rates
  - Status code distribution

- **WebSocket Metrics**
  - Active connections
  - Messages sent/received
  - Connection duration

- **Database Metrics**
  - Query performance
  - Connection pool usage
  - Slow query tracking

- **Business Metrics**
  - User registrations
  - Matches created
  - Messages sent
  - Payments processed

### System Metrics
- CPU usage
- Memory usage
- Disk I/O
- Network traffic
- Container statistics

## Logging

### Log Levels
- **ERROR**: Application errors, exceptions
- **WARN**: Warning conditions, degraded performance
- **INFO**: General information, business events
- **DEBUG**: Detailed debugging information

### Structured Logging
All logs include:
- `timestamp`: ISO 8601 format
- `level`: Log level
- `service`: Service name
- `requestId`: Unique request identifier
- `userId`: User ID (if authenticated)
- `message`: Log message
- Additional context fields

### Log Retention
- **Production**: 30 days
- **Development**: 7 days
- **Archives**: S3 for compliance

## Dashboards

### 1. Application Overview
- Request rate and latency
- Error rate trends
- Active users
- System health

### 2. Business Metrics
- User activity
- Revenue metrics
- Feature usage
- Conversion rates

### 3. Infrastructure
- Resource utilization
- Container health
- Database performance
- Cache hit rates

### 4. Logs Analysis
- Error frequency
- Top error messages
- Service log distribution
- Response time analysis

## Alerts

### Critical Alerts (Immediate Action)
- **Service Down**: Any service unreachable
- **High Error Rate**: >5% errors for 5 minutes
- **Database Connection Exhausted**: >80% connections used
- **Disk Space Low**: <15% free space
- **Payment Failures**: >10% failure rate

### Warning Alerts (Investigation Required)
- **High Response Time**: p95 >1s for 5 minutes
- **Memory Usage High**: >85% for 5 minutes
- **Slow Queries**: >500ms for 5 minutes
- **SSL Certificate Expiry**: <30 days
- **Redis Memory High**: >80% used

## Distributed Tracing

### Trace Collection
- Automatic instrumentation for HTTP requests
- Manual instrumentation for critical paths
- Context propagation across services

### Using Jaeger
1. Search by trace ID or service
2. View request flow across services
3. Identify bottlenecks
4. Analyze error propagation

## Log Queries

### Common Kibana Queries

**Find all errors for a user:**
```
userId:"user123" AND log_level:ERROR
```

**Payment failures:**
```
service:payment AND status:failed
```

**Slow API requests:**
```
response_time:>1000 AND http_status:200
```

**Database errors:**
```
service:database AND log_level:ERROR
```

## Performance Monitoring

### Key Performance Indicators
- **API Response Time**: Target <200ms p50, <500ms p95
- **Error Rate**: Target <1%
- **Availability**: Target 99.9%
- **WebSocket Latency**: Target <100ms

### Performance Optimization
1. Monitor slow endpoints in Grafana
2. Analyze database queries in logs
3. Check cache hit rates
4. Review resource utilization

## Troubleshooting

### High Error Rate
1. Check Grafana error dashboard
2. Query recent errors in Kibana
3. Review error patterns
4. Check external service status

### Performance Issues
1. View response time trends
2. Check database query performance
3. Review CPU/memory usage
4. Analyze trace data in Jaeger

### Missing Metrics
1. Verify service is running
2. Check Prometheus targets
3. Review service logs
4. Validate metric endpoints

## Alert Configuration

### Slack Integration
```yaml
# In alertmanager.yml
receivers:
  - name: 'slack-notifications'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#alerts'
        title: 'Glimpse Alert'
```

### PagerDuty Integration
```yaml
receivers:
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'
```

## Best Practices

### Logging
- Use structured logging
- Include request ID in all logs
- Avoid logging sensitive data
- Use appropriate log levels
- Implement log sampling for high-volume endpoints

### Metrics
- Use labels sparingly
- Pre-aggregate where possible
- Set appropriate retention periods
- Monitor cardinality
- Use histograms for latency

### Alerts
- Avoid alert fatigue
- Set meaningful thresholds
- Include runbook links
- Test alerts regularly
- Document response procedures

## Maintenance

### Daily Tasks
- Review error trends
- Check alert notifications
- Monitor resource usage

### Weekly Tasks
- Review performance metrics
- Analyze slow queries
- Check backup status
- Update dashboards as needed

### Monthly Tasks
- Review and tune alerts
- Analyze cost metrics
- Performance optimization
- Capacity planning

## Security Monitoring

### Access Logs
- Monitor authentication failures
- Track API key usage
- Review admin actions

### Security Alerts
- Multiple failed login attempts
- Unusual traffic patterns
- Suspicious API usage
- Data access anomalies

## Compliance

### Audit Logging
- User data access
- Configuration changes
- Payment transactions
- Admin actions

### Log Retention Policy
- Payment logs: 7 years
- User activity: 1 year
- System logs: 90 days
- Debug logs: 7 days

## Contact

For monitoring issues or questions:
- Slack: #monitoring
- Email: ops@glimpse.app
- On-call: Via PagerDuty
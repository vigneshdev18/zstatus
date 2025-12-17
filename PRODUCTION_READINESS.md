# ZStatus - Production Hardening Checklist

## ✅ Error Handling & Resilience

### Health Check Runner

- [x] Retry logic with exponential backoff (2 retries max)
- [x] Timeout handling with AbortController
- [x] Graceful degradation on network failures
- [x] Detailed error messages for debugging

### Scheduler

- [x] Error isolation per job
- [x] Job execution tracking
- [x] Failure rate monitoring
- [x] Graceful shutdown (SIGTERM/SIGINT)
- [x] Prevent cascade failures

### Database Operations

- [x] Error handling in all DB operations
- [x] Connection pooling via singleton pattern
- [x] Index creation on startup

## ✅ Database Performance

### Indexes Created

```
Services:
- id (unique)
- lastStatus
- createdAt

Incidents:
- id (unique)
- serviceId
- status
- startTime (desc)
- correlationId
- serviceId + startTime (composite)

Health Checks:
- id (unique)
- serviceId
- timestamp (desc)
- status
- serviceId + timestamp (composite)

Alerts:
- id (unique)
- serviceId
- status
- createdAt (desc)
-serviceId + type + createdAt (dedup index)

Maintenance Windows:
- id (unique)
- serviceId
- startTime + endTime
```

## ✅ Data Management

### Automatic Cleanup

- [x] Health checks older than 30 days deleted
- [x] Closed incidents older than 90 days deleted
- [x] Old alerts older than 90 days deleted
- [x] Heartbeats limited to last 1000

### Retention Policy

- Recent health checks: 30 days
- Closed incidents: 90 days
- Alerts: 90 days
- Heartbeats: Last 1000 entries

## ⚠️ Before Production Deployment

### Required Environment Variables

```bash
# MongoDB (required)
MONGODB_URI=mongodb://...
MONGODB_DB=zstatus

# Alerting (optional)
TEAMS_WEBHOOK_URL=https://...

# Observability (optional)
GRAFANA_URL=https://...
KIBANA_URL=https://...
PROMETHEUS_URL=https://...
JAEGER_URL=https://...
```

### Security Checklist

- [ ] Add authentication/authorization middleware
- [ ] Rate limit public APIs
- [ ] Validate all user inputs
- [ ] Sanitize MongoDB queries
- [ ] Use HTTPS in production
- [ ] Secure webhook URLs
- [ ] Implement API keys for service creation

### Monitoring Checklist

- [ ] Monitor MongoDB connection pool
- [ ] Track scheduler job success rates
- [ ] Alert on database disk usage
- [ ] Monitor health check execution times
- [ ] Track incident detection latency

### Performance Validation

- [ ] Test with 50+ services
- [ ] Verify health check concurrency
- [ ] Confirm index usage with explain plans
- [ ] Load test incident detection
- [ ] Validate correlation performance

## 🎯 Production Readiness

### Long-Running Stability

- [x] Scheduler auto-recovers from errors
- [x] Database indexes prevent slow queries
- [x] Data cleanup prevents unbounded growth
- [x] Graceful shutdown on termination signals

### Alert Storm Prevention

- [x] 5-minute deduplication window
- [x] Maintenance window suppression
- [x] Retry logic prevents false positives
- [x] Correlation prevents redundant alerts

### Data Integrity

- [x] Unique constraints on IDs
- [x] Foreign key relationships maintained
- [x] Atomic incident state transitions
- [x] No race conditions in correlation

## 📊 Recommended Monitoring

### Application Metrics

- Health check execution rate
- Incident detection latency
- Alert success rate
- Scheduler job success rates
- Database query performance

### Infrastructure Metrics

- MongoDB CPU/memory usage
- Database connection count
- Disk I/O for collections
- Network latency to monitored services

### Alerts

- Scheduler job failures > 10%
- Database connection failures
- Health check queue backlog
- Incident detection delays > 2min

## 🚀 Deployment Strategy

1. **Initial Deploy**

   - Deploy with minimal services (<10)
   - Monitor for 24 hours
   - Verify all jobs running

2. **Gradual Scale-Up**

   - Add 10 services at a time
   - Monitor performance
   - Adjust check intervals if needed

3. **Full Production**
   - All services configured
   - Teams webhooks active
   - Observability links configured
   - Maintenance windows scheduled

## 📝 Operational Notes

- Health checks run every 60 seconds by default
- Incidents auto-correlate within 2-minute window
- Alerts deduplicate over 5-minute window
- Data cleanup runs can be scheduled separately
- Indexes are created automatically on first startup

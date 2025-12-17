# ZStatus → Prometheus → Grafana Integration Guide

## Overview

This guide shows you how to export ZStatus metrics to Prometheus and visualize them in Grafana.

## Architecture

```
ZStatus (Next.js) → Prometheus → Grafana
     ↓
  /metrics endpoint
  (Prometheus format)
```

## Step 1: Install Prometheus Client

```bash
npm install prom-client
```

## Step 2: Create Metrics Endpoint

ZStatus exposes metrics at `/api/metrics` in Prometheus format.

**Metrics Exported:**

1. **`zstatus_service_up`** - Service health status (1 = UP, 0 = DOWN)

   - Labels: `service_name`, `service_id`

2. **`zstatus_response_time_ms`** - Last response time in milliseconds

   - Labels: `service_name`, `service_id`

3. **`zstatus_total_incidents`** - Total number of incidents

   - Labels: `service_name`, `service_id`, `status` (OPEN/CLOSED)

4. **`zstatus_incident_duration_seconds`** - Incident duration

   - Labels: `service_name`, `service_id`

5. **`zstatus_health_checks_total`** - Total health checks performed
   - Labels: `service_name`, `service_id`, `status` (UP/DOWN)

## Step 3: Configure Prometheus

Create or update `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "zstatus"
    static_configs:
      - targets: ["localhost:3000"]
    metrics_path: "/api/metrics"
    scrape_interval: 30s
```

**Start Prometheus:**

```bash
# Using Docker
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

# Or download binary from https://prometheus.io/download/
./prometheus --config.file=prometheus.yml
```

**Verify:** Visit http://localhost:9090 and search for `zstatus_` metrics

## Step 4: Configure Grafana

### Install Grafana

```bash
# Using Docker
docker run -d \
  --name grafana \
  -p 3001:3000 \
  grafana/grafana
```

Visit http://localhost:3001 (default login: admin/admin)

### Add Prometheus Data Source

1. Go to **Configuration → Data Sources**
2. Click **Add data source**
3. Select **Prometheus**
4. Set URL: `http://localhost:9090` (or `http://prometheus:9090` if using Docker)
5. Click **Save & Test**

### Create Dashboard

#### Panel 1: Service Health Status

**Query:**

```promql
zstatus_service_up
```

**Visualization:** Stat
**Display:** Show current value, color by threshold (0=red, 1=green)

#### Panel 2: Response Time Trends

**Query:**

```promql
zstatus_response_time_ms
```

**Visualization:** Time series graph
**Legend:** `{{service_name}}`

#### Panel 3: Active Incidents

**Query:**

```promql
sum(zstatus_total_incidents{status="OPEN"})
```

**Visualization:** Stat
**Display:** Show total, color red if > 0

#### Panel 4: Incident Rate

**Query:**

```promql
rate(zstatus_total_incidents[5m])
```

**Visualization:** Time series graph

#### Panel 5: Health Check Success Rate

**Query:**

```promql
sum(rate(zstatus_health_checks_total{status="UP"}[5m]))
/
sum(rate(zstatus_health_checks_total[5m])) * 100
```

**Visualization:** Gauge
**Unit:** Percent (0-100)

## Step 5: Example Grafana Queries

### Average Response Time by Service (Last Hour)

```promql
avg_over_time(zstatus_response_time_ms[1h])
```

### Services Currently Down

```promql
zstatus_service_up == 0
```

### Total Downtime (Last 24h)

```promql
sum(zstatus_incident_duration_seconds[24h])
```

### P95 Response Time

```promql
histogram_quantile(0.95, rate(zstatus_response_time_ms[5m]))
```

## Step 6: Alerting in Grafana

Create alerts based on ZStatus metrics:

### Alert: Service Down

**Condition:**

```promql
zstatus_service_up == 0
```

**For:** 2 minutes
**Action:** Send notification to Slack/Email

### Alert: High Response Time

**Condition:**

```promql
zstatus_response_time_ms > 5000
```

**For:** 5 minutes

### Alert: Multiple Incidents

**Condition:**

```promql
sum(zstatus_total_incidents{status="OPEN"}) > 3
```

**For:** 1 minute

## Step 7: Production Deployment

### Docker Compose Stack

Create `docker-compose.yml`:

```yaml
version: "3.8"

services:
  zstatus:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017
      - MONGODB_DB=zstatus
    depends_on:
      - mongo

  mongo:
    image: mongo:7
    volumes:
      - mongo-data:/data/db

  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
    depends_on:
      - prometheus

volumes:
  mongo-data:
  prometheus-data:
  grafana-data:
```

**Start the stack:**

```bash
docker-compose up -d
```

## Access URLs

- **ZStatus:** http://localhost:3000
- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3001
- **Metrics Endpoint:** http://localhost:3000/api/metrics

## Troubleshooting

### Prometheus Can't Scrape Metrics

1. Check if `/api/metrics` returns data: `curl http://localhost:3000/api/metrics`
2. Verify Prometheus config: `promtool check config prometheus.yml`
3. Check Prometheus targets: Visit http://localhost:9090/targets

### No Data in Grafana

1. Verify Prometheus data source connection
2. Check if Prometheus is receiving data: Search for `zstatus_` in Prometheus UI
3. Ensure time range in Grafana matches when metrics were collected

### Metrics Not Updating

1. Check scrape interval in Prometheus config
2. Ensure ZStatus health checks are running
3. Verify scheduler is active in ZStatus

## Best Practices

1. **Scrape Interval:** Set to 30-60s to balance freshness vs load
2. **Retention:** Configure Prometheus retention based on your needs
3. **Labels:** Keep labels low-cardinality (avoid UUIDs, use service names)
4. **Aggregation:** Use recording rules in Prometheus for complex queries
5. **Dashboards:** Create different dashboards for different audiences (ops, devs, management)

## Next Steps

1. ✅ Install prom-client package
2. ✅ Deploy /api/metrics endpoint (already created in ZStatus)
3. ⬜ Set up Prometheus server
4. ⬜ Configure scraping of ZStatus metrics
5. ⬜ Install Grafana
6. ⬜ Import or create dashboards
7. ⬜ Set up alerting rules

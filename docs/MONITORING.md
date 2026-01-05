# Dating Platform Monitoring Documentation

This document provides comprehensive documentation for the monitoring and observability infrastructure of the Dating Platform.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Components](#components)
5. [Configuration](#configuration)
6. [Dashboards](#dashboards)
7. [Alerting](#alerting)
8. [Metrics Reference](#metrics-reference)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance](#maintenance)

## Overview

The monitoring stack provides comprehensive observability for the Dating Platform, including:

- **Metrics Collection**: Prometheus scrapes metrics from all services
- **Visualization**: Grafana dashboards for real-time monitoring
- **Alerting**: Alertmanager routes alerts to appropriate channels
- **Log Aggregation**: Loki collects and indexes logs (optional)
- **Container Metrics**: cAdvisor provides container-level metrics

## Architecture

```
+-------------------+     +-------------------+     +-------------------+
|    Backend API    |     |    AI Services    |     |      Ollama       |
|   :3000/metrics   |     |   :800x/metrics   |     |  :11434/metrics   |
+--------+----------+     +--------+----------+     +--------+----------+
         |                         |                         |
         +------------------------+-------------------------+
                                  |
                         +--------v--------+
                         |    Prometheus   |
                         |     :9090       |
                         +--------+--------+
                                  |
              +-------------------+-------------------+
              |                   |                   |
    +---------v---------+ +-------v-------+ +--------v--------+
    |      Grafana      | |  Alertmanager | |      Loki       |
    |      :3001        | |    :9093      | |     :3100       |
    +-------------------+ +-------+-------+ +-----------------+
                                  |
              +-------------------+-------------------+
              |                   |                   |
    +---------v---------+ +-------v-------+ +--------v--------+
    |       Slack       | |    PagerDuty  | |      Email      |
    +-------------------+ +---------------+ +-----------------+
```

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Access to the Dating Platform network
- Environment variables configured

### Starting the Monitoring Stack

1. **Set up environment variables**:

```bash
# Create .env file in monitoring directory
cat > monitoring/.env << EOF
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=your-secure-password
GRAFANA_ROOT_URL=https://monitoring.dating-platform.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
SMTP_USERNAME=postmaster@mg.dating-platform.com
SMTP_PASSWORD=your-smtp-password
PAGERDUTY_SERVICE_KEY=your-pagerduty-key
PAGERDUTY_PAYMENTS_KEY=your-pagerduty-payments-key
POSTGRES_EXPORTER_PASSWORD=your-postgres-password
REDIS_PASSWORD=your-redis-password
GRAFANA_POSTGRES_PASSWORD=your-grafana-postgres-password
GRAFANA_REDIS_PASSWORD=your-grafana-redis-password
EOF
```

2. **Start the stack**:

```bash
cd dating-platform/monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

3. **Access the services**:

| Service      | URL                         | Default Credentials |
|--------------|-----------------------------|--------------------|
| Prometheus   | http://localhost:9090       | N/A                |
| Grafana      | http://localhost:3001       | admin / (from env) |
| Alertmanager | http://localhost:9093       | N/A                |

## Components

### Prometheus

Prometheus is the central metrics collection system.

**Configuration file**: `monitoring/prometheus/prometheus.yml`

**Scrape targets**:
- Backend API (`:3000`)
- AI Services (`:8000-8002`)
- Ollama (`:11434`)
- PostgreSQL Exporter (`:9187`)
- Redis Exporter (`:9121`)
- Node Exporter (`:9100`)
- cAdvisor (`:8080`)

**Data retention**: 30 days or 50GB (whichever is reached first)

### Grafana

Grafana provides visualization and dashboards.

**Features**:
- Pre-configured datasources (Prometheus, Loki, Alertmanager)
- Auto-provisioned dashboards
- Unified alerting support
- SMTP configured for alert notifications

**Default dashboards**:
- Dating Platform Overview
- AI Services Performance
- Database & Cache
- System Resources

### Alertmanager

Alertmanager handles alert routing and notifications.

**Notification channels**:
- Slack (multiple channels by severity)
- PagerDuty (critical alerts)
- Email (ops team)

**Routing rules**:
- Critical alerts: PagerDuty + Slack #critical
- Warning alerts: Slack + Email
- Database alerts: Slack #database
- AI service alerts: Slack #ai
- Info alerts: Slack #info

### Exporters

| Exporter          | Purpose                    | Port  |
|-------------------|----------------------------|-------|
| Node Exporter     | System metrics             | 9100  |
| cAdvisor          | Container metrics          | 8080  |
| Postgres Exporter | PostgreSQL metrics         | 9187  |
| Redis Exporter    | Redis metrics              | 9121  |
| Nginx Exporter    | Nginx/Gateway metrics      | 9113  |

## Configuration

### Adding New Scrape Targets

Edit `monitoring/prometheus/prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'new-service'
    static_configs:
      - targets: ['new-service:8080']
    metrics_path: /metrics
```

Reload Prometheus:
```bash
curl -X POST http://localhost:9090/-/reload
```

### Adding Alert Rules

Create or edit files in `monitoring/prometheus/rules/`:

```yaml
groups:
  - name: custom_alerts
    rules:
      - alert: CustomAlert
        expr: some_metric > threshold
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Custom alert triggered"
          description: "Value is {{ $value }}"
```

### Configuring Notification Channels

Edit `monitoring/alertmanager/alertmanager.yml`:

```yaml
receivers:
  - name: 'custom-receiver'
    slack_configs:
      - channel: '#custom-channel'
        # ... configuration
```

## Dashboards

### Dating Platform Overview

The main dashboard includes:

**Overview Section**:
- Active users count
- Matches created (24h)
- Messages sent (24h)
- Error rate
- API P95 latency
- Backend status

**API Performance Section**:
- Request rate by endpoint
- Latency percentiles (p50, p95, p99)
- Requests by status code
- Active connections

**AI Services Section**:
- Ollama response times
- AI inference rate
- Matchmaking queue size
- Content moderation queue
- Service status

**Database & Cache Section**:
- PostgreSQL connection pool usage
- Redis cache hit rate
- Database connections
- Redis memory usage
- Command rate

**System Resources Section**:
- CPU usage
- Memory usage
- Disk usage
- Network I/O
- Disk I/O

### Creating Custom Dashboards

1. Log into Grafana
2. Create a new dashboard
3. Add panels with Prometheus queries
4. Save and export JSON
5. Place JSON in `monitoring/grafana/dashboards/`

## Alerting

### Alert Severity Levels

| Severity | Response Time | Notification       |
|----------|---------------|--------------------|
| Critical | < 15 minutes  | PagerDuty + Slack  |
| Warning  | < 4 hours     | Slack + Email      |
| Info     | Next business | Slack (info)       |

### Key Alerts

**API Alerts**:
- `HighRequestLatency`: P95 latency > 2s for 5m
- `CriticalRequestLatency`: P99 latency > 5s for 2m
- `HighErrorRate`: Error rate > 5% for 5m
- `APIDown`: Backend unreachable for 1m

**Database Alerts**:
- `PostgresConnectionPoolExhausted`: > 90% connections used
- `PostgresDown`: Database unreachable
- `RedisLowCacheHitRate`: Cache hit rate < 80%
- `RedisHighMemoryUsage`: Memory > 90%

**AI Service Alerts**:
- `OllamaHighLatency`: P95 > 10s for 5m
- `OllamaDown`: Ollama unreachable for 2m
- `MatchmakingQueueBacklog`: Queue > 1000 for 10m

**System Alerts**:
- `HighCPUUsage`: CPU > 80% for 10m
- `CriticalMemoryUsage`: Memory > 95% for 5m
- `DiskSpaceCritical`: Free space < 10%

### Silencing Alerts

Through Alertmanager UI:
1. Navigate to http://localhost:9093
2. Click "Silences" > "New Silence"
3. Configure matchers and duration
4. Submit

Through API:
```bash
curl -X POST http://localhost:9093/api/v2/silences \
  -H "Content-Type: application/json" \
  -d '{
    "matchers": [{"name": "alertname", "value": "HighCPUUsage"}],
    "startsAt": "2024-01-01T00:00:00Z",
    "endsAt": "2024-01-01T04:00:00Z",
    "createdBy": "admin",
    "comment": "Planned maintenance"
  }'
```

## Metrics Reference

### Application Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | Request duration |
| `active_users_total` | Gauge | Current active users |
| `matches_created_total` | Counter | Total matches created |
| `messages_sent_total` | Counter | Total messages sent |
| `active_websocket_connections` | Gauge | Active WebSocket connections |

### AI Service Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `ollama_request_duration_seconds` | Histogram | Ollama response time |
| `ai_inference_total` | Counter | AI inference requests |
| `ai_inference_duration_seconds` | Histogram | AI inference duration |
| `matchmaking_queue_size` | Gauge | Matchmaking queue depth |
| `moderation_queue_size` | Gauge | Moderation queue depth |

### Database Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `pg_stat_activity_count` | Gauge | Active connections |
| `pg_settings_max_connections` | Gauge | Maximum connections |
| `redis_keyspace_hits_total` | Counter | Cache hits |
| `redis_keyspace_misses_total` | Counter | Cache misses |
| `redis_memory_used_bytes` | Gauge | Redis memory usage |

### System Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `node_cpu_seconds_total` | Counter | CPU time |
| `node_memory_MemAvailable_bytes` | Gauge | Available memory |
| `node_filesystem_avail_bytes` | Gauge | Available disk space |
| `node_network_receive_bytes_total` | Counter | Network received |

## Troubleshooting

### Prometheus Not Scraping Targets

1. Check target status in Prometheus UI:
   ```
   http://localhost:9090/targets
   ```

2. Verify network connectivity:
   ```bash
   docker exec prometheus wget -qO- http://backend:3000/metrics
   ```

3. Check service discovery configuration

### Grafana Dashboard Not Loading

1. Check datasource connection:
   - Go to Configuration > Data sources
   - Test the connection

2. Verify dashboard provisioning:
   ```bash
   docker logs grafana | grep -i provision
   ```

3. Check file permissions on dashboard JSON files

### Alerts Not Firing

1. Check Prometheus rules status:
   ```
   http://localhost:9090/rules
   ```

2. Verify Alertmanager is receiving alerts:
   ```
   http://localhost:9093/#/alerts
   ```

3. Check notification channel configuration

### High Memory Usage in Prometheus

1. Check cardinality:
   ```
   http://localhost:9090/api/v1/status/tsdb
   ```

2. Reduce retention period or increase storage limits

3. Review scrape targets for high-cardinality metrics

## Maintenance

### Backup Procedures

**Prometheus Data**:
```bash
# Snapshot API
curl -X POST http://localhost:9090/api/v1/admin/tsdb/snapshot
```

**Grafana Data**:
```bash
# Backup Grafana database
docker cp grafana:/var/lib/grafana/grafana.db ./backups/
```

### Upgrading Components

1. Update image tags in `docker-compose.monitoring.yml`
2. Pull new images:
   ```bash
   docker-compose -f docker-compose.monitoring.yml pull
   ```
3. Rolling restart:
   ```bash
   docker-compose -f docker-compose.monitoring.yml up -d
   ```

### Planned Maintenance Windows

The monitoring stack supports maintenance windows defined in Alertmanager:

- Sunday 02:00-06:00 UTC: Regular maintenance window
- Weekends and off-hours: Reduced alerting (info-level suppressed)

To add custom maintenance windows, edit `alertmanager.yml`:

```yaml
time_intervals:
  - name: 'custom-maintenance'
    time_intervals:
      - times:
          - start_time: '00:00'
            end_time: '04:00'
        weekdays: ['wednesday']
```

### Log Rotation

Container logs are managed by Docker's logging driver. Configure in Docker daemon:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  }
}
```

## Security Considerations

1. **Access Control**: Grafana should be behind authentication
2. **Network Segmentation**: Monitoring network is isolated
3. **Secrets Management**: Use environment variables for sensitive data
4. **TLS**: Enable TLS for production deployments
5. **Read-Only Access**: Database exporters use read-only credentials

## Support

For issues with the monitoring infrastructure:

1. Check the troubleshooting section above
2. Review logs: `docker-compose -f docker-compose.monitoring.yml logs`
3. Contact the platform operations team

---

Last updated: 2024

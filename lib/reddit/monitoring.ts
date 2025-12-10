import type { Redis } from 'ioredis'
import { log } from '@/lib/logger'

export interface LogLevel {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  priority: number
}

export interface LogEntry {
  timestamp: string
  level: LogLevel['level']
  component: string
  message: string
  metadata?: unknown
  correlationId?: string
  userId?: string
  requestId?: string
}

export interface MetricValue {
  timestamp: string
  value: number
  tags?: Record<string, string>
}

export interface Alert {
  id: string
  type: 'error_rate' | 'response_time' | 'api_limit' | 'system_health'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: string
  component: string
  resolved: boolean
  resolvedAt?: string
  metadata?: unknown
}

export interface MonitoringConfig {
  logLevel: LogLevel['level']
  enableMetrics: boolean
  enableAlerts: boolean
  retentionDays: number
  alertThresholds: {
    errorRate: number // percentage
    responseTime: number // milliseconds
    apiLimitUsage: number // percentage
  }
  batchSize: number
  flushInterval: number // milliseconds
}

/**
 * Comprehensive logging and monitoring system for Reddit integration
 */
export class RedditMonitor {
  private redis: Redis
  private config: MonitoringConfig
  private logBuffer: LogEntry[] = []
  private metricBuffer: { key: string; value: MetricValue }[] = []
  private alerts: Map<string, Alert> = new Map()
  private flushTimer?: NodeJS.Timeout

  private logLevels: Record<LogLevel['level'], number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4
  }

  constructor(redis: Redis, config: MonitoringConfig) {
    this.redis = redis
    this.config = config

    // Start periodic flush
    this.startPeriodicFlush()
  }

  /**
   * Enhanced logger implementation
   */
  createLogger(component: string) {
    return {
      debug: (message: string, metadata?: unknown) => this.log('debug', component, message, metadata),
      info: (message: string, metadata?: unknown) => this.log('info', component, message, metadata),
      warn: (message: string, metadata?: unknown) => this.log('warn', component, message, metadata),
      error: (message: string, metadata?: unknown) => this.log('error', component, message, metadata),
      fatal: (message: string, metadata?: unknown) => this.log('fatal', component, message, metadata)
    }
  }

  /**
   * Log a message
   */
  private log(
    level: LogLevel['level'],
    component: string,
    message: string,
    metadata?: unknown,
    correlationId?: string,
    userId?: string,
    requestId?: string
  ): void {
    // Check if we should log this level
    if (this.logLevels[level] < this.logLevels[this.config.logLevel]) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      metadata,
      correlationId,
      userId,
      requestId
    }

    // Add to buffer
    this.logBuffer.push(entry)

    // Console logging for immediate feedback
    const consoleMessage = `[${entry.timestamp}] ${level.toUpperCase()} [${component}] ${message}`

    switch (level) {
      case 'debug':
        log.debug(consoleMessage, metadata && typeof metadata === 'object' ? metadata as Record<string, unknown> : undefined)
        break
      case 'info':
        log.info(consoleMessage, metadata && typeof metadata === 'object' ? metadata as Record<string, unknown> : undefined)
        break
      case 'warn':
        log.warn(consoleMessage, metadata && typeof metadata === 'object' ? metadata as Record<string, unknown> : undefined)
        break
      case 'error':
      case 'fatal':
        log.error(consoleMessage, undefined, metadata && typeof metadata === 'object' ? metadata as Record<string, unknown> : undefined)
        break
    }

    // Trigger alerts for error/fatal messages
    if (level === 'error' || level === 'fatal') {
      this.checkForAlerts(entry)
    }

    // Flush if buffer is full
    if (this.logBuffer.length >= this.config.batchSize) {
      this.flush()
    }
  }

  /**
   * Record a metric
   */
  recordMetric(key: string, value: number, tags?: Record<string, string>): void {
    if (!this.config.enableMetrics) return

    const metricValue: MetricValue = {
      timestamp: new Date().toISOString(),
      value,
      tags
    }

    this.metricBuffer.push({ key, value: metricValue })

    // Flush if buffer is full
    if (this.metricBuffer.length >= this.config.batchSize) {
      this.flush()
    }
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(key: string, value = 1, tags?: Record<string, string>): void {
    this.recordMetric(`${key}.count`, value, tags)
  }

  /**
   * Record timing metric
   */
  recordTiming(key: string, durationMs: number, tags?: Record<string, string>): void {
    this.recordMetric(`${key}.duration`, durationMs, tags)
  }

  /**
   * Record gauge metric (current value)
   */
  recordGauge(key: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric(`${key}.gauge`, value, tags)
  }

  /**
   * Start a timer for measuring duration
   */
  startTimer(key: string, tags?: Record<string, string>): () => void {
    const startTime = Date.now()

    return () => {
      const duration = Date.now() - startTime
      this.recordTiming(key, duration, tags)
    }
  }

  /**
   * Create an alert
   */
  createAlert(
    type: Alert['type'],
    severity: Alert['severity'],
    message: string,
    component: string,
    metadata?: unknown
  ): void {
    if (!this.config.enableAlerts) return

    const alert: Alert = {
      id: `${type}_${component}_${Date.now()}`,
      type,
      severity,
      message,
      timestamp: new Date().toISOString(),
      component,
      resolved: false,
      metadata
    }

    this.alerts.set(alert.id, alert)

    // Log the alert
    this.log('error', 'monitor', `ALERT: ${message}`, {
      alertId: alert.id,
      type,
      severity,
      ...(metadata && typeof metadata === 'object' ? metadata as Record<string, unknown> : {})
    })

    // Store in Redis for external monitoring
    this.redis.zadd(
      'reddit:alerts:active',
      Date.now(),
      JSON.stringify(alert)
    )
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId)
    if (!alert) return false

    alert.resolved = true
    alert.resolvedAt = new Date().toISOString()

    this.log('info', 'monitor', `Alert resolved: ${alert.message}`, {
      alertId,
      resolvedAt: alert.resolvedAt
    })

    // Move from active to resolved in Redis
    this.redis.zrem('reddit:alerts:active', JSON.stringify({...alert, resolved: false}))
    this.redis.zadd('reddit:alerts:resolved', Date.now(), JSON.stringify(alert))

    return true
  }

  /**
   * Check for alert conditions
   */
  private async checkForAlerts(entry: LogEntry): Promise<void> {
    // Error rate monitoring
    if (entry.level === 'error' || entry.level === 'fatal') {
      await this.checkErrorRate(entry.component)
    }

    // API rate limit monitoring
    if (entry.message.includes('rate limit') || entry.message.includes('429')) {
      this.createAlert(
        'api_limit',
        'medium',
        'API rate limit reached',
        entry.component,
        { message: entry.message }
      )
    }
  }

  /**
   * Check error rate for alerting
   */
  private async checkErrorRate(component: string): Promise<void> {
    try {
      // Count errors in the last 5 minutes
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)

      const errorCount = await this.redis.zcount(
        `reddit:logs:${component}:error`,
        fiveMinutesAgo,
        Date.now()
      )

      const totalCount = await this.redis.zcount(
        `reddit:logs:${component}:total`,
        fiveMinutesAgo,
        Date.now()
      )

      if (totalCount > 10) { // Only check if we have enough samples
        const errorRate = (errorCount / totalCount) * 100

        if (errorRate > this.config.alertThresholds.errorRate) {
          this.createAlert(
            'error_rate',
            errorRate > 50 ? 'high' : 'medium',
            `High error rate: ${errorRate.toFixed(1)}%`,
            component,
            { errorRate, errorCount, totalCount }
          )
        }
      }
    } catch (error) {
      log.error('Error checking error rate:', error)
    }
  }

  /**
   * Get system health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    components: Record<string, {
      status: 'healthy' | 'degraded' | 'unhealthy'
      lastError?: string
      errorRate?: number
      responseTime?: number
    }>
    activeAlerts: Alert[]
    metrics: {
      totalLogs: number
      errorRate: number
      avgResponseTime: number
    }
  }> {
    try {
      // Get active alerts
      const activeAlertsData = await this.redis.zrange('reddit:alerts:active', 0, -1)
      const activeAlerts = activeAlertsData.map(data => JSON.parse(data) as Alert)

      // Calculate overall metrics
      const now = Date.now()
      const oneHourAgo = now - (60 * 60 * 1000)

      const totalLogs = await this.redis.zcount('reddit:logs:total', oneHourAgo, now)
      const errorLogs = await this.redis.zcount('reddit:logs:error', oneHourAgo, now)
      const errorRate = totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0

      // Get component health
      const components: Record<string, Record<string, unknown>> = {}
      const componentKeys = await this.redis.keys('reddit:logs:*:total')

      for (const key of componentKeys) {
        const component = key.split(':')[2]
        if (component === 'total') continue

        const componentTotal = await this.redis.zcount(key, oneHourAgo, now)
        const componentErrors = await this.redis.zcount(
          `reddit:logs:${component}:error`,
          oneHourAgo,
          now
        )

        const componentErrorRate = componentTotal > 0 ? (componentErrors / componentTotal) * 100 : 0

        let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
        if (componentErrorRate > 20) status = 'unhealthy'
        else if (componentErrorRate > 10) status = 'degraded'

        components[component] = {
          status,
          errorRate: componentErrorRate
        }
      }

      // Determine overall system status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
      const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical').length
      const highAlerts = activeAlerts.filter(a => a.severity === 'high').length

      if (criticalAlerts > 0 || errorRate > 25) {
        status = 'unhealthy'
      } else if (highAlerts > 0 || errorRate > 10) {
        status = 'degraded'
      }

      return {
        status,
        components: components as Record<string, { status: 'healthy' | 'degraded' | 'unhealthy'; lastError?: string; errorRate?: number; responseTime?: number }>,
        activeAlerts,
        metrics: {
          totalLogs,
          errorRate,
          avgResponseTime: 0 // Would calculate from timing metrics
        }
      }
    } catch (error) {
      log.error('Error getting health status:', error)
      return {
        status: 'unhealthy',
        components: {},
        activeAlerts: [],
        metrics: {
          totalLogs: 0,
          errorRate: 100,
          avgResponseTime: 0
        }
      }
    }
  }

  /**
   * Get logs from Redis
   */
  async getLogs(
    component?: string,
    level?: LogLevel['level'],
    limit = 100,
    since?: Date
  ): Promise<LogEntry[]> {
    try {
      const key = component ? `reddit:logs:${component}` : 'reddit:logs:all'
      const sinceTs = since ? since.getTime() : Date.now() - (24 * 60 * 60 * 1000) // 24 hours ago

      const logsData = await this.redis.zrangebyscore(
        key,
        sinceTs,
        Date.now(),
        'LIMIT', 0, limit
      )

      const logs = logsData.map(data => JSON.parse(data) as LogEntry)

      // Filter by level if specified
      if (level) {
        return logs.filter(log => log.level === level)
      }

      return logs.reverse() // Most recent first
    } catch (error) {
      log.error('Error getting logs:', error)
      return []
    }
  }

  /**
   * Get metrics from Redis
   */
  async getMetrics(
    key: string,
    since?: Date,
    limit = 100
  ): Promise<MetricValue[]> {
    try {
      const sinceTs = since ? since.getTime() : Date.now() - (24 * 60 * 60 * 1000)

      const metricsData = await this.redis.zrangebyscore(
        `reddit:metrics:${key}`,
        sinceTs,
        Date.now(),
        'LIMIT', 0, limit
      )

      return metricsData.map(data => JSON.parse(data) as MetricValue)
    } catch (error) {
      log.error('Error getting metrics:', error)
      return []
    }
  }

  /**
   * Flush buffered logs and metrics to Redis
   */
  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0 && this.metricBuffer.length === 0) {
      return
    }

    try {
      const pipeline = this.redis.pipeline()

      // Flush logs
      for (const entry of this.logBuffer) {
        const timestamp = new Date(entry.timestamp).getTime()

        // Store in component-specific log
        pipeline.zadd(`reddit:logs:${entry.component}`, timestamp, JSON.stringify(entry))
        pipeline.zadd(`reddit:logs:${entry.component}:${entry.level}`, timestamp, JSON.stringify(entry))

        // Store in global logs
        pipeline.zadd('reddit:logs:all', timestamp, JSON.stringify(entry))
        pipeline.zadd(`reddit:logs:${entry.level}`, timestamp, JSON.stringify(entry))

        // Track totals for metrics
        pipeline.zadd(`reddit:logs:${entry.component}:total`, timestamp, '1')
        pipeline.zadd('reddit:logs:total', timestamp, '1')
      }

      // Flush metrics
      for (const { key, value } of this.metricBuffer) {
        const timestamp = new Date(value.timestamp).getTime()
        pipeline.zadd(`reddit:metrics:${key}`, timestamp, JSON.stringify(value))
      }

      // Set expiry for old data (retention policy)
      const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000
      const cutoffTime = Date.now() - retentionMs

      // Clean up old logs and metrics
      const allKeys = await this.redis.keys('reddit:logs:*')
      const metricKeys = await this.redis.keys('reddit:metrics:*')

      for (const key of [...allKeys, ...metricKeys]) {
        pipeline.zremrangebyscore(key, 0, cutoffTime)
      }

      await pipeline.exec()

      // Clear buffers
      this.logBuffer.length = 0
      this.metricBuffer.length = 0

    } catch (error) {
      log.error('Error flushing logs and metrics:', error)
    }
  }

  /**
   * Start periodic flush
   */
  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.config.flushInterval)
  }

  /**
   * Clean up resources
   */
  async shutdown(): Promise<void> {
    // Stop periodic flush
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }

    // Flush any remaining logs/metrics
    await this.flush()

    log.info('Reddit monitoring shut down complete')
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig }

    // Restart flush timer if interval changed
    if (newConfig.flushInterval && this.flushTimer) {
      clearInterval(this.flushTimer)
      this.startPeriodicFlush()
    }

    log.info('Reddit monitoring configuration updated')
  }
}
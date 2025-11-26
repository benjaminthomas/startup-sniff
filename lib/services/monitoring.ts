/**
 * Monitoring and Logging Service
 *
 * Provides structured logging and monitoring for background jobs
 * Tracks performance, errors, and job execution history
 */

export interface JobMetrics {
  jobName: string
  startTime: number
  endTime?: number
  duration?: number
  status: 'running' | 'success' | 'failed'
  result?: {
    itemsProcessed?: number
    itemsInserted?: number
    itemsSkipped?: number
    errors?: string[]
  }
  error?: string
}

export interface JobLog {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  metadata?: Record<string, unknown>
}

export class JobMonitor {
  private jobName: string
  private startTime: number
  private logs: JobLog[] = []
  private metrics: Partial<JobMetrics>

  constructor(jobName: string) {
    this.jobName = jobName
    this.startTime = Date.now()
    this.metrics = {
      jobName,
      startTime: this.startTime,
      status: 'running'
    }

    this.log('info', `Job started: ${jobName}`)
  }

  /**
   * Log a message with metadata
   */
  log(
    level: JobLog['level'],
    message: string,
    metadata?: Record<string, unknown>
  ): void {
    const logEntry: JobLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata
    }

    this.logs.push(logEntry)

    // Also output to console
    const prefix = `[${this.jobName}]`
    const meta = metadata ? JSON.stringify(metadata) : ''

    switch (level) {
      case 'info':
        console.log(`${prefix} ${message}`, meta)
        break
      case 'warn':
        console.warn(`${prefix} ${message}`, meta)
        break
      case 'error':
        console.error(`${prefix} ${message}`, meta)
        break
      case 'debug':
        console.log(`${prefix} [DEBUG] ${message}`, meta)
        break
    }
  }

  /**
   * Update job metrics
   */
  updateMetrics(updates: Partial<JobMetrics['result']>): void {
    this.metrics.result = {
      ...this.metrics.result,
      ...updates
    }
  }

  /**
   * Mark job as successful
   */
  success(result?: JobMetrics['result']): JobMetrics {
    const endTime = Date.now()
    const duration = endTime - this.startTime

    this.metrics = {
      ...this.metrics,
      endTime,
      duration,
      status: 'success',
      result: result || this.metrics.result
    }

    this.log('info', `Job completed successfully`, {
      duration: `${(duration / 1000).toFixed(2)}s`,
      ...result
    })

    return this.metrics as JobMetrics
  }

  /**
   * Mark job as failed
   */
  failure(error: Error | string): JobMetrics {
    const endTime = Date.now()
    const duration = endTime - this.startTime
    const errorMessage = error instanceof Error ? error.message : error

    this.metrics = {
      ...this.metrics,
      endTime,
      duration,
      status: 'failed',
      error: errorMessage
    }

    this.log('error', `Job failed: ${errorMessage}`, {
      duration: `${(duration / 1000).toFixed(2)}s`,
      stack: error instanceof Error ? error.stack : undefined
    })

    return this.metrics as JobMetrics
  }

  /**
   * Get current metrics
   */
  getMetrics(): JobMetrics {
    return {
      ...this.metrics,
      duration: this.metrics.endTime
        ? this.metrics.endTime - this.startTime
        : Date.now() - this.startTime
    } as JobMetrics
  }

  /**
   * Get all logs
   */
  getLogs(): JobLog[] {
    return [...this.logs]
  }

  /**
   * Get formatted summary for API response
   */
  getSummary(): {
    jobName: string
    status: string
    duration: string
    result?: JobMetrics['result']
    error?: string
    timestamp: string
  } {
    const metrics = this.getMetrics()

    return {
      jobName: metrics.jobName,
      status: metrics.status,
      duration: metrics.duration ? `${(metrics.duration / 1000).toFixed(2)}s` : 'running',
      result: metrics.result,
      error: metrics.error,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Performance tracker for measuring operation times
 */
export class PerformanceTracker {
  private marks: Map<string, number> = new Map()

  /**
   * Start timing an operation
   */
  start(name: string): void {
    this.marks.set(name, Date.now())
  }

  /**
   * End timing an operation and return duration
   */
  end(name: string): number {
    const startTime = this.marks.get(name)
    if (!startTime) {
      throw new Error(`No start mark found for: ${name}`)
    }

    const duration = Date.now() - startTime
    this.marks.delete(name)
    return duration
  }

  /**
   * Get formatted duration string
   */
  getDuration(name: string): string {
    const duration = this.end(name)
    return `${(duration / 1000).toFixed(2)}s`
  }

  /**
   * Measure a function execution time
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name)
    try {
      const result = await fn()
      const duration = this.end(name)
      console.log(`[Performance] ${name}: ${(duration / 1000).toFixed(2)}s`)
      return result
    } catch (error) {
      this.marks.delete(name)
      throw error
    }
  }
}

/**
 * Error aggregator for collecting multiple errors
 */
export class ErrorAggregator {
  private errors: Array<{ context: string; error: string; timestamp: string }> = []

  /**
   * Add an error
   */
  add(context: string, error: Error | string): void {
    this.errors.push({
      context,
      error: error instanceof Error ? error.message : error,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Check if any errors occurred
   */
  hasErrors(): boolean {
    return this.errors.length > 0
  }

  /**
   * Get error count
   */
  count(): number {
    return this.errors.length
  }

  /**
   * Get all errors
   */
  getAll(): Array<{ context: string; error: string; timestamp: string }> {
    return [...this.errors]
  }

  /**
   * Get formatted error summary
   */
  getSummary(): string[] {
    return this.errors.map(e => `${e.context}: ${e.error}`)
  }
}

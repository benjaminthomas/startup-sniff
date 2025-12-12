/**
 * Type definitions for webhook_events table
 * This table is not in the generated Supabase types yet
 */

export interface WebhookEvent {
  id: string
  event_id: string
  event_type: string
  payload: unknown
  processed: boolean
  processed_at: string | null
  error_message: string | null
  retry_count: number
  created_at: string
  updated_at: string
}

export interface WebhookEventInsert {
  id?: string
  event_id: string
  event_type: string
  payload: unknown
  processed?: boolean
  processed_at?: string | null
  error_message?: string | null
  retry_count?: number
  created_at?: string
  updated_at?: string
}

export interface WebhookEventUpdate {
  event_id?: string
  event_type?: string
  payload?: unknown
  processed?: boolean
  processed_at?: string | null
  error_message?: string | null
  retry_count?: number
  updated_at?: string
}

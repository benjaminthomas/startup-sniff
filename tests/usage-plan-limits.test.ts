import { describe, it, expect } from 'vitest'
import { PLAN_LIMITS } from '../modules/usage/hooks/use-plan-limits'

describe('PLAN_LIMITS', () => {
  it('defines free plan limits', () => {
    expect(PLAN_LIMITS.free.ideas_per_month).toBe(3)
    expect(PLAN_LIMITS.free.validations_per_month).toBe(1)
    expect(PLAN_LIMITS.free.content_per_month).toBe(2)
  })

  it('uses -1 for unlimited plans', () => {
    expect(PLAN_LIMITS.pro_monthly.ideas_per_month).toBe(-1)
    expect(PLAN_LIMITS.pro_yearly.validations_per_month).toBe(-1)
  })
})

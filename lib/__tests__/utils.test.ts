import { validateEmail, formatPrice, calculateTicketAvailability } from '@/lib/utils'

describe('Utility Functions', () => {
  describe('validateEmail', () => {
    it('validates correct email format', () => {
      expect(validateEmail('test@example.com')).toBe(true)
    })

    it('rejects invalid email format', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
    })
  })

  describe('formatPrice', () => {
    it('formats price with dollar sign', () => {
      expect(formatPrice(100)).toBe('$100.00')
    })

    it('handles decimal prices', () => {
      expect(formatPrice(99.99)).toBe('$99.99')
    })

    it('handles zero price', () => {
      expect(formatPrice(0)).toBe('$0.00')
    })
  })

  describe('calculateTicketAvailability', () => {
    it('calculates available tickets correctly', () => {
      const available = calculateTicketAvailability(100, 30)
      expect(available).toBe(70)
    })

    it('returns 0 when all tickets are sold', () => {
      const available = calculateTicketAvailability(100, 100)
      expect(available).toBe(0)
    })
  })
})

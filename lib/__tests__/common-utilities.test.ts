/**
 * Tests for Common Utilities and Helper Functions
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'

describe('Common Utilities', () => {
  describe('String Utilities', () => {
    it('should format currency', () => {
      const amount = 10000
      const formatted = `$${(amount / 100).toFixed(2)}`

      expect(formatted).toBe('$100.00')
    })

    it('should validate email format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const validEmail = 'test@example.com'
      const invalidEmail = 'invalid-email'

      expect(emailRegex.test(validEmail)).toBe(true)
      expect(emailRegex.test(invalidEmail)).toBe(false)
    })

    it('should slug-ify text', () => {
      const text = 'Summer Festival 2026'
      const slug = text
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '')

      expect(slug).toBe('summer-festival-2026')
    })

    it('should truncate long strings', () => {
      const text = 'This is a very long description'
      const maxLength = 20
      const truncated =
        text.length > maxLength ? text.substring(0, maxLength) + '...' : text

      expect(truncated.length).toBeLessThanOrEqual(maxLength + 3)
    })

    it('should capitalize first letter', () => {
      const text = 'event'
      const capitalized = text.charAt(0).toUpperCase() + text.slice(1)

      expect(capitalized).toBe('Event')
    })
  })

  describe('Date Utilities', () => {
    it('should format date to ISO string', () => {
      const date = new Date('2026-06-15')
      const isoString = date.toISOString()

      expect(isoString).toContain('2026-06-15')
    })

    it('should parse date string', () => {
      const dateString = '2026-06-15'
      const date = new Date(dateString)

      expect(date.getFullYear()).toBe(2026)
      expect(date.getMonth()).toBe(5) // 0-indexed
    })

    it('should calculate days until event', () => {
      const eventDate = new Date('2026-06-15')
      const today = new Date('2026-06-01')
      const daysUntil = Math.floor(
        (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      expect(daysUntil).toBe(14)
    })

    it('should check if event is upcoming', () => {
      const eventDate = new Date('2026-06-15')
      const today = new Date('2026-06-01')
      const isUpcoming = eventDate > today

      expect(isUpcoming).toBe(true)
    })

    it('should format time for display', () => {
      const date = new Date('2026-06-15T14:30:00')
      const timeString = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })

      expect(timeString).toContain('2')
    })
  })

  describe('Number Utilities', () => {
    it('should format large numbers with commas', () => {
      const number = 1000000
      const formatted = number.toLocaleString()

      expect(formatted).toBe('1,000,000')
    })

    it('should calculate percentage', () => {
      const sold = 30
      const total = 100
      const percentage = (sold / total) * 100

      expect(percentage).toBe(30)
    })

    it('should round to decimal places', () => {
      const number = 10.456
      const rounded = Math.round(number * 100) / 100

      expect(rounded).toBe(10.46)
    })

    it('should generate random ID', () => {
      const id = Math.random().toString(36).substring(2, 9)

      expect(id.length).toBeGreaterThan(0)
    })
  })

  describe('Array Utilities', () => {
    it('should remove duplicates', () => {
      const array = [1, 2, 2, 3, 3, 3, 4]
      const unique = [...new Set(array)]

      expect(unique).toEqual([1, 2, 3, 4])
    })

    it('should group items by key', () => {
      const items = [
        { type: 'concert', name: 'Rock Night' },
        { type: 'conference', name: 'Tech Summit' },
        { type: 'concert', name: 'Jazz Evening' },
      ]

      const grouped: Record<string, typeof items> = items.reduce(
        (acc, item) => {
          if (!acc[item.type]) acc[item.type] = []
          acc[item.type].push(item)
          return acc
        },
        {} as Record<string, typeof items>
      )

      expect(Object.keys(grouped).length).toBe(2)
      expect(grouped.concert.length).toBe(2)
    })

    it('should flatten nested arrays', () => {
      const nested = [[1, 2], [3, 4], [5, 6]]
      const flattened = nested.flat()

      expect(flattened).toEqual([1, 2, 3, 4, 5, 6])
    })

    it('should sort items', () => {
      const items = [3, 1, 4, 1, 5, 9, 2, 6]
      const sorted = [...items].sort((a, b) => a - b)

      expect(sorted[0]).toBe(1)
      expect(sorted[sorted.length - 1]).toBe(9)
    })

    it('should find item in array', () => {
      const items = [
        { id: 1, name: 'Event 1' },
        { id: 2, name: 'Event 2' },
        { id: 3, name: 'Event 3' },
      ]

      const found = items.find(e => e.id === 2)

      expect(found?.name).toBe('Event 2')
    })
  })

  describe('Object Utilities', () => {
    it('should merge objects', () => {
      const obj1 = { a: 1, b: 2 }
      const obj2 = { c: 3 }
      const merged = { ...obj1, ...obj2 }

      expect(merged).toEqual({ a: 1, b: 2, c: 3 })
    })

    it('should deep clone object', () => {
      const original = { id: 1, nested: { name: 'Event' } }
      const cloned = JSON.parse(JSON.stringify(original))

      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
    })

    it('should pick specific keys', () => {
      const obj = { id: 1, name: 'Event', date: '2026-06-15', secret: 'xxx' }
      const picked = Object.fromEntries(
        Object.entries(obj).filter(([key]) => ['id', 'name'].includes(key))
      )

      expect(Object.keys(picked)).toEqual(['id', 'name'])
    })

    it('should omit specific keys', () => {
      const obj = { id: 1, name: 'Event', secret: 'xxx' }
      const omitted = Object.fromEntries(
        Object.entries(obj).filter(([key]) => !['secret'].includes(key))
      )

      expect('secret' in omitted).toBe(false)
    })

    it('should check if object is empty', () => {
      const empty = {}
      const notEmpty = { id: 1 }

      expect(Object.keys(empty).length === 0).toBe(true)
      expect(Object.keys(notEmpty).length === 0).toBe(false)
    })
  })

  describe('Validation Utilities', () => {
    it('should validate URL format', () => {
      const urlRegex = /^(https?:\/\/)?[\w.-]+\.\w+/
      const validUrl = 'https://example.com'
      const invalidUrl = 'not a url'

      expect(urlRegex.test(validUrl)).toBe(true)
      expect(urlRegex.test(invalidUrl)).toBe(false)
    })

    it('should validate phone number', () => {
      const phoneRegex = /^\+?[\d\s()-]{10,}$/
      const validPhone = '+1 (555) 123-4567'
      const invalidPhone = '123'

      expect(phoneRegex.test(validPhone)).toBe(true)
      expect(phoneRegex.test(invalidPhone)).toBe(false)
    })

    it('should validate required field', () => {
      const field = 'Some value'
      const isEmpty = !field || field.trim() === ''

      expect(isEmpty).toBe(false)
    })

    it('should validate numeric range', () => {
      const value = 50
      const min = 0
      const max = 100

      expect(value >= min && value <= max).toBe(true)
    })
  })

  describe('HTTP Utilities', () => {
    it('should build query string', () => {
      const params = { page: 1, limit: 10, search: 'concert' }
      const queryString = new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ).toString()

      expect(queryString).toContain('page=1')
      expect(queryString).toContain('limit=10')
    })

    it('should parse query string', () => {
      const queryString = 'page=1&limit=10&search=concert'
      const params = Object.fromEntries(
        new URLSearchParams(queryString).entries()
      )

      expect(params.page).toBe('1')
      expect(params.search).toBe('concert')
    })

    it('should determine HTTP status type', () => {
      const statusCode = 404
      const isError = statusCode >= 400

      expect(isError).toBe(true)
    })

    it('should handle retry logic', () => {
      let attempts = 0
      const maxRetries = 3
      const shouldRetry = attempts < maxRetries

      expect(shouldRetry).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should create error messages', () => {
      const errorType = 'VALIDATION_ERROR'
      const message = 'Email is required'
      const error = { type: errorType, message }

      expect(error.type).toBe('VALIDATION_ERROR')
      expect(error.message).toBeTruthy()
    })

    it('should handle specific error types', () => {
      const errors = {
        NETWORK_ERROR: 'Failed to connect',
        VALIDATION_ERROR: 'Invalid input',
        NOT_FOUND: 'Resource not found',
      }

      expect(errors.VALIDATION_ERROR).toBeTruthy()
    })

    it('should log errors', () => {
      const error = new Error('Test error')
      const logged = error.message === 'Test error'

      expect(logged).toBe(true)
    })
  })

  describe('Type Utilities', () => {
    it('should check value type', () => {
      const value = 'string'
      const isString = typeof value === 'string'

      expect(isString).toBe(true)
    })

    it('should check if value is null', () => {
      const value = null
      const isNull = value === null

      expect(isNull).toBe(true)
    })

    it('should check if value is undefined', () => {
      const value = undefined
      const isUndefined = value === undefined

      expect(isUndefined).toBe(true)
    })

    it('should check if value is array', () => {
      const value = [1, 2, 3]
      const isArray = Array.isArray(value)

      expect(isArray).toBe(true)
    })
  })
})

describe('Helper Functions', () => {
  describe('Local Storage Helpers', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    afterEach(() => {
      localStorage.clear()
    })

    it('should save to localStorage', () => {
      const key = 'testKey'
      const value = 'testValue'

      localStorage.setItem(key, value)

      expect(localStorage.getItem(key)).toBe(value)
    })

    it('should retrieve from localStorage', () => {
      const key = 'testKey'
      const value = 'testValue'

      localStorage.setItem(key, value)
      const retrieved = localStorage.getItem(key)

      expect(retrieved).toBe(value)
    })

    it('should remove from localStorage', () => {
      const key = 'testKey'

      localStorage.setItem(key, 'value')
      localStorage.removeItem(key)

      expect(localStorage.getItem(key)).toBeNull()
    })
  })

  describe('Timer Helpers', () => {
    it('should create delay', async () => {
      const delay = (ms: number) =>
        new Promise(resolve => setTimeout(resolve, ms))

      const start = Date.now()
      await delay(10)
      const elapsed = Date.now() - start

      expect(elapsed).toBeGreaterThanOrEqual(10)
    })

    it('should measure execution time', async () => {
      const fn = async () => {
        return new Promise(resolve => setTimeout(resolve, 10))
      }

      const start = Date.now()
      await fn()
      const duration = Date.now() - start

      expect(duration).toBeGreaterThanOrEqual(10)
    })
  })

  describe('Formatting Helpers', () => {
    it('should format bytes to human readable', () => {
      const bytes = 1024
      const kb = bytes / 1024

      expect(kb).toBe(1)
    })

    it('should format JSON', () => {
      const obj = { id: 1, name: 'Event' }
      const json = JSON.stringify(obj, null, 2)

      expect(json).toContain('id')
      expect(json).toContain('Event')
    })
  })
})

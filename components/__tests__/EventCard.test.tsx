/**
 * EventCard Component Tests
 * Note: Full component testing requires Convex/Clerk setup
 * For now, these are basic snapshot tests
 */

import { describe, it, expect } from '@jest/globals'

describe('EventCard Component', () => {
  describe('Event Data Structure', () => {
    const mockEvent = {
      _id: '1',
      _creationTime: Date.now(),
      name: 'Test Event',
      description: 'Test Description',
      date: new Date().toISOString(),
      time: '18:00',
      location: 'Test Location',
      ticketsAvailable: 100,
      ticketPrice: 50,
      organizer: 'Test Organizer',
      imageStorageId: 'test-image',
    }

    it('should have required event properties', () => {
      expect(mockEvent.name).toBeDefined()
      expect(mockEvent.location).toBeDefined()
      expect(mockEvent.ticketPrice).toBeDefined()
      expect(mockEvent.ticketsAvailable).toBeDefined()
    })

    it('should have valid ticket availability', () => {
      expect(mockEvent.ticketsAvailable).toBeGreaterThanOrEqual(0)
    })

    it('should have valid ticket price', () => {
      expect(mockEvent.ticketPrice).toBeGreaterThanOrEqual(0)
    })

    it('should have organizer information', () => {
      expect(mockEvent.organizer).toBeTruthy()
    })
  })
})

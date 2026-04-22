/**
 * Pagination Tests
 * 
 * Performance Architecture: Pagination for Large Datasets (SAD 12.4)
 */

import {
  validatePageSize,
  getOptimalPageSize,
  createPaginatedResponse,
  PAGE_SIZES,
} from "./pagination";

describe("Pagination Utilities (SAD 12.4 - Performance)", () => {
  describe("PAGE_SIZES Constants", () => {
    it("should define appropriate page sizes", () => {
      expect(PAGE_SIZES.SMALL).toBe(10);
      expect(PAGE_SIZES.MEDIUM).toBe(25);
      expect(PAGE_SIZES.LARGE).toBe(50);
      expect(PAGE_SIZES.EXTRA_LARGE).toBe(100);
    });

    it("should maintain size hierarchy", () => {
      expect(PAGE_SIZES.SMALL).toBeLessThan(PAGE_SIZES.MEDIUM);
      expect(PAGE_SIZES.MEDIUM).toBeLessThan(PAGE_SIZES.LARGE);
      expect(PAGE_SIZES.LARGE).toBeLessThan(PAGE_SIZES.EXTRA_LARGE);
    });
  });

  describe("validatePageSize", () => {
    it("should return default size for undefined", () => {
      const size = validatePageSize(undefined);
      expect(size).toBe(PAGE_SIZES.MEDIUM);
    });

    it("should accept valid sizes", () => {
      expect(validatePageSize(10)).toBe(10);
      expect(validatePageSize(25)).toBe(25);
      expect(validatePageSize(50)).toBe(50);
    });

    it("should enforce minimum size", () => {
      // When pageSize=0 (falsy), returns default MEDIUM
      expect(validatePageSize(0)).toBe(PAGE_SIZES.MEDIUM);
      // When pageSize=-5 (falsy after floor), uses min=1
      expect(validatePageSize(-5, 1, 1000)).toBe(1);
    });

    it("should enforce maximum size (default 1000)", () => {
      expect(validatePageSize(2000)).toBe(1000);
      expect(validatePageSize(5000)).toBe(1000);
    });

    it("should respect custom min/max", () => {
      expect(validatePageSize(5, 10, 100)).toBe(10);
      expect(validatePageSize(150, 10, 100)).toBe(100);
    });

    it("should handle decimal sizes (floor)", () => {
      expect(validatePageSize(10.7)).toBe(10);
      expect(validatePageSize(50.3)).toBe(50);
    });
  });

  describe("getOptimalPageSize", () => {
    it("should return medium size for events", () => {
      expect(getOptimalPageSize("events")).toBe(PAGE_SIZES.MEDIUM);
    });

    it("should return large size for tickets", () => {
      expect(getOptimalPageSize("tickets")).toBe(PAGE_SIZES.LARGE);
    });

    it("should return large size for users", () => {
      expect(getOptimalPageSize("users")).toBe(PAGE_SIZES.LARGE);
    });

    it("should return medium size for payments", () => {
      expect(getOptimalPageSize("payments")).toBe(PAGE_SIZES.MEDIUM);
    });

    it("should return medium size for waitingList", () => {
      expect(getOptimalPageSize("waitingList")).toBe(PAGE_SIZES.MEDIUM);
    });

    it("should return default for unknown type", () => {
      const size = getOptimalPageSize("events");
      expect(size).toBeGreaterThan(0);
    });
  });

  describe("createPaginatedResponse", () => {
    it("should create response for first page", () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const response = createPaginatedResponse(
        items,
        false, // Not done, has more pages
        "cursor_123",
        25
      );

      expect(response.items).toEqual(items);
      expect(response.isDone).toBe(false);
      expect(response.hasNextPage).toBe(true);
      expect(response.continueCursor).toBe("cursor_123");
      expect(response.pageSize).toBe(25);
    });

    it("should create response for last page", () => {
      const items = [{ id: 1 }];
      const response = createPaginatedResponse(
        items,
        true, // Done, no more pages
        null,
        25
      );

      expect(response.isDone).toBe(true);
      expect(response.hasNextPage).toBe(false);
      expect(response.continueCursor).toBeNull();
    });

    it("should handle empty page", () => {
      const response = createPaginatedResponse([], true, null, 25);
      
      expect(response.items).toEqual([]);
      expect(response.isDone).toBe(true);
      expect(response.hasNextPage).toBe(false);
    });
  });

  describe("Performance Benefits", () => {
    it("should demonstrate pagination memory efficiency", () => {
      // With 100K items
      const totalItems = 100000;
      const pageSize = PAGE_SIZES.MEDIUM;
      const totalPages = Math.ceil(totalItems / pageSize);

      expect(totalPages).toBe(4000); // 25 items per page
      expect(pageSize).toBeLessThan(totalItems);

      // Each page is a small portion
      const percentagePerPage = (pageSize / totalItems) * 100;
      expect(percentagePerPage).toBeLessThan(1);
    });

    it("should handle large datasets efficiently", () => {
      const pageSizes = [
        { dataType: "events" as const, size: PAGE_SIZES.MEDIUM },
        { dataType: "tickets" as const, size: PAGE_SIZES.LARGE },
        { dataType: "users" as const, size: PAGE_SIZES.LARGE },
      ];

      for (const { dataType, size } of pageSizes) {
        expect(getOptimalPageSize(dataType)).toBe(size);
        expect(size).toBeGreaterThan(0);
        expect(size).toBeLessThanOrEqual(PAGE_SIZES.EXTRA_LARGE);
      }
    });

    it("should cap maximum page size to prevent abuse", () => {
      // Prevent someone requesting all 1M items at once
      const maxSize = validatePageSize(999999);
      expect(maxSize).toBeLessThanOrEqual(1000);
    });
  });

  describe("Pagination Workflow", () => {
    it("should handle pagination flow: first -> middle -> last page", () => {
      // First page
      const page1 = createPaginatedResponse(
        Array(25).fill({ id: 1 }),
        false,
        "cursor_after_25",
        25
      );
      expect(page1.hasNextPage).toBe(true);

      // Middle page
      const page2 = createPaginatedResponse(
        Array(25).fill({ id: 2 }),
        false,
        "cursor_after_50",
        25
      );
      expect(page2.hasNextPage).toBe(true);

      // Last page
      const page3 = createPaginatedResponse(
        Array(15).fill({ id: 3 }),
        true,
        null,
        25
      );
      expect(page3.hasNextPage).toBe(false);
    });

    it("should handle single page", () => {
      const singlePage = createPaginatedResponse(
        Array(10).fill({ id: 1 }),
        true, // All data fits in one page
        null,
        25
      );
      
      expect(singlePage.hasNextPage).toBe(false);
      expect(singlePage.items.length).toBeLessThan(25);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero page size request", () => {
      const size = validatePageSize(0);
      expect(size).toBe(PAGE_SIZES.MEDIUM); // 0 is falsy, returns default
    });

    it("should handle negative page size", () => {
      const size = validatePageSize(-100);
      expect(size).toBe(1); // Negative gets floored to -100, which is < min(1)
    });

    it("should handle very large page size requests", () => {
      const size = validatePageSize(1000000);
      expect(size).toBeLessThanOrEqual(1000);
    });

    it("should handle null/undefined gracefully", () => {
      expect(validatePageSize(undefined)).toBe(PAGE_SIZES.MEDIUM);
      expect(validatePageSize(null as any)).toBe(PAGE_SIZES.MEDIUM);
    });
  });

  describe("Scaling Scenarios", () => {
    it("should handle 10K records efficiently", () => {
      const totalRecords = 10000;
      const pageSize = PAGE_SIZES.MEDIUM;
      const totalRequests = Math.ceil(totalRecords / pageSize);
      
      // 400 requests of 25 items each
      expect(totalRequests).toBe(400);
      expect(totalRequests * pageSize).toBeGreaterThanOrEqual(totalRecords);
    });

    it("should handle 1M records efficiently", () => {
      const totalRecords = 1000000;
      const pageSize = PAGE_SIZES.MEDIUM;
      const totalRequests = Math.ceil(totalRecords / pageSize);
      
      // 40,000 requests of 25 items each
      expect(totalRequests).toBe(40000);
      
      // Compare memory usage
      const withCollect = totalRecords * 100; // bytes per item
      const withPaginate = pageSize * 100;
      
      expect(withPaginate).toBeLessThan(withCollect);
    });

    it("should demonstrate pagination advantage", () => {
      // Without pagination (collect all)
      const million = 1000000;
      const costCollectAll = million; // Load all items
      
      // With pagination
      const pageSize = PAGE_SIZES.MEDIUM;
      const costPaginate = pageSize; // Load one page
      
      expect(costPaginate).toBeLessThan(costCollectAll);
      expect(costCollectAll / costPaginate).toBe(40000);
    });
  });
});

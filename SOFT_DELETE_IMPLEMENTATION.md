# Soft Delete Implementation (ADD 3 & 11)

## Overview
Implemented the "Ignore Faulty Behavior" pattern using Soft Delete strategy to preserve transaction history and maintain data integrity. Instead of hard-deleting records, we mark them as deleted using an `isDeleted` flag.

## Changes Made

### 1. Database Schema Updates (`convex/schema.ts`)
Added `isDeleted: v.optional(v.boolean())` field to the following tables:
- **users** - For user deletion while preserving user history
- **events** - For event cancellation/deletion while preserving event history
- **tickets** - For ticket refunds/cancellation while preserving purchase history
- **payments** - For payment record preservation for auditing
- **waitingList** - For queue entry removal while preserving queue history

### 2. Users Module (`convex/users.ts`)

#### Added `deleteUser` Mutation
```typescript
export const deleteUser = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    // SOFT DELETE: Set isDeleted flag instead of deleting
    await ctx.db.patch(user._id, { isDeleted: true });
    return { success: true, message: "User marked as deleted" };
  },
});
```

#### Updated Queries
- `getUserById()` - Filters out deleted users
- `getUserByEmail()` - Filters out deleted users

### 3. Events Module (`convex/events.ts`)

#### Updated `cancelEvent` Mutation
Changed from hard delete to soft delete:
```typescript
// BEFORE (Hard Delete)
await ctx.db.delete(entry._id);

// AFTER (Soft Delete)
await ctx.db.patch(entry._id, { isDeleted: true });
```

#### Updated in `purchaseTickets` Mutation
Changed waiting list entry deletion to soft delete:
```typescript
// Mark the waiting list entry as deleted (soft delete)
await ctx.db.patch(waitingListId, { isDeleted: true });
```

#### Updated Queries
- `get()` - Filters out soft-deleted events
- `getById()` - Filters out soft-deleted events
- `search()` - Filters out soft-deleted events
- `getSellerEvents()` - Filters out soft-deleted events and tickets

### 4. Tickets Module (`convex/tickets.ts`)

#### Updated Queries
All ticket queries now filter out soft-deleted tickets:
- `getUserTicketForEvent()` - Filters `isDeleted`
- `getUserTicketCountForEvent()` - Filters `isDeleted`
- `getTicketWithDetails()` - Returns null if deleted
- `getValidTicketsForEvent()` - Filters `isDeleted`

### 5. Waiting List Module (`convex/waitingList.ts`)

#### Updated Queries
- `getQueuePosition()` - Filters out soft-deleted entries
- `cleanupExpiredOffers()` - Filters out soft-deleted entries

### 6. Migrations Module (`convex/migrations.ts`)

#### Updated All Delete Operations
Changed all `ctx.db.delete()` calls to `ctx.db.patch()` with soft delete:
- `resolveRoleConflicts()` - Soft deletes tickets and payments
- `deletePurchasedWaitingListEntries()` - Soft deletes waiting list entries
- `deleteOrphanedPayments()` - Soft deletes payments

## Benefits

1. **Data Integrity** - Complete transaction history is preserved
2. **Auditability** - All changes can be tracked for compliance
3. **Recoverability** - Accidentally deleted data can be recovered
4. **Analytics** - Historical data remains available for reporting
5. **Compliance** - Meets regulatory requirements for data retention

## Query Pattern

All queries now follow this pattern to exclude soft-deleted records:
```typescript
.filter((q) => q.eq(q.field("isDeleted"), undefined))
```

Or with multiple conditions:
```typescript
.filter((q) =>
  q.and(
    q.or(...conditions),
    q.eq(q.field("isDeleted"), undefined)
  )
)
```

## Testing

All existing tests pass with the soft delete implementation. Tests verify:
- ✅ Soft delete mutations work correctly
- ✅ Queries properly filter deleted records
- ✅ Historical data is preserved
- ✅ No data loss occurs

## Migration Path

To fully adopt soft deletes across the system:
1. ✅ Schema updated with `isDeleted` fields
2. ✅ All delete operations converted to soft deletes
3. ✅ All queries updated to filter soft-deleted records
4. ✅ Tests verified and passing

## Future Considerations

1. **Audit Table** - Consider adding audit logs for all deletions
2. **Soft Delete Reports** - Generate reports on soft-deleted records
3. **Hard Delete Policy** - Establish policy for when/if to hard delete
4. **Retention Period** - Set retention periods for different entity types

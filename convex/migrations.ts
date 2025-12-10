import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query để xem trạng thái hiện tại của users
export const checkUsersRoleStatus = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    const stats = {
      totalUsers: users.length,
      usersWithRole: users.filter(u => u.role).length,
      usersWithoutRole: users.filter(u => !u.role).length,
      organizers: users.filter(u => u.role === "organizer").length,
      regularUsers: users.filter(u => u.role === "user").length,
    };
    
    const usersWithoutRole = users
      .filter(u => !u.role)
      .map(u => ({
        userId: u.userId,
        email: u.email,
        name: u.name,
      }));
    
    return { stats, usersWithoutRole };
  },
});

// Mutation để migrate data - assign role dựa trên việc user có tạo event không
export const migrateUserRoles = mutation({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const events = await ctx.db.query("events").collect();
    
    let updated = 0;
    let alreadyHasRole = 0;
    let errors = 0;
    
    for (const user of users) {
      // Skip nếu user đã có role
      if (user.role) {
        alreadyHasRole++;
        continue;
      }
      
      try {
        // Check xem user này có tạo event nào không
        const hasCreatedEvents = events.some(event => event.userId === user.userId);
        
        // Nếu có tạo event → organizer, không thì là user
        const role = hasCreatedEvents ? "organizer" : "user";
        
        await ctx.db.patch(user._id, { role });
        updated++;
      } catch (error) {
        console.error(`Error updating user ${user.userId}:`, error);
        errors++;
      }
    }
    
    return {
      success: true,
      totalUsers: users.length,
      updated,
      alreadyHasRole,
      errors,
      message: `Migration completed: ${updated} users updated, ${alreadyHasRole} already had roles, ${errors} errors`,
    };
  },
});

// Mutation để set role thủ công cho một user cụ thể
export const setUserRoleManually = mutation({
  args: {
    userId: v.string(),
    role: v.union(v.literal("user"), v.literal("organizer")),
  },
  handler: async (ctx, { userId, role }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    
    if (!user) {
      throw new Error(`User with userId ${userId} not found`);
    }
    
    await ctx.db.patch(user._id, { role });
    
    return {
      success: true,
      message: `User ${user.email} role set to ${role}`,
    };
  },
});

// Query để xem user nào đã tạo event
export const getUsersWithEvents = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const events = await ctx.db.query("events").collect();
    
    const usersWithEvents = users
      .map(user => {
        const userEvents = events.filter(e => e.userId === user.userId);
        return {
          userId: user.userId,
          email: user.email,
          name: user.name,
          currentRole: user.role,
          eventsCreated: userEvents.length,
          eventNames: userEvents.map(e => e.name),
        };
      })
      .filter(u => u.eventsCreated > 0);
    
    return usersWithEvents;
  },
});

// Reset tất cả roles về "user" (nếu cần)
export const resetAllRolesToUser = mutation({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    let updated = 0;
    for (const user of users) {
      await ctx.db.patch(user._id, { role: "user" });
      updated++;
    }
    
    return {
      success: true,
      message: `Reset ${updated} users to role "user"`,
    };
  },
});

// Query để tìm conflict tickets (tickets được mua bởi organizers)
export const findConflictTickets = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const tickets = await ctx.db.query("tickets").collect();
    const events = await ctx.db.query("events").collect();
    
    // Lấy danh sách organizers
    const organizers = users.filter(u => u.role === "organizer");
    const organizerUserIds = new Set(organizers.map(o => o.userId));
    
    // Tìm tickets được mua bởi organizers
    const conflictTickets = tickets
      .filter(ticket => organizerUserIds.has(ticket.userId))
      .map(ticket => {
        const user = users.find(u => u.userId === ticket.userId);
        const event = events.find(e => e._id === ticket.eventId);
        return {
          ticketId: ticket._id,
          ticketStatus: ticket.status,
          userId: ticket.userId,
          userEmail: user?.email,
          userName: user?.name,
          eventId: ticket.eventId,
          eventName: event?.name,
          amount: ticket.amount,
          purchasedAt: ticket.purchasedAt,
        };
      });
    
    return {
      totalConflicts: conflictTickets.length,
      conflicts: conflictTickets,
      organizersWithTickets: [...new Set(conflictTickets.map(t => t.userId))].length,
    };
  },
});

// Mutation để xóa conflict tickets
export const deleteConflictTickets = mutation({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const tickets = await ctx.db.query("tickets").collect();
    const payments = await ctx.db.query("payments").collect();
    
    // Lấy danh sách organizers
    const organizers = users.filter(u => u.role === "organizer");
    const organizerUserIds = new Set(organizers.map(o => o.userId));
    
    // Tìm và xóa tickets được mua bởi organizers
    const conflictTickets = tickets.filter(ticket => 
      organizerUserIds.has(ticket.userId)
    );
    
    // Tìm payments liên quan đến những tickets này
    const ticketIds = new Set(conflictTickets.map(t => t._id));
    const relatedPayments = payments.filter(payment => 
      organizerUserIds.has(payment.userId)
    );
    
    let deletedTickets = 0;
    let deletedPayments = 0;
    let errors = 0;
    
    // Xóa tickets
    for (const ticket of conflictTickets) {
      try {
        await ctx.db.delete(ticket._id);
        deletedTickets++;
      } catch (error) {
        console.error(`Error deleting ticket ${ticket._id}:`, error);
        errors++;
      }
    }
    
    // Xóa payments
    for (const payment of relatedPayments) {
      try {
        await ctx.db.delete(payment._id);
        deletedPayments++;
      } catch (error) {
        console.error(`Error deleting payment ${payment._id}:`, error);
        errors++;
      }
    }
    
    return {
      success: true,
      totalConflicts: conflictTickets.length,
      deletedTickets,
      deletedPayments,
      errors,
      message: `Deleted ${deletedTickets} tickets and ${deletedPayments} payments from organizers, ${errors} errors`,
    };
  },
});

// Query để xem tổng quan về tickets
export const getTicketsOverview = query({
  handler: async (ctx) => {
    const tickets = await ctx.db.query("tickets").collect();
    const users = await ctx.db.query("users").collect();
    
    const organizers = users.filter(u => u.role === "organizer");
    const organizerUserIds = new Set(organizers.map(o => o.userId));
    
    const regularUserTickets = tickets.filter(t => !organizerUserIds.has(t.userId));
    const organizerTickets = tickets.filter(t => organizerUserIds.has(t.userId));
    
    return {
      totalTickets: tickets.length,
      regularUserTickets: regularUserTickets.length,
      organizerTickets: organizerTickets.length,
      validTickets: tickets.filter(t => t.status === "valid").length,
      usedTickets: tickets.filter(t => t.status === "used").length,
      expiredTickets: tickets.filter(t => t.status === "expired").length,
    };
  },
});

// Query để kiểm tra waiting list entries đã PURCHASED
export const checkPurchasedWaitingListEntries = query({
  handler: async (ctx) => {
    const waitingList = await ctx.db.query("waitingList").collect();
    const tickets = await ctx.db.query("tickets").collect();
    const events = await ctx.db.query("events").collect();
    
    const purchasedEntries = waitingList.filter(entry => entry.status === "purchased");
    
    // Group by user and event
    const groupedByUser = purchasedEntries.reduce((acc, entry) => {
      const key = entry.userId;
      if (!acc[key]) {
        acc[key] = {
          userId: entry.userId,
          entries: [],
          events: new Set(),
        };
      }
      acc[key].entries.push(entry);
      acc[key].events.add(entry.eventId);
      return acc;
    }, {} as Record<string, { userId: string; entries: any[]; events: Set<string> }>);

    const summary = Object.values(groupedByUser).map(group => {
      const userTickets = tickets.filter(t => t.userId === group.userId);
      return {
        userId: group.userId,
        purchasedEntriesCount: group.entries.length,
        uniqueEventsCount: group.events.size,
        totalTicketsOwned: userTickets.length,
        entries: group.entries.map(entry => {
          const event = events.find(e => e._id === entry.eventId);
          return {
            entryId: entry._id,
            eventId: entry.eventId,
            eventName: event?.name,
            status: entry.status,
            createdAt: entry._creationTime,
          };
        }),
      };
    });

    return {
      totalPurchasedEntries: purchasedEntries.length,
      affectedUsers: Object.keys(groupedByUser).length,
      details: summary,
    };
  },
});

// Mutation để expire các waiting list entries đã PURCHASED (cho phép mua lại)
export const expirePurchasedWaitingListEntries = mutation({
  handler: async (ctx) => {
    const waitingList = await ctx.db.query("waitingList").collect();
    
    const purchasedEntries = waitingList.filter(entry => entry.status === "purchased");
    
    let expired = 0;
    let errors = 0;
    
    for (const entry of purchasedEntries) {
      try {
        await ctx.db.patch(entry._id, { 
          status: "expired",
        });
        expired++;
      } catch (error) {
        console.error(`Error expiring waiting list entry ${entry._id}:`, error);
        errors++;
      }
    }
    
    return {
      success: true,
      totalPurchasedEntries: purchasedEntries.length,
      expired,
      errors,
      message: `Expired ${expired} purchased waiting list entries, ${errors} errors. Users can now purchase tickets again.`,
    };
  },
});

// Mutation XÓA HOÀN TOÀN các entries "purchased" (không chỉ expire)
// Dùng khi expire không giải quyết được vấn đề
export const deletePurchasedWaitingListEntries = mutation({
  handler: async (ctx) => {
    const waitingList = await ctx.db.query("waitingList").collect();
    
    const purchasedEntries = waitingList.filter(entry => entry.status === "purchased");
    
    let deleted = 0;
    let errors = 0;
    
    for (const entry of purchasedEntries) {
      try {
        await ctx.db.delete(entry._id);
        deleted++;
      } catch (error) {
        console.error(`Error deleting waiting list entry ${entry._id}:`, error);
        errors++;
      }
    }
    
    return {
      success: true,
      totalPurchasedEntries: purchasedEntries.length,
      deleted,
      errors,
      message: `Deleted ${deleted} purchased waiting list entries, ${errors} errors. Users can now purchase tickets again.`,
    };
  },
});

// Query để kiểm tra xem user có thể mua ticket từ event không
export const checkUserCanPurchase = query({
  args: {
    userId: v.string(),
    eventId: v.id("events"),
  },
  handler: async (ctx, { userId, eventId }) => {
    const waitingList = await ctx.db
      .query("waitingList")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", userId).eq("eventId", eventId)
      )
      .collect();
    
    const activeEntries = waitingList.filter(
      entry => entry.status === "waiting" || entry.status === "offered"
    );
    
    const purchasedEntries = waitingList.filter(
      entry => entry.status === "purchased"
    );
    
    const expiredEntries = waitingList.filter(
      entry => entry.status === "expired"
    );
    
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();
    
    const ticketsForEvent = tickets.filter(t => t.eventId === eventId);
    
    return {
      canPurchase: activeEntries.length === 0,
      reason: activeEntries.length > 0 
        ? "User has active waiting list entry (WAITING or OFFERED)"
        : "User can purchase",
      waitingListEntries: {
        active: activeEntries.length,
        purchased: purchasedEntries.length,
        expired: expiredEntries.length,
      },
      ticketsOwned: ticketsForEvent.length,
      allEntries: waitingList.map(entry => ({
        entryId: entry._id,
        status: entry.status,
        createdAt: entry._creationTime,
      })),
    };
  },
});

// Query để debug tất cả waiting list entries của user
export const getAllUserWaitingListEntries = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const waitingList = await ctx.db
      .query("waitingList")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
    
    const events = await ctx.db.query("events").collect();
    
    return waitingList.map(entry => {
      const event = events.find(e => e._id === entry.eventId);
      return {
        entryId: entry._id,
        eventName: event?.name || "Unknown Event",
        eventId: entry.eventId,
        status: entry.status,
        offerExpiresAt: entry.offerExpiresAt,
        createdAt: entry._creationTime,
      };
    });
  },
});

// Query để check events có oversold (sold > total)
export const checkOversoldEvents = query({
  handler: async (ctx) => {
    const events = await ctx.db.query("events").collect();
    const tickets = await ctx.db.query("tickets").collect();
    
    const oversoldEvents = [];
    
    for (const event of events) {
      const soldTickets = tickets.filter(
        t => t.eventId === event._id && 
        (t.status === "valid" || t.status === "used")
      ).length;
      
      if (soldTickets > event.totalTickets) {
        oversoldEvents.push({
          eventId: event._id,
          eventName: event.name,
          totalTickets: event.totalTickets,
          soldTickets,
          oversold: soldTickets - event.totalTickets,
        });
      }
    }
    
    return {
      totalOversoldEvents: oversoldEvents.length,
      events: oversoldEvents,
    };
  },
});

// Query để check orphaned payments (payments mà ticket đã bị xóa)
export const checkOrphanedPayments = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const payments = await ctx.db.query("payments").collect();
    const events = await ctx.db.query("events").collect();
    
    // Lấy danh sách organizers
    const organizers = users.filter(u => u.role === "organizer");
    const organizerUserIds = new Set(organizers.map(o => o.userId));
    
    // Tìm payments của organizers
    const organizerPayments = payments.filter(payment => 
      organizerUserIds.has(payment.userId)
    );
    
    // Tìm payments có eventId không tồn tại nữa
    const eventIds = new Set(events.map(e => e._id));
    const orphanedEventPayments = payments.filter(payment => 
      !eventIds.has(payment.eventId)
    );
    
    const organizerPaymentsDetails = organizerPayments.map(payment => {
      const user = users.find(u => u.userId === payment.userId);
      const event = events.find(e => e._id === payment.eventId);
      return {
        paymentId: payment._id,
        userId: payment.userId,
        userEmail: user?.email,
        userName: user?.name,
        eventId: payment.eventId,
        eventName: event?.name || "Unknown Event",
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt,
      };
    });
    
    const orphanedEventPaymentsDetails = orphanedEventPayments.map(payment => {
      const user = users.find(u => u.userId === payment.userId);
      return {
        paymentId: payment._id,
        userId: payment.userId,
        userEmail: user?.email,
        userName: user?.name,
        eventId: payment.eventId,
        eventName: "Event Deleted",
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt,
      };
    });
    
    return {
      organizerPaymentsCount: organizerPayments.length,
      organizerPayments: organizerPaymentsDetails,
      orphanedEventPaymentsCount: orphanedEventPayments.length,
      orphanedEventPayments: orphanedEventPaymentsDetails,
      totalToDelete: organizerPayments.length + orphanedEventPayments.length,
    };
  },
});

// Mutation để xóa orphaned payments và payments của organizers
export const cleanupOrphanedPayments = mutation({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const payments = await ctx.db.query("payments").collect();
    const events = await ctx.db.query("events").collect();
    
    // Lấy danh sách organizers
    const organizers = users.filter(u => u.role === "organizer");
    const organizerUserIds = new Set(organizers.map(o => o.userId));
    
    // Tìm payments của organizers
    const organizerPayments = payments.filter(payment => 
      organizerUserIds.has(payment.userId)
    );
    
    // Tìm payments có eventId không tồn tại nữa
    const eventIds = new Set(events.map(e => e._id));
    const orphanedEventPayments = payments.filter(payment => 
      !eventIds.has(payment.eventId)
    );
    
    // Combine và loại bỏ duplicate
    const paymentsToDelete = new Set([
      ...organizerPayments.map(p => p._id),
      ...orphanedEventPayments.map(p => p._id),
    ]);
    
    let deleted = 0;
    let errors = 0;
    
    for (const paymentId of paymentsToDelete) {
      try {
        await ctx.db.delete(paymentId);
        deleted++;
      } catch (error) {
        console.error(`Error deleting payment ${paymentId}:`, error);
        errors++;
      }
    }
    
    return {
      success: true,
      organizerPaymentsFound: organizerPayments.length,
      orphanedEventPaymentsFound: orphanedEventPayments.length,
      totalDeleted: deleted,
      errors,
      message: `Deleted ${deleted} orphaned/organizer payments, ${errors} errors`,
    };
  },
});

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
    
    // Lấy danh sách organizers
    const organizers = users.filter(u => u.role === "organizer");
    const organizerUserIds = new Set(organizers.map(o => o.userId));
    
    // Tìm và xóa tickets được mua bởi organizers
    const conflictTickets = tickets.filter(ticket => 
      organizerUserIds.has(ticket.userId)
    );
    
    let deleted = 0;
    let errors = 0;
    
    for (const ticket of conflictTickets) {
      try {
        await ctx.db.delete(ticket._id);
        deleted++;
      } catch (error) {
        console.error(`Error deleting ticket ${ticket._id}:`, error);
        errors++;
      }
    }
    
    return {
      success: true,
      totalConflicts: conflictTickets.length,
      deleted,
      errors,
      message: `Deleted ${deleted} conflict tickets from organizers, ${errors} errors`,
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

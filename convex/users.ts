import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const updateUser = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, { userId, name, email }) => {
    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (existingUser) {
      // Update existing user và set role nếu chưa có
      const updateData: any = {
        name,
        email,
      };
      
      // Nếu user chưa có role, set mặc định là "user"
      if (!existingUser.role) {
        updateData.role = "user";
      }
      
      await ctx.db.patch(existingUser._id, updateData);
      return existingUser._id;
    }

    // Create new user với role mặc định là "user"
    const newUserId = await ctx.db.insert("users", {
      userId,
      name,
      email,
      role: "user", // Mặc định là user
    });

    return newUserId;
  },
});

export const getUserById = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    return user;
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    return user;
  },
});

// Lấy role của user
export const getUserRole = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    return user?.role || "user"; // Mặc định là user nếu không tìm thấy
  },
});

// Kiểm tra xem user có thể chuyển role không
export const canSwitchRole = query({
  args: {
    userId: v.string(),
    targetRole: v.union(v.literal("user"), v.literal("organizer")),
  },
  handler: async (ctx, { userId, targetRole }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (!user) {
      return {
        canSwitch: false,
        reason: "User not found",
      };
    }

    // Nếu đang ở role hiện tại
    if (user.role === targetRole) {
      return {
        canSwitch: false,
        reason: "Already in target role",
      };
    }

    // Nếu muốn chuyển sang ORGANIZER
    if (targetRole === "organizer") {
      // Kiểm tra xem user đã mua vé nào chưa
      const tickets = await ctx.db
        .query("tickets")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .collect();

      if (tickets.length > 0) {
        return {
          canSwitch: false,
          reason: `Cannot become organizer: You have ${tickets.length} purchased ticket(s). Please contact admin to delete your tickets first.`,
          ticketCount: tickets.length,
        };
      }
    }

    // Nếu muốn chuyển sang USER
    if (targetRole === "user") {
      // Kiểm tra xem organizer đã tạo event nào chưa
      const events = await ctx.db
        .query("events")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .collect();

      if (events.length > 0) {
        return {
          canSwitch: false,
          reason: `Cannot become user: You have created ${events.length} event(s). Please delete or transfer your events first.`,
          eventCount: events.length,
        };
      }
    }

    return {
      canSwitch: true,
      reason: "OK",
    };
  },
});

// Cập nhật role của user với validation
export const updateUserRole = mutation({
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
      throw new Error("User not found");
    }

    // Validation: Check if switch is allowed
    if (role === "organizer") {
      // Kiểm tra tickets
      const tickets = await ctx.db
        .query("tickets")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .collect();

      if (tickets.length > 0) {
        throw new Error(
          `Cannot become organizer: You have ${tickets.length} purchased ticket(s). Please contact admin to delete your tickets first.`
        );
      }
    }

    if (role === "user") {
      // Kiểm tra events
      const events = await ctx.db
        .query("events")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .collect();

      if (events.length > 0) {
        throw new Error(
          `Cannot become user: You have created ${events.length} event(s). Please delete or transfer your events first.`
        );
      }
    }

    await ctx.db.patch(user._id, { role });
    return { success: true };
  },
});
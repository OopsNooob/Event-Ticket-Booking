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

// Cập nhật role của user
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

    await ctx.db.patch(user._id, { role });
    return { success: true };
  },
});
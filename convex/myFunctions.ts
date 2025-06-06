import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

// Get the current authenticated user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    const user = await ctx.db.get(userId);
    return user;
  },
});

// Update the current authenticated user's profile
export const updateUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, { name, email }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }
    
    await ctx.db.patch(userId, {
      name,
      email,
    });
  },
});

// Customer management functions

export const getCustomers = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("in_hospital"), v.literal("disabled"), v.literal("all"))),
  },
  handler: async (ctx, { search, status }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Get all customers for the authenticated user only
    let customers = await ctx.db
      .query("customers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter(
        (customer) =>
          customer.firstName.toLowerCase().includes(searchLower) ||
          customer.lastName.toLowerCase().includes(searchLower) ||
          `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchLower) ||
          customer.email.toLowerCase().includes(searchLower) ||
          customer.customerId.toLowerCase().includes(searchLower) ||
          customer.company?.toLowerCase().includes(searchLower) ||
          customer.phone?.includes(search)
      );
    }

    // Apply status filter
    if (status && status !== "all") {
      customers = customers.filter((customer) => customer.status === status);
    }

    return customers;
  },
});

export const getCustomer = query({
  args: { id: v.id("customers") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const customer = await ctx.db.get(id);
    if (!customer || customer.userId !== userId) {
      throw new Error("Customer not found or access denied");
    }

    return customer;
  },
});

// Helper function to generate customer ID
const generateCustomerId = () => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `CUST-${timestamp}-${randomPart}`.toUpperCase();
};

export const createCustomer = mutation({
  args: {
    customerId: v.optional(v.string()),
    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    company: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("in_hospital"), v.literal("disabled")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Generate customer ID if not provided
    let finalCustomerId = args.customerId;
    if (!finalCustomerId || finalCustomerId.trim() === "") {
      finalCustomerId = generateCustomerId();
    }

    // Check if customerId already exists for this user
    const existingCustomer = await ctx.db
      .query("customers")
      .withIndex("by_customer_id", (q) => q.eq("customerId", finalCustomerId))
      .first();

    if (existingCustomer && existingCustomer.userId === userId) {
      throw new Error("Customer ID already exists");
    }

    const now = Date.now();
    const customerId = await ctx.db.insert("customers", {
      userId,
      customerId: finalCustomerId,
      firstName: args.firstName,
      lastName: args.lastName,
      dateOfBirth: args.dateOfBirth,
      email: args.email,
      phone: args.phone,
      address: args.address,
      company: args.company,
      notes: args.notes,
      status: args.status,
      createdAt: now,
      updatedAt: now,
    });

    return customerId;
  },
});

export const updateCustomer = mutation({
  args: {
    id: v.id("customers"),
    customerId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    company: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("in_hospital"), v.literal("disabled")),
  },
  handler: async (ctx, { id, ...updates }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const customer = await ctx.db.get(id);
    if (!customer || customer.userId !== userId) {
      throw new Error("Customer not found or access denied");
    }

    // Check if customerId already exists for another customer
    if (updates.customerId !== customer.customerId) {
      const existingCustomer = await ctx.db
        .query("customers")
        .withIndex("by_customer_id", (q) => q.eq("customerId", updates.customerId))
        .first();

      if (existingCustomer && existingCustomer._id !== id) {
        throw new Error("Customer ID already exists");
      }
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const deleteCustomer = mutation({
  args: { id: v.id("customers") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const customer = await ctx.db.get(id);
    if (!customer || customer.userId !== userId) {
      throw new Error("Customer not found or access denied");
    }

    await ctx.db.delete(id);
  },
});

// You can read data from the database via a query:
export const listNumbers = query({
  // Validators for arguments.
  args: {
    count: v.number(),
  },

  // Query implementation.
  handler: async (ctx, args) => {
    //// Read the database as many times as you need here.
    //// See https://docs.convex.dev/database/reading-data.
    const numbers = await ctx.db
      .query("numbers")
      // Ordered by _creationTime, return most recent
      .order("desc")
      .take(args.count);
    const userId = await getAuthUserId(ctx);
    const user = userId === null ? null : await ctx.db.get(userId);
    return {
      viewer: user?.email ?? null,
      numbers: numbers.reverse().map((number) => number.value),
    };
  },
});

// You can write data to the database via a mutation:
export const addNumber = mutation({
  // Validators for arguments.
  args: {
    value: v.number(),
  },

  // Mutation implementation.
  handler: async (ctx, args) => {
    //// Insert or modify documents in the database here.
    //// Mutations can also read from the database like queries.
    //// See https://docs.convex.dev/database/writing-data.

    const id = await ctx.db.insert("numbers", { value: args.value });

    console.log("Added new document with id:", id);
    // Optionally, return a value from your mutation.
    // return id;
  },
});

// You can fetch data from and send data to third-party APIs via an action:
export const myAction = action({
  // Validators for arguments.
  args: {
    first: v.number(),
    second: v.string(),
  },

  // Action implementation.
  handler: async (ctx, args) => {
    //// Use the browser-like `fetch` API to send HTTP requests.
    //// See https://docs.convex.dev/functions/actions#calling-third-party-apis-and-using-npm-packages.
    // const response = await ctx.fetch("https://api.thirdpartyservice.com");
    // const data = await response.json();

    //// Query data by running Convex queries.
    const data = await ctx.runQuery(api.myFunctions.listNumbers, {
      count: 10,
    });
    console.log(data);

    //// Write data by running Convex mutations.
    await ctx.runMutation(api.myFunctions.addNumber, {
      value: args.first,
    });
  },
});

// Team member management functions

export const getTeamMembers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Get all team members for the authenticated user
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return teamMembers;
  },
});

export const createTeamMember = mutation({
  args: {
    initials: v.string(),
    fullName: v.string(),
    email: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, { initials, fullName, email, role }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Validate initials (2-3 characters, letters only)
    const initialsPattern = /^[A-Za-z]{2,3}$/;
    if (!initialsPattern.test(initials)) {
      throw new Error("Initials must be 2-3 letters only");
    }

    // Check if initials already exist for this user
    const existingMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_initials", (q) => q.eq("userId", userId).eq("initials", initials.toUpperCase()))
      .first();

    if (existingMember) {
      throw new Error("Team member with these initials already exists");
    }

    const now = Date.now();
    const teamMemberId = await ctx.db.insert("teamMembers", {
      userId,
      initials: initials.toUpperCase(),
      fullName,
      email,
      role,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return teamMemberId;
  },
});

export const updateTeamMember = mutation({
  args: {
    id: v.id("teamMembers"),
    initials: v.string(),
    fullName: v.string(),
    email: v.optional(v.string()),
    role: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, { id, initials, fullName, email, role, isActive }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const teamMember = await ctx.db.get(id);
    if (!teamMember || teamMember.userId !== userId) {
      throw new Error("Team member not found or access denied");
    }

    // Validate initials (2-3 characters, letters only)
    const initialsPattern = /^[A-Za-z]{2,3}$/;
    if (!initialsPattern.test(initials)) {
      throw new Error("Initials must be 2-3 letters only");
    }

    // Check if initials already exist for another team member
    if (initials.toUpperCase() !== teamMember.initials) {
      const existingMember = await ctx.db
        .query("teamMembers")
        .withIndex("by_initials", (q) => q.eq("userId", userId).eq("initials", initials.toUpperCase()))
        .first();

      if (existingMember && existingMember._id !== id) {
        throw new Error("Team member with these initials already exists");
      }
    }

    await ctx.db.patch(id, {
      initials: initials.toUpperCase(),
      fullName,
      email,
      role,
      isActive,
      updatedAt: Date.now(),
    });
  },
});

export const deleteTeamMember = mutation({
  args: { id: v.id("teamMembers") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const teamMember = await ctx.db.get(id);
    if (!teamMember || teamMember.userId !== userId) {
      throw new Error("Team member not found or access denied");
    }

    await ctx.db.delete(id);
  },
});

export const toggleTeamMemberStatus = mutation({
  args: { id: v.id("teamMembers") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const teamMember = await ctx.db.get(id);
    if (!teamMember || teamMember.userId !== userId) {
      throw new Error("Team member not found or access denied");
    }

    await ctx.db.patch(id, {
      isActive: !teamMember.isActive,
      updatedAt: Date.now(),
    });
  },
});

// Medication management functions

export const getCustomerMedications = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, { customerId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Verify customer belongs to user
    const customer = await ctx.db.get(customerId);
    if (!customer || customer.userId !== userId) {
      throw new Error("Customer not found or access denied");
    }

    // Get all medications for the customer
    const medications = await ctx.db
      .query("medications")
      .withIndex("by_customer", (q) => q.eq("customerId", customerId))
      .order("desc")
      .collect();

    return medications;
  },
});

export const createMedication = mutation({
  args: {
    customerId: v.id("customers"),
    name: v.string(),
    form: v.union(
      v.literal("tablet"),
      v.literal("capsule"),
      v.literal("liquid"),
      v.literal("injection"),
      v.literal("cream"),
      v.literal("inhaler"),
      v.literal("patch"),
      v.literal("other")
    ),
    strength: v.string(),
    frequency: v.object({
      morning: v.optional(v.number()),
      afternoon: v.optional(v.number()),
      evening: v.optional(v.number()),
      night: v.optional(v.number()),
    }),
    instructions: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Verify customer belongs to user
    const customer = await ctx.db.get(args.customerId);
    if (!customer || customer.userId !== userId) {
      throw new Error("Customer not found or access denied");
    }

    // At least one frequency value must be present and > 0
    const freq = args.frequency;
    if (![freq.morning, freq.afternoon, freq.evening, freq.night].some(val => val && val > 0)) {
      throw new Error("Enter at least one frequency value");
    }

    const now = Date.now();
    const medicationId = await ctx.db.insert("medications", {
      userId,
      customerId: args.customerId,
      name: args.name,
      form: args.form,
      strength: args.strength,
      frequency: args.frequency,
      instructions: args.instructions,
      startDate: args.startDate,
      endDate: args.endDate,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return medicationId;
  },
});

export const updateMedication = mutation({
  args: {
    id: v.id("medications"),
    name: v.string(),
    form: v.union(
      v.literal("tablet"),
      v.literal("capsule"),
      v.literal("liquid"),
      v.literal("injection"),
      v.literal("cream"),
      v.literal("inhaler"),
      v.literal("patch"),
      v.literal("other")
    ),
    strength: v.string(),
    frequency: v.object({
      morning: v.optional(v.number()),
      afternoon: v.optional(v.number()),
      evening: v.optional(v.number()),
      night: v.optional(v.number()),
    }),
    instructions: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, { id, ...updates }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const medication = await ctx.db.get(id);
    if (!medication || medication.userId !== userId) {
      throw new Error("Medication not found or access denied");
    }

    // At least one frequency value must be present and > 0
    const freq = updates.frequency;
    if (![freq.morning, freq.afternoon, freq.evening, freq.night].some(val => val && val > 0)) {
      throw new Error("Enter at least one frequency value");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const deleteMedication = mutation({
  args: { id: v.id("medications") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const medication = await ctx.db.get(id);
    if (!medication || medication.userId !== userId) {
      throw new Error("Medication not found or access denied");
    }

    await ctx.db.delete(id);
  },
});

export const toggleMedicationStatus = mutation({
  args: { id: v.id("medications") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const medication = await ctx.db.get(id);
    if (!medication || medication.userId !== userId) {
      throw new Error("Medication not found or access denied");
    }

    await ctx.db.patch(id, {
      isActive: !medication.isActive,
      updatedAt: Date.now(),
    });
  },
});

export const createPackCheck = mutation({
  args: {
    customerId: v.id("customers"),
    pharmacistInitials: v.string(),
    websterPackId: v.string(),
    packType: v.optional(v.union(v.literal("blister_packs"), v.literal("sachet_rolls"))),
    notes: v.optional(v.string()),
    checkedMedications: v.optional(v.array(v.object({
      medicationId: v.id("medications"),
      name: v.string(),
      form: v.string(),
      strength: v.string(),
      morning: v.optional(v.number()),
      afternoon: v.optional(v.number()),
      evening: v.optional(v.number()),
      night: v.optional(v.number()),
      correct: v.boolean(),
      comment: v.optional(v.string()),
    }))),
    status: v.union(v.literal("pending"), v.literal("checked")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("packChecks", {
      ...args,
      packType: args.packType || "blister_packs", // Default to blister_packs if not provided
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getPackChecks = query({
  args: {},
  handler: async (ctx) => {
    const packChecks = await ctx.db.query("packChecks").order("desc").take(50);
    
    // Get customer info for each pack check
    const packChecksWithCustomer = await Promise.all(
      packChecks.map(async (packCheck) => {
        const customer = await ctx.db.get(packCheck.customerId);
        return {
          ...packCheck,
          customer: customer ? {
            firstName: customer.firstName,
            lastName: customer.lastName,
            customerId: customer.customerId,
          } : null,
        };
      })
    );
    
    return packChecksWithCustomer;
  },
});

export const createScanOut = mutation({
  args: {
    customerId: v.id("customers"),
    pharmacistInitials: v.string(),
    websterPackId: v.string(),
    packType: v.optional(v.union(v.literal("blister_packs"), v.literal("sachet_rolls"))),
    notes: v.optional(v.string()),
    status: v.union(v.literal("scanned_out"), v.literal("delivered")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Verify customer belongs to user
    const customer = await ctx.db.get(args.customerId);
    if (!customer || customer.userId !== userId) {
      throw new Error("Customer not found or access denied");
    }

    const now = Date.now();
    const scanOutId = await ctx.db.insert("scanOuts", {
      ...args,
      packType: args.packType || "blister_packs", // Default to blister_packs if not provided
      createdAt: now,
      updatedAt: now,
    });

    return scanOutId;
  },
});

export const getScanOuts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const scanOuts = await ctx.db.query("scanOuts").order("desc").take(50);
    
    // Get customer info for each scan out and filter by user
    const scanOutsWithCustomer = [];
    
    for (const scanOut of scanOuts) {
      const customer = await ctx.db.get(scanOut.customerId);
      if (customer && customer.userId === userId) {
        scanOutsWithCustomer.push({
          ...scanOut,
          customer: {
            firstName: customer.firstName,
            lastName: customer.lastName,
            customerId: customer.customerId,
          },
        });
      }
    }
    
    return scanOutsWithCustomer;
  },
});

export const updateScanOutStatus = mutation({
  args: {
    id: v.id("scanOuts"),
    status: v.union(v.literal("scanned_out"), v.literal("delivered")),
  },
  handler: async (ctx, { id, status }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const scanOut = await ctx.db.get(id);
    if (!scanOut) {
      throw new Error("Scan out not found");
    }

    // Verify customer belongs to user
    const customer = await ctx.db.get(scanOut.customerId);
    if (!customer || customer.userId !== userId) {
      throw new Error("Access denied");
    }

    await ctx.db.patch(id, {
      status,
      updatedAt: Date.now(),
    });
  },
});

export const checkPackExists = query({
  args: {
    customerId: v.id("customers"),
    websterPackId: v.string(),
  },
  handler: async (ctx, { customerId, websterPackId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Verify customer belongs to user
    const customer = await ctx.db.get(customerId);
    if (!customer || customer.userId !== userId) {
      throw new Error("Customer not found or access denied");
    }

    // Check if pack has been checked for this customer
    const packCheck = await ctx.db
      .query("packChecks")
      .withIndex("by_customer", (q) => q.eq("customerId", customerId))
      .filter((q) => q.eq(q.field("websterPackId"), websterPackId))
      .first();

    return {
      isChecked: !!packCheck,
      packCheck: packCheck || null,
    };
  },
});

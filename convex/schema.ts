import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  numbers: defineTable({
    value: v.number(),
  }),
  customers: defineTable({
    userId: v.id("users"), // Links customer to specific user for privacy
    customerId: v.string(), // Auto-generated customer ID
    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.string(), // Store as ISO date string
    email: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    company: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("in_hospital"), v.literal("disabled")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]).index("by_customer_id", ["customerId"]), // Index for efficient user-specific queries and customer ID lookups
  teamMembers: defineTable({
    userId: v.id("users"), // Links team member to the account owner
    initials: v.string(), // Team member initials (2-3 characters)
    fullName: v.string(), // Full name of team member
    email: v.optional(v.string()), // Optional email
    role: v.optional(v.string()), // Optional role/title
    isActive: v.boolean(), // Whether the team member is active
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]).index("by_initials", ["userId", "initials"]), // Index for efficient user-specific queries and initials lookup
  medications: defineTable({
    userId: v.id("users"), // Links medication to the account owner
    customerId: v.id("customers"), // Links medication to specific customer
    name: v.string(), // Name of the medication
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
    strength: v.string(), // e.g., "500mg", "10ml"
    frequency: v.object({
      morning: v.optional(v.number()),
      afternoon: v.optional(v.number()),
      evening: v.optional(v.number()),
      night: v.optional(v.number()),
    }),
    instructions: v.optional(v.string()), // Additional instructions
    startDate: v.string(), // ISO date string
    endDate: v.optional(v.string()), // Optional end date
    isActive: v.boolean(), // Whether the medication is currently active
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_customer", ["customerId"])
    .index("by_customer_active", ["customerId", "isActive"]), // Indexes for efficient queries
  packChecks: defineTable({
    customerId: v.id("customers"),
    pharmacistInitials: v.string(),
    teamMemberId: v.optional(v.id("teamMembers")),
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
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_customer", ["customerId"]),
  scanOuts: defineTable({
    customerId: v.id("customers"),
    pharmacistInitials: v.string(),
    teamMemberId: v.optional(v.id("teamMembers")),
    websterPackId: v.string(),
    packType: v.optional(v.union(v.literal("blister_packs"), v.literal("sachet_rolls"))),
    notes: v.optional(v.string()),
    status: v.union(v.literal("scanned_out"), v.literal("delivered")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_customer", ["customerId"])
    .index("by_pack_id", ["websterPackId"])
    .index("by_status", ["status"]),
});

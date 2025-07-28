import { z } from "zod";

// Base user validator with all fields
export const baseUserValidator = z.object({
  id: z.string().min(1, "User ID is required"),
  cin: z.string().min(5, "CIN must be at least 5 characters").max(24, "CIN must not exceed 24 characters"),
  firstName: z.string().min(1, "First name is required").max(100, "First name must not exceed 100 characters"),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name must not exceed 100 characters"),
  email: z.email("Invalid email format"),
  password: z.string().min(5, "Password must be at least 5 characters").max(100, "Password must not exceed 100 characters"),
  role: z.number().int().min(1).max(6).default(6),
  balance: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  lastLogin: z.date().optional().nullable(),
  createdAt: z.date().optional().nullable(),
  updatedAt: z.date().optional().nullable(),
});

export const UserWithoutPasswordValidator = baseUserValidator.omit({
  password: true,
});

export const paginatedUsersValidator = z.object({
  users: z.array(UserWithoutPasswordValidator),
  totalCount: z.number().int().min(0),
  totalPages: z.number().int().min(1).default(1),
  currentPage: z.number().int().min(1).default(1),
  hasNextPage: z.boolean().default(false),
  hasPrevPage: z.boolean().default(false),
});

export const getUserValidatorForTransaction = z.object({
    id: baseUserValidator.shape.id,
    role: baseUserValidator.shape.role,
});

// Create user validator (omit id and timestamps)
export const createUserValidator = baseUserValidator.omit({
  id: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
});

// Update user validator (make all fields optional except id)
export const updateUserValidator = baseUserValidator.omit({
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
}).partial().required({ id: true });

// Login validator
export const loginValidator = baseUserValidator.pick({
  cin: true,
  password: true,
});

// User ID validator
export const userIdValidator = baseUserValidator.pick({ id: true });

// CIN validator
export const cinValidator = baseUserValidator.pick({ cin: true });

// Email validator
export const emailValidator = baseUserValidator.pick({ email: true }).required({ email: true });

// Password change validator
export const changePasswordValidator = baseUserValidator.pick({ id: true }).extend({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(5, "New password must be at least 5 characters").max(100, "Password must not exceed 100 characters"),
  confirmPassword: z.string().min(5, "Password confirmation is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Reset password validator
export const resetPasswordValidator = baseUserValidator.pick({ cin: true }).extend({
  newPassword: z.string().min(6, "Password must be at least 6 characters").max(100, "Password must not exceed 100 characters"),
  confirmPassword: z.string().min(1, "Password confirmation is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// User status toggle validator
export const toggleUserStatusValidator = baseUserValidator.pick({
  id: true,
  isActive: true,
});

// User search/filter validator
export const userFiltersValidator = z.object({
  search: z.string().optional(), // Search by name, CIN, or email
  role: baseUserValidator.shape.role.optional(),
  isActive: baseUserValidator.shape.isActive.optional(),
  minBalance: z.number().int().min(0).optional(),
  maxBalance: z.number().int().min(0).optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
  lastLoginAfter: z.date().optional(),
  lastLoginBefore: z.date().optional(),
});

// Pagination validator for users
export const userPaginationValidator = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.enum(['firstName', 'lastName', 'cin', 'email', 'balance', 'role', 'createdAt', 'lastLogin']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Combined validator for paginated user queries
export const paginatedUsersInputValidator = userFiltersValidator.merge(userPaginationValidator);

// User registration validator (stricter validation for public registration)
export const registerUserValidator = baseUserValidator.omit({
  id: true,
  role: true,
  balance: true,
  isActive: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  firstName: baseUserValidator.shape.firstName,
  lastName: baseUserValidator.shape.lastName,
  email: baseUserValidator.shape.email,
  password: baseUserValidator.shape.password,
  confirmPassword: baseUserValidator.shape.password,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Update last login validator
export const updateLastLoginValidator = baseUserValidator.pick({ id: true });

paginatedUsersValidator

// Export types
export type BaseUser = z.infer<typeof baseUserValidator>;
export type UserWithoutPassword = z.infer<typeof UserWithoutPasswordValidator>;
export type GetPaginatedUsers = z.infer<typeof paginatedUsersValidator>;
export type CreateUserInput = z.infer<typeof createUserValidator>;
export type UpdateUserInput = z.infer<typeof updateUserValidator>;
export type LoginInput = z.infer<typeof loginValidator>;
export type UserIdInput = z.infer<typeof userIdValidator>;
export type CinInput = z.infer<typeof cinValidator>;
export type EmailInput = z.infer<typeof emailValidator>;
export type ChangePasswordInput = z.infer<typeof changePasswordValidator>;
export type ResetPasswordInput = z.infer<typeof resetPasswordValidator>;
export type ToggleUserStatusInput = z.infer<typeof toggleUserStatusValidator>;
export type UserFiltersInput = z.infer<typeof userFiltersValidator>;
export type UserPaginationInput = z.infer<typeof userPaginationValidator>;
export type PaginatedUsersInput = z.infer<typeof paginatedUsersInputValidator>;
export type RegisterUserInput = z.infer<typeof registerUserValidator>;
export type UpdateLastLoginInput = z.infer<typeof updateLastLoginValidator>;
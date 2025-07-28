import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq, and, or, ilike, desc, asc } from "drizzle-orm";
import bcrypt from "bcrypt";
import { TRPCError } from "@trpc/server";
import { CreateUserInput, GetPaginatedUsers, UpdateUserInput, UserFiltersInput, UserPaginationInput, UserWithoutPassword } from "../validators/user-validator";

export class UserService {
  /**
   * Get user by CIN
   */
  static async getByCin(cin: string): Promise<UserWithoutPassword | null> {
    const user = await db.select().from(users).where(eq(users.cin, cin)).limit(1);
    
    if (!user.length) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user[0];
    return userWithoutPassword;
  }

  /**
   * Get user by ID
   */
  static async getById(id: string): Promise<UserWithoutPassword | null> {
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
    
    if (!user.length) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user[0];
    return userWithoutPassword;
  }

  /**
   * Get user by email
   */
  static async getByEmail(email: string): Promise<UserWithoutPassword | null> {
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (!user.length) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user[0];
    return userWithoutPassword;
  }

  /**
   * Create new user
   */
  static async create(input: CreateUserInput): Promise<UserWithoutPassword> {
    const { cin, firstName, lastName, email, role = 5, password, balance = 0 } = input;

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.cin, cin)).limit(1);
    if (existingUser.length) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'User with this CIN already exists',
      });
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingEmail.length) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists',
        });
      }
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await db.insert(users).values({
      cin,
      firstName,
      lastName,
      email,
      role,
      password: hashedPassword,
      balance,
      isActive: true,
    }).returning();

    if (!newUser.length) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create user',
      });
    }

    const { password: _, ...userWithoutPassword } = newUser[0];
    return userWithoutPassword;
  }

  /**
   * Update user
   */
  static async update(input: UpdateUserInput): Promise<UserWithoutPassword> {
    const { id, firstName, lastName, email, role, balance, isActive } = input;

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!existingUser.length) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    // Check if email already exists (if provided and different from current)
    if (email && email !== existingUser[0].email) {
      const existingEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingEmail.length) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists',
        });
      }
    }

    // Update user
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (balance !== undefined) updateData.balance = balance;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser.length) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update user',
      });
    }

    const { password: _, ...userWithoutPassword } = updatedUser[0];
    return userWithoutPassword;
  }

  /**
   * Delete user (soft delete by setting isActive to false)
   */
  static async delete(id: string): Promise<void> {
    const existingUser = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!existingUser.length) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    await db.update(users)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(users.id, id));
  }

  /**
   * Hard delete user (permanently remove from database)
   */
  static async hardDelete(id: string): Promise<void> {
    const existingUser = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!existingUser.length) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    await db.delete(users).where(eq(users.id, id));
  }

  /**
   * Get all users with pagination and filtering
   */
  static async getAll(
    filters: UserFiltersInput = {},
    pagination?: UserPaginationInput
  ): Promise<GetPaginatedUsers> {
    const { 
      search, 
      role, 
      isActive 
    } = filters;

    // Build where conditions
    const whereConditions = [];
    
    if (search) {
      whereConditions.push(
        or(
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`),
          ilike(users.cin, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      );
    }
    
    if (role !== undefined) {
      whereConditions.push(eq(users.role, role));
    }
    
    if (isActive !== undefined) {
      whereConditions.push(eq(users.isActive, isActive));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Build sort clause
    const sortColumn = users[pagination?.sortBy || 'createdAt'];
    const sortClause = pagination?.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    // Calculate offset
    const offset = (pagination?.page ? pagination.page - 1 : 0) * (pagination?.limit ? pagination.limit : 10);

    // Get total count
    const totalCountResult = await db.select({ count: users.id }).from(users).where(whereClause);
    const totalCount = totalCountResult.length;

    // Get users
    const userResults = await db.query.users.findMany({
      where: whereClause,
      orderBy: pagination?.sortBy ? sortClause : undefined,
      limit: pagination?.limit ? pagination.limit : undefined,
      offset: offset,
    });

    // Remove passwords from results
    const usersWithoutPassword = userResults.map(user => {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    // Calculate pagination info
    const totalPages = pagination?.limit ? Math.ceil(totalCount / pagination.limit) : 1;
    const hasNextPage = pagination?.page ? pagination.page < totalPages : false;
    const hasPrevPage = pagination?.page ? pagination.page > 1 : false;

    return {
      users: usersWithoutPassword,
      totalCount,
      totalPages,
      currentPage: pagination?.page || 1,
      hasNextPage,
      hasPrevPage,
    };
  }

  /**
   * Get users by role
   */
  static async getByRole(role: number): Promise<UserWithoutPassword[]> {
    const userResults = await db.select()
      .from(users)
      .where(eq(users.role, role))
      .orderBy(desc(users.createdAt));

    return userResults.map(user => {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  /**
   * Get active users count
   */
  static async getActiveUsersCount(): Promise<number> {
    const result = await db.select({ count: users.id })
      .from(users)
      .where(eq(users.isActive, true));
    
    return result.length;
  }

  /**
   * Get users statistics
   */
  static async getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    usersByRole: { role: number; count: number }[];
  }> {
    // Get total users
    const totalResult = await db.select({ count: users.id }).from(users);
    const totalUsers = totalResult.length;

    // Get active users
    const activeResult = await db.select({ count: users.id })
      .from(users)
      .where(eq(users.isActive, true));
    const activeUsers = activeResult.length;

    // Get inactive users
    const inactiveUsers = totalUsers - activeUsers;

    // Get users by role
    const roleResults = await db.select({
      role: users.role,
      count: users.id
    })
    .from(users)
    .groupBy(users.role);

    const usersByRole = roleResults.map(result => ({
      role: result.role,
      count: 1 // Since we're counting occurrences, each group represents the count
    }));

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole,
    };
  }

  /**
   * Update user balance
   */
  static async updateBalance(id: string, newBalance: number): Promise<UserWithoutPassword> {
    const existingUser = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!existingUser.length) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    const updatedUser = await db.update(users)
      .set({ 
        balance: newBalance,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();

    const { password: _, ...userWithoutPassword } = updatedUser[0];
    return userWithoutPassword;
  }
}
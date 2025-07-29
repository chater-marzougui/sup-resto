import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { TRPCError } from "@trpc/server";
import { LoginInput, RegisterUserInput, UserWithoutPassword } from "../validators/user-validator";

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

export class AuthService {
  /**
   * Login user with CIN and password
   */
  static async login(input: LoginInput): Promise<{ user: UserWithoutPassword; token: string }> {
    const { cin, password } = input;
    // Find user by CIN
    const user = await db.select().from(users).where(eq(users.cin, cin)).limit(1);

    if (!user.length) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid CIN or password',
      });
    }

    const foundUser = user[0];

    // Check if user is active
    if (!foundUser.isActive) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Account is deactivated',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, foundUser.password);
    if (!isPasswordValid) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid CIN or password',
      });
    }

    // Update last login
    await db.update(users)
      .set({ 
        lastLogin: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, foundUser.id));

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: foundUser.id, 
        cin: foundUser.cin,
        role: foundUser.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as SignOptions
    );

    // Return user without password
    const { password: _, ...userWithoutPassword } = foundUser;
    return {
      user: userWithoutPassword,
      token
    };
  }

  /**
   * Register new user
   */
  static async register(input: RegisterUserInput): Promise<{ user: UserWithoutPassword; token: string }> {
    const { cin, firstName, lastName, email, password } = input;

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
      password: hashedPassword,
      role: 5, // Default role (normalUser)
      balance: 0,
      isActive: true,
    }).returning();

    if (!newUser.length) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create user',
      });
    }

    const createdUser = newUser[0];

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: createdUser.id, 
        cin: createdUser.cin,
        role: createdUser.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as SignOptions
    );

    // Return user without password
    const { password: _, ...userWithoutPassword } = createdUser;
    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Verify JWT token and get user
   */
  static async verifyToken(token: string): Promise<UserWithoutPassword> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Get user from database
      const user = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
      
      if (!user.length) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not found',
        });
      }

      const foundUser = user[0];

      if (!foundUser.isActive) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Account is deactivated',
        });
      }

      const { password: _, ...userWithoutPassword } = foundUser;
      return userWithoutPassword;
    } catch (error) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      });
    }
  }

  /**
   * Get user by CIN
   */
  static async getUserByCin(cin: string): Promise<UserWithoutPassword | null> {
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
  static async getUserById(id: string): Promise<UserWithoutPassword | null> {
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
    
    if (!user.length) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user[0];
    return userWithoutPassword;
  }

  /**
   * Update user password
   */
  static async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    // Get user
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (!user.length) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    const foundUser = user[0];

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, foundUser.password);
    if (!isOldPasswordValid) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid current password',
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await db.update(users)
      .set({ 
        password: hashedNewPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  /**
   * Deactivate user account
   */
  static async deactivateUser(userId: string): Promise<void> {
    await db.update(users)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  /**
   * Reactivate user account
   */
  static async reactivateUser(userId: string): Promise<void> {
    await db.update(users)
      .set({ 
        isActive: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  /**
   * Reset password (for admin use)
   */
  static async resetPassword(userId: string, newPassword: string): Promise<void> {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await db.update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }
}
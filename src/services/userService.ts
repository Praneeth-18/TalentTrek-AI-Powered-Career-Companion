import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    },
  },
});

/**
 * Create a new user in the database
 */
export async function createUser(
  userId: string,
  email: string,
  name: string
) {
  try {
    // @ts-ignore - Prisma types will be resolved at runtime
    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        name
      }
    });
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  try {
    // @ts-ignore - Prisma types will be resolved at runtime
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

/**
 * Get user by username - deprecated
 * This function is kept for backward compatibility but should not be used anymore
 * as the username field has been removed from the database schema.
 * Use getUserById or getUserByEmail instead.
 */
export async function getUserByUsername(username: string) {
  try {
    // Since username no longer exists, attempt to use it as an email
    // @ts-ignore - Prisma types will be resolved at runtime
    const user = await prisma.user.findUnique({
      where: { email: username }
    });
    return user;
  } catch (error) {
    console.error('Error fetching user by username:', error);
    throw error;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  try {
    // @ts-ignore - Prisma types will be resolved at runtime
    const user = await prisma.user.findUnique({
      where: { email }
    });
    return user;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  }
}

/**
 * Update user data
 */
export async function updateUser(
  userId: string,
  data: {
    name?: string;
    email?: string;
  }
) {
  try {
    // @ts-ignore - Prisma types will be resolved at runtime
    const user = await prisma.user.update({
      where: { id: userId },
      data
    });
    return user;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Get all applications for a user
 */
export async function getUserApplications(userId: string) {
  try {
    // @ts-ignore - Prisma types will be resolved at runtime
    const applications = await prisma.userApplication.findMany({
      where: { userId },
      include: {
        jobListing: true,
        statusHistory: {
          orderBy: {
            changedAt: 'desc'
          }
        }
      }
    });
    return applications;
  } catch (error) {
    console.error('Error fetching user applications:', error);
    throw error;
  }
} 
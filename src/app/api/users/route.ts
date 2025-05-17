import { NextRequest, NextResponse } from 'next/server';
import { 
  createUser, 
  getUserById,
  getUserByEmail
} from '@/services/userService';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { userId, email, name } = data;
    
    // Validate required fields
    if (!userId || !email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if user already exists by email
    const existingUserByEmail = await getUserByEmail(email);
    if (existingUserByEmail) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }
    
    // Create user in database
    const user = await createUser(userId, email, name);
    
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const email = request.nextUrl.searchParams.get('email');
    
    if (userId) {
      const user = await getUserById(userId);
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(user);
    } else if (email) {
      const user = await getUserByEmail(email);
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(user);
    } else {
      return NextResponse.json(
        { error: 'Missing query parameter: userId or email' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
} 
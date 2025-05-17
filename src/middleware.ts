import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware for all API requests
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Log API calls in development
  if (process.env.NODE_ENV !== 'production' && path.startsWith('/api/')) {
    console.log(`[Middleware] ${request.method} ${path}`);
    
    // For POST to /api/applications that might be returning 404, handle as needed
    if (request.method === 'POST' && path === '/api/applications') {
      console.log('[Middleware] Detected POST to /api/applications');
      // Just logging for now, but allowing it to pass through
    }
    
    // Allow API calls to proceed
    return NextResponse.next();
  }
  
  // Define public paths that don't require authentication
  const isPublicPath = 
    path === '/login' || 
    path === '/register' || 
    path === '/forgot-password' || 
    path === '/reset-password' || 
    path === '/verify-email' ||
    path.startsWith('/api/');
  
  // Check for our custom Amplify cookie
  const isAuthenticated = request.cookies.has('amplifyAuthenticated');
  
  // Debug cookie info in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Path:', path);
    console.log('Is Public Path:', isPublicPath);
    console.log('Is Authenticated:', isAuthenticated);
    console.log('Cookies:', request.cookies.getAll().map(c => c.name).join(', '));
  }

  // Handle the root path based on authentication status
  if (path === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // If the path is a login-related page and the user is authenticated, redirect to dashboard
  if ((path === '/login' || path === '/register' || path === '/forgot-password' || path === '/reset-password') && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If the path is not a public path and the user is not authenticated, redirect to login
  if (!isPublicPath && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Otherwise, continue with the request
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Apply to all routes except for static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 
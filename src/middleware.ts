import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the user agent from the request headers
  const userAgent = request.headers.get('user-agent') || '';
  
  // Simple check for mobile devices
  const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
  
  // Clone the request headers so we can modify them
  const requestHeaders = new Headers(request.headers);
  
  // Inject our custom x-device-type header
  requestHeaders.set('x-device-type', isMobile ? 'mobile' : 'desktop');

  // Return the response with the new headers so our pages can read them
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Configure the middleware to run on all pages, but skip static files and APIs
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

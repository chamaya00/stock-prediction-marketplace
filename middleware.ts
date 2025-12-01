export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/dashboard/:path*', '/predictions/:path*', '/profile/:path*'],
};

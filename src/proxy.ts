import { auth } from '../auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAdminRoute = req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/trabalhadores') ||
    req.nextUrl.pathname.startsWith('/producao') ||
    req.nextUrl.pathname.startsWith('/encomendas')

  if (isAdminRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  if (req.nextUrl.pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }
})

export const config = {
  matcher: ['/dashboard/:path*', '/trabalhadores/:path*', '/producao/:path*', '/encomendas/:path*', '/login'],
}
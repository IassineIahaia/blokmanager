import { auth } from '../auth'
import { NextResponse } from 'next/server'

/** Páginas de administração (as APIs verificam a sessão em cada handler). */
const ADMIN_PREFIXES = ['/dashboard', '/encomendas', '/producao', '/produtos', '/trabalhadores', '/configuracoes']

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl
  const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (isAdminRoute && !isLoggedIn) {
    const url = new URL('/login', req.nextUrl)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/encomendas/:path*',
    '/producao/:path*',
    '/produtos/:path*',
    '/trabalhadores/:path*',
    '/configuracoes/:path*',
    '/login',
  ],
}

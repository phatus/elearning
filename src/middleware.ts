import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // 1. Proteksi Rute Guru (/guru/*)
    if (pathname.startsWith('/guru')) {
        const teacherCookie = request.cookies.get('elearning_teacher_session')
        if (!teacherCookie || !teacherCookie.value) {
            const loginUrl = new URL('/login-guru', request.url)
            loginUrl.searchParams.set('redirect', pathname)
            return NextResponse.redirect(loginUrl)
        }
    }

    // 2. Proteksi Rute Siswa (/siswa/*)
    if (pathname.startsWith('/siswa')) {
        const studentCookie = request.cookies.get('elearning_student_session')
        if (!studentCookie || !studentCookie.value) {
            const loginUrl = new URL('/login-siswa', request.url)
            loginUrl.searchParams.set('redirect', pathname)
            return NextResponse.redirect(loginUrl)
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/guru/:path*', '/siswa/:path*'],
}

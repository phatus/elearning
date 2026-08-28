import { cookies } from 'next/headers'

const STUDENT_COOKIE = 'elearning_student_session'
const TEACHER_COOKIE = 'elearning_teacher_session'

export type StudentSession = {
    id: number
    nis: string
    name: string
    class: string
    role: 'STUDENT'
}

export type TeacherSession = {
    id: number
    name: string
    nip: string | null
    role: 'TEACHER'
}

// ---------------------------------------------
// STUDENT SESSION HELPERS
// ---------------------------------------------

export async function createStudentSession(student: { id: number; nis: string; name: string; class: string }) {
    const sessionData: StudentSession = {
        id: student.id,
        nis: student.nis,
        name: student.name,
        class: student.class,
        role: 'STUDENT'
    }

    const cookieStore = await cookies()
    cookieStore.set(STUDENT_COOKIE, JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 Days
    })
}

export async function getStudentSession(): Promise<StudentSession | null> {
    try {
        const cookieStore = await cookies()
        const cookie = cookieStore.get(STUDENT_COOKIE)
        if (!cookie || !cookie.value) return null
        return JSON.parse(cookie.value) as StudentSession
    } catch {
        return null
    }
}

export async function destroyStudentSession() {
    const cookieStore = await cookies()
    cookieStore.delete(STUDENT_COOKIE)
}

// ---------------------------------------------
// TEACHER SESSION HELPERS
// ---------------------------------------------

export async function createTeacherSession(teacher: { id: number; name: string; nip: string | null }) {
    const sessionData: TeacherSession = {
        id: teacher.id,
        name: teacher.name,
        nip: teacher.nip,
        role: 'TEACHER'
    }

    const cookieStore = await cookies()
    cookieStore.set(TEACHER_COOKIE, JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 Days
    })
}

export async function getTeacherSession(): Promise<TeacherSession | null> {
    try {
        const cookieStore = await cookies()
        const cookie = cookieStore.get(TEACHER_COOKIE)
        if (!cookie || !cookie.value) return null
        return JSON.parse(cookie.value) as TeacherSession
    } catch {
        return null
    }
}

export async function destroyTeacherSession() {
    const cookieStore = await cookies()
    cookieStore.delete(TEACHER_COOKIE)
}

// ---------------------------------------------
// ADMIN SESSION HELPERS
// ---------------------------------------------

const ADMIN_COOKIE = 'elearning_admin_session'

export type AdminSession = {
    id: number
    username: string
    name: string
    role: 'ADMIN'
}

export async function createAdminSession(admin: { id: number; username: string; name: string }) {
    const sessionData: AdminSession = {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: 'ADMIN'
    }

    const cookieStore = await cookies()
    cookieStore.set(ADMIN_COOKIE, JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 Days
    })
}

export async function getAdminSession(): Promise<AdminSession | null> {
    try {
        const cookieStore = await cookies()
        const cookie = cookieStore.get(ADMIN_COOKIE)
        if (!cookie || !cookie.value) return null
        return JSON.parse(cookie.value) as AdminSession
    } catch {
        return null
    }
}

export async function destroyAdminSession() {
    const cookieStore = await cookies()
    cookieStore.delete(ADMIN_COOKIE)
}


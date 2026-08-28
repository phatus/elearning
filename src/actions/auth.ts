'use server'

import prisma from "@/lib/db"
import { createStudentSession, createTeacherSession, destroyStudentSession, destroyTeacherSession, getTeacherSession, getStudentSession, createAdminSession, destroyAdminSession, getAdminSession } from "@/lib/auth-session"
import { syncDataFromWebMadrasah } from "./elearning"
import { redirect } from "next/navigation"

export async function loginStudentAction(formData: FormData) {
    const nis = (formData.get('nis') as string || '').trim()
    const password = (formData.get('password') as string || '').trim()

    if (!nis) return { success: false, error: "NIS wajib diisi" }

    try {
        let student = await prisma.student.findUnique({ where: { nis } })

        // Auto-sync jika siswa belum ada di database local
        if (!student) {
            await syncDataFromWebMadrasah()
            student = await prisma.student.findUnique({ where: { nis } })
        }

        if (!student) {
            return { success: false, error: "Siswa dengan NIS tersebut tidak ditemukan" }
        }

        // Pengecekan password/PIN
        if (student.password) {
            if (student.password !== password) {
                return { success: false, error: "Kata sandi / PIN Siswa salah" }
            }
        } else {
            // Password pertama kali dikunci dengan password yang diinputkan siswa
            await prisma.student.update({
                where: { id: student.id },
                data: { password: password || nis }
            })
        }

        await createStudentSession(student)
        return { success: true }
    } catch (error: any) {
        console.error("Login student error:", error)
        return { success: false, error: "Terjadi kesalahan saat masuk" }
    }
}

export async function loginTeacherAction(formData: FormData) {
    const nip = (formData.get('nip') as string || '').trim()
    const password = (formData.get('password') as string || '').trim()

    if (!nip) return { success: false, error: "NIP / Nama Guru wajib diisi" }
    if (!password) return { success: false, error: "Password wajib diisi" }

    try {
        let teachers = await prisma.teacher.findMany({
            where: {
                OR: [
                    { nip: nip },
                    { name: { contains: nip, mode: 'insensitive' } }
                ]
            }
        })

        if (teachers.length === 0) {
            await syncDataFromWebMadrasah()
            teachers = await prisma.teacher.findMany({
                where: {
                    OR: [
                        { nip: nip },
                        { name: { contains: nip, mode: 'insensitive' } }
                    ]
                }
            })
        }

        if (teachers.length === 0) {
            return { success: false, error: "Akun Guru tidak ditemukan" }
        }

        const teacher = teachers[0]

        // Pengecekan password guru (password pertama kali otomatis dikunci dengan password yang dimasukkan)
        if (teacher.password) {
            if (teacher.password !== password) {
                return { success: false, error: "Kata sandi Guru salah" }
            }
        } else {
            await prisma.teacher.update({
                where: { id: teacher.id },
                data: { password: password }
            })
        }

        await createTeacherSession(teacher)
        return { success: true }
    } catch (error: any) {
        console.error("Login teacher error:", error)
        return { success: false, error: "Terjadi kesalahan saat masuk" }
    }
}

export async function updateTeacherPasswordAction(newPassword: string) {
    try {
        const session = await getTeacherSession()
        if (!session) return { success: false, error: "Unauthorized" }

        await prisma.teacher.update({
            where: { id: session.id },
            data: { password: newPassword }
        })

        return { success: true }
    } catch (error: any) {
        return { success: false, error: "Gagal memperbarui password" }
    }
}

export async function logoutStudentAction() {
    await destroyStudentSession()
    redirect('/login-siswa')
}

export async function logoutTeacherAction() {
    await destroyTeacherSession()
    redirect('/login-guru')
}

// ---------------------------------------------
// ADMIN AUTH ACTIONS
// ---------------------------------------------

export async function loginAdminAction(formData: FormData) {
    const username = (formData.get('username') as string || '').trim()
    const password = (formData.get('password') as string || '').trim()

    if (!username || !password) return { success: false, error: "Username dan Password wajib diisi" }

    try {
        let user = await prisma.user.findUnique({ where: { username } })

        // Auto-seed default admin if no User exists
        if (!user && username === 'admin') {
            const userCount = await prisma.user.count()
            if (userCount === 0) {
                user = await prisma.user.create({
                    data: {
                        name: "Administrator E-Learning",
                        username: "admin",
                        password: "admin123",
                        role: "ADMIN"
                    }
                })
            }
        }

        if (!user) {
            return { success: false, error: "Username Admin tidak ditemukan" }
        }

        if (user.password !== password) {
            return { success: false, error: "Password Admin salah" }
        }

        await createAdminSession(user)
        return { success: true }
    } catch (error: any) {
        console.error("Login admin error:", error)
        return { success: false, error: "Terjadi kesalahan saat login Admin" }
    }
}

export async function logoutAdminAction() {
    await destroyAdminSession()
    redirect('/login-admin')
}

export async function resetStudentPasswordAction(studentId: number, newPassword?: string) {
    const session = await getAdminSession()
    if (!session) return { success: false, error: "Unauthorized: Hanya Admin yang dapat mereset password." }

    try {
        await prisma.student.update({
            where: { id: studentId },
            data: { password: newPassword || null }
        })
        return { success: true, message: "Password siswa berhasil di-reset" }
    } catch (error: any) {
        return { success: false, error: "Gagal mereset password siswa" }
    }
}

export async function resetTeacherPasswordAction(teacherId: number, newPassword?: string) {
    const session = await getAdminSession()
    if (!session) return { success: false, error: "Unauthorized: Hanya Admin yang dapat mereset password." }

    try {
        await prisma.teacher.update({
            where: { id: teacherId },
            data: { password: newPassword || null }
        })
        return { success: true, message: "Password guru berhasil di-reset" }
    } catch (error: any) {
        return { success: false, error: "Gagal mereset password guru" }
    }
}

export async function updateAdminAccountAction(formData: FormData) {
    const session = await getAdminSession()
    if (!session) return { success: false, error: "Unauthorized: Silakan login kembali." }

    const name = (formData.get('name') as string || '').trim()
    const username = (formData.get('username') as string || '').trim()
    const currentPassword = (formData.get('currentPassword') as string || '').trim()
    const newPassword = (formData.get('newPassword') as string || '').trim()

    if (!name || !username) {
        return { success: false, error: "Nama dan Username wajib diisi" }
    }

    try {
        const adminUser = await prisma.user.findUnique({ where: { id: session.id } })
        if (!adminUser) {
            return { success: false, error: "Akun Admin tidak ditemukan" }
        }

        if (currentPassword || newPassword) {
            if (adminUser.password !== currentPassword) {
                return { success: false, error: "Password lama salah" }
            }
            if (!newPassword || newPassword.length < 4) {
                return { success: false, error: "Password baru minimal 4 karakter" }
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.id },
            data: {
                name,
                username,
                ...(newPassword ? { password: newPassword } : {})
            }
        })

        await createAdminSession(updatedUser)
        return { success: true, message: "Konfigurasi akun Admin berhasil diperbarui." }
    } catch (error: any) {
        if (error?.code === 'P2002') {
            return { success: false, error: "Username tersebut sudah digunakan oleh akun lain." }
        }
        return { success: false, error: "Gagal memperbarui konfigurasi akun Admin." }
    }
}



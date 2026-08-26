'use server'

import prisma from "@/lib/db"
import { createStudentSession, createTeacherSession, destroyStudentSession, destroyTeacherSession, getTeacherSession, getStudentSession } from "@/lib/auth-session"
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

'use server'

import fs from "fs"
import path from "path"
import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"
// @ts-ignore
import { Client } from "pg"

// ---------------------------------------------
// SINKRONISASI DATA DARI WEBMADRASAH DATABASE -> ELEARNING DATABASE
// ---------------------------------------------

export async function syncDataFromWebMadrasah() {
    const webmadrasahUrl = process.env.WEBMADRASAH_DATABASE_URL
    if (!webmadrasahUrl) {
        return { success: false, error: "WEBMADRASAH_DATABASE_URL belum dikonfigurasi" }
    }

    const client = new Client({ connectionString: webmadrasahUrl })

    try {
        await client.connect()

        // 1. Sinkron Data Tahun Ajaran
        const yearsRes = await client.query('SELECT * FROM "AcademicYear"')
        for (const yr of yearsRes.rows) {
            await prisma.academicYear.upsert({
                where: { id: yr.id },
                create: {
                    id: yr.id,
                    name: yr.name,
                    isActive: yr.isActive,
                    startDate: yr.startDate,
                    endDate: yr.endDate
                },
                update: {
                    name: yr.name,
                    isActive: yr.isActive
                }
            })
        }

        // 2. Sinkron Data Guru
        const teachersRes = await client.query('SELECT * FROM "Teacher"')
        for (const t of teachersRes.rows) {
            await prisma.teacher.upsert({
                where: { id: t.id },
                create: {
                    id: t.id,
                    nip: t.nip,
                    name: t.name,
                    subject: t.subject,
                    position: t.position || "GURU"
                },
                update: {
                    name: t.name,
                    nip: t.nip,
                    subject: t.subject
                }
            })
        }

        // 3. Sinkron Data Siswa
        const studentsRes = await client.query('SELECT * FROM "Student" WHERE status = \'AKTIF\'')
        for (const s of studentsRes.rows) {
            await prisma.student.upsert({
                where: { nis: s.nis },
                create: {
                    id: s.id,
                    nis: s.nis,
                    nisn: s.nisn || null,
                    name: s.name,
                    class: s.class,
                    status: s.status
                },
                update: {
                    name: s.name,
                    class: s.class,
                    status: s.status,
                    nisn: s.nisn || null
                }
            })
        }

        await client.end()

        try {
            revalidatePath('/guru')
            revalidatePath('/siswa')
        } catch (e) {
            // ignore if called during render
        }
        return { 
            success: true, 
            studentsCount: studentsRes.rows.length, 
            teachersCount: teachersRes.rows.length 
        }
    } catch (error: any) {
        console.error("Error syncing from WebMadrasah:", error)
        try { await client.end() } catch (e) {}
        return { success: false, error: "Gagal menyinkronkan data: " + error.message }
    }
}

// ---------------------------------------------
// HELPER DATA FETCHERS
// ---------------------------------------------

export async function getTeachers() {
    try {
        return await prisma.teacher.findMany({
            orderBy: { name: 'asc' }
        })
    } catch (error) {
        console.error("Error fetching teachers:", error)
        return []
    }
}

export async function getAcademicYears() {
    try {
        return await prisma.academicYear.findMany({
            orderBy: { name: 'desc' }
        })
    } catch (error) {
        console.error("Error fetching academic years:", error)
        return []
    }
}

// ---------------------------------------------
// ELEARNING COURSES
// ---------------------------------------------

const CourseSchema = z.object({
    title: z.string().min(1, "Judul wajib diisi"),
    description: z.string().optional(),
    targetClass: z.string().optional(),
    teacherId: z.number().int("Guru wajib dipilih"),
    academicYearId: z.number().int("Tahun ajaran wajib dipilih"),
    isActive: z.boolean().default(true),
})

export async function getElearningCourses() {
    try {
        const courses = await prisma.elearningCourse.findMany({
            include: {
                teacher: true,
                academicYear: true,
                _count: {
                    select: { modules: true, assignments: true, enrollments: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
        return courses
    } catch (error) {
        console.error("Error fetching courses:", error)
        return []
    }
}

export async function getElearningCourse(id: number) {
    try {
        return await prisma.elearningCourse.findUnique({
            where: { id },
            include: {
                teacher: true,
                academicYear: true,
                modules: {
                    orderBy: { order: 'asc' }
                },
                assignments: {
                    include: {
                        submissions: {
                            include: { student: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                enrollments: {
                    include: { student: true }
                }
            }
        })
    } catch (error) {
        console.error("Error fetching course:", error)
        return null
    }
}

export async function createElearningCourse(formData: FormData) {
    try {
        const title = formData.get('title') as string
        const description = formData.get('description') as string
        const teacherId = parseInt(formData.get('teacherId') as string)
        const academicYearId = parseInt(formData.get('academicYearId') as string)
        const isActive = formData.get('isActive') === 'true'
        
        // Target classes can be passed as multiple form fields (getAll) or single comma-separated string
        let targetClasses = formData.getAll('targetClasses').map(c => c.toString().trim()).filter(Boolean)
        if (targetClasses.length === 0) {
            const singleClass = formData.get('targetClass') as string
            if (singleClass) {
                targetClasses = singleClass.split(',').map(c => c.trim()).filter(Boolean)
            }
        }

        if (targetClasses.length > 1) {
            // Batch create courses for each selected class
            for (const cls of targetClasses) {
                // Append class name if title does not already end with it
                const courseTitle = title.includes(cls) ? title : `${title} (${cls})`
                const course = await prisma.elearningCourse.create({
                    data: {
                        title: courseTitle,
                        description: description || null,
                        targetClass: cls,
                        teacherId,
                        academicYearId,
                        isActive
                    }
                })
                await syncStudentsFromClass(course.id, cls)
            }
        } else {
            const singleTargetClass = targetClasses[0] || undefined
            const course = await prisma.elearningCourse.create({
                data: {
                    title,
                    description: description || null,
                    targetClass: singleTargetClass,
                    teacherId,
                    academicYearId,
                    isActive
                }
            })

            if (singleTargetClass) {
                await syncStudentsFromClass(course.id, singleTargetClass)
            }
        }

        revalidatePath('/guru')
        return { success: true }
    } catch (error) {
        console.error("Error creating course:", error)
        return { success: false, error: "Gagal membuat mata pelajaran" }
    }
}

export async function updateElearningCourse(id: number, formData: FormData) {
    try {
        const title = formData.get('title') as string
        const description = formData.get('description') as string
        const targetClass = formData.get('targetClass') as string || undefined
        const teacherId = parseInt(formData.get('teacherId') as string)
        const academicYearId = parseInt(formData.get('academicYearId') as string)
        const isActive = formData.get('isActive') === 'true'

        await prisma.elearningCourse.update({
            where: { id },
            data: {
                title,
                description: description || null,
                targetClass,
                teacherId,
                academicYearId,
                isActive
            }
        })

        if (targetClass) {
            await syncStudentsFromClass(id, targetClass)
        }

        revalidatePath('/guru')
        revalidatePath(`/guru/courses/${id}`)
        return { success: true }
    } catch (error) {
        console.error("Error updating course:", error)
        return { success: false, error: "Gagal memperbarui mata pelajaran" }
    }
}

export async function deleteElearningCourse(id: number) {
    try {
        await prisma.elearningCourse.delete({
            where: { id }
        })

        revalidatePath('/guru')
        return { success: true }
    } catch (error) {
        console.error("Error deleting course:", error)
        return { success: false, error: "Gagal menghapus mata pelajaran" }
    }
}

// ---------------------------------------------
// ELEARNING MODULES
// ---------------------------------------------

export async function createElearningModule(primaryCourseId: number, formData: FormData) {
    try {
        const title = formData.get('title') as string
        const content = formData.get('content') as string || null
        const videoUrl = formData.get('videoUrl') as string || null
        let documentUrl = formData.get('documentUrl') as string || null
        const imageUrl = formData.get('imageUrl') as string || null

        // Handle uploaded document file if present
        const documentFile = formData.get('documentFile') as File | null
        if (documentFile && documentFile.size > 0 && typeof documentFile.arrayBuffer === 'function') {
            const bytes = await documentFile.arrayBuffer()
            const buffer = Buffer.from(bytes)
            const uploadDir = path.join(process.cwd(), 'public', 'uploads')
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true })
            }
            const safeName = `${Date.now()}_${documentFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
            const filePath = path.join(uploadDir, safeName)
            await fs.promises.writeFile(filePath, buffer)
            documentUrl = `/uploads/${safeName}`
        }

        // Support publishing to multiple courses
        let targetCourseIds = formData.getAll('targetCourseIds').map(id => parseInt(id.toString())).filter(id => !isNaN(id))
        if (targetCourseIds.length === 0) {
            targetCourseIds = [primaryCourseId]
        }

        for (const courseId of targetCourseIds) {
            const order = await prisma.elearningModule.count({ where: { courseId } })

            await prisma.elearningModule.create({
                data: {
                    courseId,
                    title,
                    content,
                    videoUrl,
                    documentUrl,
                    imageUrl,
                    order
                }
            })
            revalidatePath(`/guru/courses/${courseId}`)
        }

        revalidatePath('/guru')
        return { success: true }
    } catch (error) {
        console.error("Error creating module:", error)
        return { success: false, error: "Gagal membuat modul" }
    }
}

export async function updateElearningModule(moduleId: number, courseId: number, formData: FormData) {
    try {
        const title = formData.get('title') as string
        const content = formData.get('content') as string || null
        const videoUrl = formData.get('videoUrl') as string || null
        let documentUrl = formData.get('documentUrl') as string || null
        const imageUrl = formData.get('imageUrl') as string || null

        const documentFile = formData.get('documentFile') as File | null
        if (documentFile && documentFile.size > 0 && typeof documentFile.arrayBuffer === 'function') {
            const bytes = await documentFile.arrayBuffer()
            const buffer = Buffer.from(bytes)
            const uploadDir = path.join(process.cwd(), 'public', 'uploads')
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true })
            }
            const safeName = `${Date.now()}_${documentFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
            const filePath = path.join(uploadDir, safeName)
            await fs.promises.writeFile(filePath, buffer)
            documentUrl = `/uploads/${safeName}`
        }

        const dataToUpdate: any = {
            title,
            content,
            videoUrl,
            imageUrl
        }
        if (documentUrl !== null && documentUrl !== undefined && documentUrl !== '') {
            dataToUpdate.documentUrl = documentUrl
        }

        await prisma.elearningModule.update({
            where: { id: moduleId },
            data: dataToUpdate
        })

        revalidatePath(`/guru/courses/${courseId}`)
        revalidatePath('/guru')
        return { success: true }
    } catch (error: any) {
        console.error("Error updating module:", error)
        return { success: false, error: error?.message || "Gagal memperbarui modul" }
    }
}

export async function deleteElearningModule(moduleId: number, courseId: number) {
    try {
        await prisma.elearningModule.delete({
            where: { id: moduleId }
        })
        revalidatePath(`/guru/courses/${courseId}`)
        revalidatePath('/guru')
        return { success: true }
    } catch (error: any) {
        console.error("Error deleting module:", error)
        return { success: false, error: error?.message || "Gagal menghapus modul" }
    }
}

// ---------------------------------------------
// ELEARNING ASSIGNMENTS (TUGAS/UJIAN)
// ---------------------------------------------

export async function createElearningAssignment(primaryCourseId: number, formData: FormData) {
    try {
        const dueDateStr = formData.get('dueDate') as string
        const dueDate = dueDateStr ? new Date(dueDateStr) : null
        const title = formData.get('title') as string
        const description = formData.get('description') as string || null
        const kktp = formData.get('kktp') as string || null
        const rubric = formData.get('rubric') as string || null
        const type = formData.get('type') as string || 'TUGAS'
        const maxScoreStr = formData.get('maxScore') as string
        const maxScore = maxScoreStr ? parseFloat(maxScoreStr) : 100
        let questionFileUrl = formData.get('questionFileUrl') as string || null

        // Handle uploaded question/practical guide file
        const questionFile = formData.get('questionFile') as File | null
        if (questionFile && questionFile.size > 0 && typeof questionFile.arrayBuffer === 'function') {
            const bytes = await questionFile.arrayBuffer()
            const buffer = Buffer.from(bytes)
            const uploadDir = path.join(process.cwd(), 'public', 'uploads')
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true })
            }
            const safeName = `${Date.now()}_soal_${questionFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
            const filePath = path.join(uploadDir, safeName)
            await fs.promises.writeFile(filePath, buffer)
            questionFileUrl = `/uploads/${safeName}`
        }

        // Support publishing to multiple courses
        let targetCourseIds = formData.getAll('targetCourseIds').map(id => parseInt(id.toString())).filter(id => !isNaN(id))
        if (targetCourseIds.length === 0) {
            targetCourseIds = [primaryCourseId]
        }

        for (const courseId of targetCourseIds) {
            const dataToCreate: any = {
                courseId,
                title,
                type,
                maxScore
            }
            if (description) dataToCreate.description = description
            if (kktp) dataToCreate.kktp = kktp
            if (rubric) dataToCreate.rubric = rubric
            if (dueDate) dataToCreate.dueDate = dueDate
            if (questionFileUrl) dataToCreate.questionFileUrl = questionFileUrl

            await prisma.elearningAssignment.create({
                data: dataToCreate
            })
            revalidatePath(`/guru/courses/${courseId}`)
        }

        revalidatePath('/guru')
        return { success: true }
    } catch (error: any) {
        console.error("Error creating assignment:", error)
        return { success: false, error: `Gagal membuat penugasan: ${error?.message || String(error)}` }
    }
}

export async function updateElearningAssignment(assignmentId: number, courseId: number, formData: FormData) {
    try {
        const dueDateStr = formData.get('dueDate') as string
        const dueDate = dueDateStr ? new Date(dueDateStr) : null
        const title = formData.get('title') as string
        const description = formData.get('description') as string || null
        const kktp = formData.get('kktp') as string || null
        const rubric = formData.get('rubric') as string || null
        const type = formData.get('type') as string || 'TUGAS'
        const maxScoreStr = formData.get('maxScore') as string
        const maxScore = maxScoreStr ? parseFloat(maxScoreStr) : 100
        let questionFileUrl = formData.get('questionFileUrl') as string || null

        const questionFile = formData.get('questionFile') as File | null
        if (questionFile && questionFile.size > 0 && typeof questionFile.arrayBuffer === 'function') {
            const bytes = await questionFile.arrayBuffer()
            const buffer = Buffer.from(bytes)
            const uploadDir = path.join(process.cwd(), 'public', 'uploads')
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true })
            }
            const safeName = `${Date.now()}_soal_${questionFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
            const filePath = path.join(uploadDir, safeName)
            await fs.promises.writeFile(filePath, buffer)
            questionFileUrl = `/uploads/${safeName}`
        }

        const dataToUpdate: any = {
            title,
            type,
            maxScore,
            description,
            kktp,
            rubric,
            dueDate
        }
        if (questionFileUrl !== null && questionFileUrl !== undefined && questionFileUrl !== '') {
            dataToUpdate.questionFileUrl = questionFileUrl
        }

        await prisma.elearningAssignment.update({
            where: { id: assignmentId },
            data: dataToUpdate
        })

        revalidatePath(`/guru/courses/${courseId}`)
        revalidatePath('/guru')
        return { success: true }
    } catch (error: any) {
        console.error("Error updating assignment:", error)
        return { success: false, error: `Gagal memperbarui penugasan: ${error?.message || String(error)}` }
    }
}

export async function deleteElearningAssignment(assignmentId: number, courseId: number) {
    try {
        await prisma.elearningAssignment.delete({
            where: { id: assignmentId }
        })
        revalidatePath(`/guru/courses/${courseId}`)
        revalidatePath('/guru')
        return { success: true }
    } catch (error: any) {
        console.error("Error deleting assignment:", error)
        return { success: false, error: `Gagal menghapus penugasan: ${error?.message || String(error)}` }
    }
}

// ---------------------------------------------
// STUDENT SYNC / ENROLLMENT FROM WEBMADRASAH
// ---------------------------------------------

export async function getDistinctStudentClasses() {
    try {
        const students = await prisma.student.findMany({
            where: { status: 'AKTIF' },
            select: { class: true },
            distinct: ['class'],
            orderBy: { class: 'asc' }
        })
        return students.map((s: { class: string }) => s.class)
    } catch (error) {
        console.error("Error fetching classes:", error)
        return []
    }
}

export async function syncStudentsFromClass(courseId: number, targetClass: string) {
    try {
        const students = await prisma.student.findMany({
            where: { class: targetClass, status: 'AKTIF' },
            select: { id: true }
        })

        for (const student of students) {
            await prisma.elearningEnrollment.upsert({
                where: {
                    courseId_studentId: {
                        courseId,
                        studentId: student.id
                    }
                },
                create: {
                    courseId,
                    studentId: student.id
                },
                update: {}
            })
        }

        revalidatePath(`/guru/courses/${courseId}`)
        return { success: true, count: students.length }
    } catch (error) {
        console.error("Error syncing students from class:", error)
        return { success: false, error: "Gagal menyinkronkan siswa" }
    }
}

// ---------------------------------------------
// STUDENT PORTAL & GRADING ACTIONS
// ---------------------------------------------

export async function getStudentCoursesByNis(nis: string) {
    try {
        let student = await prisma.student.findUnique({
            where: { nis }
        })

        // Auto-sync jika siswa belum ada di database local elearning
        if (!student) {
            await syncDataFromWebMadrasah()
            student = await prisma.student.findUnique({
                where: { nis }
            })
        }

        if (!student) return { success: false, error: "NIS Siswa tidak ditemukan" }

        const enrollments = await prisma.elearningEnrollment.findMany({
            where: { studentId: student.id },
            include: {
                course: {
                    include: {
                        teacher: true,
                        academicYear: true,
                        modules: true,
                        assignments: {
                            include: {
                                submissions: {
                                    where: { studentId: student.id }
                                }
                            }
                        }
                    }
                }
            }
        })

        const courses = enrollments.map((e: { course: any }) => e.course)
        return { success: true, student, courses }
    } catch (error) {
        console.error("Error fetching student courses:", error)
        return { success: false, error: "Gagal memuat data kelas siswa" }
    }
}

export async function submitAssignment(
    assignmentId: number,
    studentId: number,
    content: string,
    fileUrl?: string,
    linkUrl?: string,
    submissionFile?: File | null
) {
    try {
        let finalFileUrl = fileUrl || null

        // Handle uploaded student submission file (ZIP/PDF/Doc/Image)
        if (submissionFile && submissionFile.size > 0 && typeof submissionFile.arrayBuffer === 'function') {
            const bytes = await submissionFile.arrayBuffer()
            const buffer = Buffer.from(bytes)
            const uploadDir = path.join(process.cwd(), 'public', 'uploads')
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true })
            }
            const safeName = `${Date.now()}_jawaban_${submissionFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
            const filePath = path.join(uploadDir, safeName)
            await fs.promises.writeFile(filePath, buffer)
            finalFileUrl = `/uploads/${safeName}`
        }

        await prisma.elearningSubmission.upsert({
            where: {
                assignmentId_studentId: {
                    assignmentId,
                    studentId
                }
            },
            create: {
                assignmentId,
                studentId,
                content: content || null,
                fileUrl: finalFileUrl,
                linkUrl: linkUrl || null
            },
            update: {
                content: content || null,
                fileUrl: finalFileUrl,
                linkUrl: linkUrl || null
            }
        })

        revalidatePath('/siswa')
        return { success: true }
    } catch (error) {
        console.error("Error submitting assignment:", error)
        return { success: false, error: "Gagal mengumpulkan tugas" }
    }
}

export async function gradeSubmission(
    submissionId: number,
    score: number,
    feedback?: string
) {
    try {
        const submission = await prisma.elearningSubmission.update({
            where: { id: submissionId },
            data: {
                score,
                feedback: feedback || null
            },
            include: {
                assignment: true
            }
        })

        revalidatePath('/guru')
        revalidatePath(`/guru/courses/${submission.assignment.courseId}`)
        return { success: true }
    } catch (error) {
        console.error("Error grading submission:", error)
        return { success: false, error: "Gagal menyimpan nilai" }
    }
}

// ---------------------------------------------
// SERVER-SIDE PAGINATED FETCHERS
// ---------------------------------------------

export async function getPaginatedStudentsAction(params: {
    page?: number
    limit?: number
    query?: string
    className?: string
}) {
    const page = Math.max(Number(params.page) || 1, 1)
    const limit = Math.max(Number(params.limit) || 10, 1)
    const skip = (page - 1) * limit
    const query = params.query?.trim() || ''
    const className = params.className?.trim() || ''

    const where: any = {}

    if (className) {
        where.class = className
    }

    if (query) {
        where.OR = [
            { name: { contains: query, mode: 'insensitive' } },
            { nis: { contains: query, mode: 'insensitive' } },
            { class: { contains: query, mode: 'insensitive' } },
        ]
    }

    try {
        const [totalCount, students] = await Promise.all([
            prisma.student.count({ where }),
            prisma.student.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ class: 'asc' }, { name: 'asc' }],
                select: {
                    id: true,
                    nis: true,
                    name: true,
                    class: true,
                    status: true,
                    password: true,
                },
            }),
        ])

        const totalPages = Math.ceil(totalCount / limit)

        return {
            students: students.map((s) => ({
                id: s.id,
                nis: s.nis,
                name: s.name,
                class: s.class,
                status: s.status,
                hasPassword: Boolean(s.password),
            })),
            totalCount,
            totalPages,
            currentPage: page,
            limit,
        }
    } catch (error) {
        console.error("Error fetching paginated students:", error)
        return { students: [], totalCount: 0, totalPages: 1, currentPage: 1, limit }
    }
}

export async function getPaginatedTeachersAction(params: {
    page?: number
    limit?: number
    query?: string
}) {
    const page = Math.max(Number(params.page) || 1, 1)
    const limit = Math.max(Number(params.limit) || 10, 1)
    const skip = (page - 1) * limit
    const query = params.query?.trim() || ''

    const where: any = {}

    if (query) {
        where.OR = [
            { name: { contains: query, mode: 'insensitive' } },
            { nip: { contains: query, mode: 'insensitive' } },
            { subject: { contains: query, mode: 'insensitive' } },
        ]
    }

    try {
        const [totalCount, teachers] = await Promise.all([
            prisma.teacher.count({ where }),
            prisma.teacher.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
                select: {
                    id: true,
                    name: true,
                    nip: true,
                    subject: true,
                    password: true,
                },
            }),
        ])

        const totalPages = Math.ceil(totalCount / limit)

        return {
            teachers: teachers.map((t) => ({
                id: t.id,
                name: t.name,
                nip: t.nip,
                subject: t.subject,
                hasPassword: Boolean(t.password),
            })),
            totalCount,
            totalPages,
            currentPage: page,
            limit,
        }
    } catch (error) {
        console.error("Error fetching paginated teachers:", error)
        return { teachers: [], totalCount: 0, totalPages: 1, currentPage: 1, limit }
    }
}

export async function getPaginatedCoursesAction(params: {
    page?: number
    limit?: number
    query?: string
}) {
    const page = Math.max(Number(params.page) || 1, 1)
    const limit = Math.max(Number(params.limit) || 10, 1)
    const skip = (page - 1) * limit
    const query = params.query?.trim() || ''

    const where: any = {}

    if (query) {
        where.OR = [
            { title: { contains: query, mode: 'insensitive' } },
            { teacher: { name: { contains: query, mode: 'insensitive' } } },
            { targetClass: { contains: query, mode: 'insensitive' } },
        ]
    }

    try {
        const [totalCount, courses] = await Promise.all([
            prisma.elearningCourse.count({ where }),
            prisma.elearningCourse.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    teacher: { select: { name: true } },
                    _count: { select: { modules: true, assignments: true } },
                },
            }),
        ])

        const totalPages = Math.ceil(totalCount / limit)

        return {
            courses: courses.map((c) => ({
                id: c.id,
                title: c.title,
                targetClass: c.targetClass,
                teacherName: c.teacher?.name || 'Guru',
                moduleCount: c._count.modules,
                assignmentCount: c._count.assignments,
            })),
            totalCount,
            totalPages,
            currentPage: page,
            limit,
        }
    } catch (error) {
        console.error("Error fetching paginated courses:", error)
        return { courses: [], totalCount: 0, totalPages: 1, currentPage: 1, limit }
    }
}


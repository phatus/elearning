import { getAdminSession } from "@/lib/auth-session"
import { redirect } from "next/navigation"
import prisma from "@/lib/db"
import AdminClient from "./AdminClient"

export const metadata = {
  title: "Dashboard Admin | E-Learning MTsN 1 Pacitan",
  description: "Dashboard pengelola E-Learning MTsN 1 Pacitan."
}

export default async function AdminDashboardPage() {
  const session = await getAdminSession()
  if (!session) {
    redirect("/login-admin")
  }

  const [totalCourses, totalStudents, totalTeachers, totalSubmissions] = await Promise.all([
    prisma.elearningCourse.count(),
    prisma.student.count({ where: { status: 'AKTIF' } }),
    prisma.teacher.count(),
    prisma.elearningSubmission.count(),
  ])

  const students = await prisma.student.findMany({
    orderBy: [{ class: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      nis: true,
      name: true,
      class: true,
      status: true,
      password: true,
    },
  })

  const teachers = await prisma.teacher.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      nip: true,
      subject: true,
      password: true,
    },
  })

  const courses = await prisma.elearningCourse.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      teacher: { select: { name: true } },
      _count: { select: { modules: true, assignments: true } },
    },
  })

  const studentData = students.map((s) => ({
    id: s.id,
    nis: s.nis,
    name: s.name,
    class: s.class,
    status: s.status,
    hasPassword: Boolean(s.password),
  }))

  const teacherData = teachers.map((t) => ({
    id: t.id,
    name: t.name,
    nip: t.nip,
    subject: t.subject,
    hasPassword: Boolean(t.password),
  }))

  const courseData = courses.map((c) => ({
    id: c.id,
    title: c.title,
    targetClass: c.targetClass,
    teacherName: c.teacher?.name || 'Guru',
    moduleCount: c._count.modules,
    assignmentCount: c._count.assignments,
  }))

  return (
    <AdminClient
      admin={{ name: session.name, username: session.username }}
      stats={{
        totalCourses,
        totalStudents,
        totalTeachers,
        totalSubmissions,
      }}
      students={studentData}
      teachers={teacherData}
      courses={courseData}
    />
  )
}

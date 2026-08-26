import { redirect } from "next/navigation"
import { getTeacherSession } from "@/lib/auth-session"
import { getElearningCourses, getTeachers, getAcademicYears, getDistinctStudentClasses } from "@/actions/elearning"
import CoursesClient from "./CoursesClient"

export const metadata = {
  title: 'Portal Kelola Guru & RDM | E-Learning MTsN 1 Pacitan',
}

export default async function GuruPage() {
  const session = await getTeacherSession()

  if (!session) {
    redirect('/login-guru')
  }

  const [courses, teachers, academicYears, availableClasses] = await Promise.all([
    getElearningCourses(),
    getTeachers(),
    getAcademicYears(),
    getDistinctStudentClasses()
  ])

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto">
      <CoursesClient 
        session={session}
        courses={courses as any}
        teachers={teachers as any}
        academicYears={academicYears as any}
        availableClasses={availableClasses}
      />
    </div>
  )
}

import { getStudentSession } from "@/lib/auth-session"
import { getStudentCoursesByNis } from "@/actions/elearning"
import StudentPortalClient from './StudentPortalClient'
import { redirect } from "next/navigation"

export const metadata = {
  title: 'Portal Siswa | E-Learning MTsN 1 Pacitan',
}

export default async function SiswaPage() {
  const session = await getStudentSession()

  if (!session) {
    redirect('/login-siswa')
  }

  const res = await getStudentCoursesByNis(session.nis)

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto">
      <StudentPortalClient 
        studentData={res.student || { id: session.id, nis: session.nis, name: session.name, class: session.class }}
        initialCourses={res.courses || []}
      />
    </div>
  )
}

import { notFound, redirect } from "next/navigation"
import { getTeacherSession } from "@/lib/auth-session"
import { getElearningCourse, getElearningCourses } from "@/actions/elearning"
import CourseDetailClient from "./CourseDetailClient"

export async function generateMetadata({ params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = await params;
    const course = await getElearningCourse(parseInt(courseId))
    return {
        title: course ? `${course.title} | Guru E-Learning` : "Detail Mata Pelajaran | Guru",
    }
}

export default async function CourseDetailPage({
    params,
}: {
    params: Promise<{ courseId: string }>
}) {
    const session = await getTeacherSession()

    if (!session) {
        redirect('/login-guru')
    }

    const { courseId } = await params
    const [course, allCourses] = await Promise.all([
        getElearningCourse(parseInt(courseId)),
        getElearningCourses()
    ])

    if (!course) {
        notFound()
    }

    return (
        <div className="py-8 px-4 max-w-7xl mx-auto">
            <CourseDetailClient course={course as any} allCourses={allCourses as any[]} />
        </div>
    )
}

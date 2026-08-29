'use client'

import { useState } from "react"
import {
    BookOpen, ClipboardList, Users, ArrowLeft, Plus, Download, Edit, Trash2,
    Video, FileText, Image as ImageIcon, Eye, ExternalLink, Award, CheckCircle2,
    Clock, Calendar, FileCode, FolderArchive, Globe, ListChecks, Check, X
} from "lucide-react"
import Link from "next/link"
import * as XLSX from 'xlsx'
import { createElearningModule, createElearningAssignment, gradeSubmission } from "@/actions/elearning"

type Course = {
    id: number
    title: string
    description: string | null
    isActive: boolean
    teacher: { name: string }
    academicYear: { name: string }
    modules: any[]
    assignments: any[]
    enrollments: { student: any }[]
}

export default function CourseDetailClient({ course, allCourses = [] }: { course: Course; allCourses?: any[] }) {
    const [activeTab, setActiveTab] = useState<'modules' | 'assignments' | 'students'>('modules')
    const [isModuleFormOpen, setIsModuleFormOpen] = useState(false)
    const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [activePdfModuleId, setActivePdfModuleId] = useState<number | null>(null)
    const [activeQuestionPdfId, setActiveQuestionPdfId] = useState<number | null>(null)

    // Grading Modal State
    const [gradingAssignment, setGradingAssignment] = useState<any | null>(null)
    const [scores, setScores] = useState<{ [studentId: number]: string }>({})
    const [feedbacks, setFeedbacks] = useState<{ [studentId: number]: string }>({})
    const [gradingLoading, setGradingLoading] = useState<number | null>(null)
    const [gradeSuccessId, setGradeSuccessId] = useState<number | null>(null)

    // Filter courses belonging to the same teacher or fallback to all courses
    const targetCourseList = allCourses.length > 0
        ? allCourses.filter(c => c.teacherId === (course as any).teacherId || c.teacher?.name === course.teacher?.name)
        : [course]
    
    // Multi-course target selection states
    const [selectedModuleCourseIds, setSelectedModuleCourseIds] = useState<number[]>([course.id])
    const [selectedAssignmentCourseIds, setSelectedAssignmentCourseIds] = useState<number[]>([course.id])

    const toggleModuleCourse = (cId: number) => {
        setSelectedModuleCourseIds(prev =>
            prev.includes(cId) ? (prev.length > 1 ? prev.filter(id => id !== cId) : prev) : [...prev, cId]
        )
    }

    const toggleAssignmentCourse = (cId: number) => {
        setSelectedAssignmentCourseIds(prev =>
            prev.includes(cId) ? (prev.length > 1 ? prev.filter(id => id !== cId) : prev) : [...prev, cId]
        )
    }

    // Open Grading Modal and initialize scores & feedbacks
    const handleOpenGrading = (assignment: any) => {
        setGradingAssignment(assignment)
        const initialScores: { [studentId: number]: string } = {}
        const initialFeedbacks: { [studentId: number]: string } = {}

        assignment.submissions?.forEach((sub: any) => {
            if (sub.score !== null && sub.score !== undefined) {
                initialScores[sub.studentId] = sub.score.toString()
            }
            if (sub.feedback) {
                initialFeedbacks[sub.studentId] = sub.feedback
            }
        })

        setScores(initialScores)
        setFeedbacks(initialFeedbacks)
    }

    // Save student grade action
    const handleSaveGrade = async (submissionId: number, studentId: number) => {
        const scoreVal = parseFloat(scores[studentId] || '0')
        if (isNaN(scoreVal)) {
            alert("Masukkan angka nilai yang valid (0 - 100)")
            return
        }

        setGradingLoading(submissionId)
        const res = await gradeSubmission(submissionId, scoreVal, feedbacks[studentId])
        if (res.success) {
            setGradeSuccessId(submissionId)
            setTimeout(() => setGradeSuccessId(null), 2000)
        } else {
            alert(res.error || "Gagal menyimpan nilai")
        }
        setGradingLoading(null)
    }

    // RDM Excel Export Function (Supports Knowledge & Practical Scores)
    const handleExportRDM = (assignment: any) => {
        const data = course.enrollments.map((enrollment, index) => {
            const sub = assignment.submissions?.find((s: any) => s.studentId === enrollment.student.id)
            return {
                "No": index + 1,
                "NIS": enrollment.student.nis,
                "Nisn": (enrollment.student as any).nisn || "",
                "Nama": enrollment.student.name,
                "Tipe Evaluation": assignment.type,
                "Nilai (0-100)": sub?.score !== null && sub?.score !== undefined ? sub.score : "",
                "Catatan / Feedback Guru": sub?.feedback || ""
            }
        })

        const wb = XLSX.utils.book_new()
        
        const wsData = [
            ["Template Nilai RDM (Rapor Digital Madrasah)"],
            ["Nama Guru:", course.teacher.name, "Kelas/Mapel:", `${course.title}`],
            ["Judul Evaluasi:", assignment.title, "Tipe:", assignment.type],
            ["KKTP:", assignment.kktp || "-", "Skor Maksimal:", assignment.maxScore || 100],
            ["No", "NIS", "Nisn", "Nama Siswa", "Tipe Evaluation", "Nilai (0-100)", "Catatan / Feedback Guru"],
        ]

        data.forEach(row => {
            wsData.push([row.No, row.NIS, row.Nisn, row.Nama, row["Tipe Evaluation"], row["Nilai (0-100)"], row["Catatan / Feedback Guru"]])
        })

        const ws = XLSX.utils.aoa_to_sheet(wsData)
        
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
        ]

        XLSX.utils.book_append_sheet(wb, ws, "Format RDM")
        XLSX.writeFile(wb, `RDM_${assignment.type}_${course.title.replace(/\s+/g, '_')}_${assignment.title.replace(/\s+/g, '_')}.xlsx`)
    }

    const handleCreateModule = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        formData.delete('targetCourseIds')
        selectedModuleCourseIds.forEach(id => formData.append('targetCourseIds', id.toString()))

        const res = await createElearningModule(course.id, formData)
        if (res.success) {
            setIsModuleFormOpen(false)
        } else {
            alert(res.error)
        }
        setLoading(false)
    }

    const handleCreateAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        formData.delete('targetCourseIds')
        selectedAssignmentCourseIds.forEach(id => formData.append('targetCourseIds', id.toString()))

        const res = await createElearningAssignment(course.id, formData)
        if (res.success) {
            setIsAssignmentFormOpen(false)
        } else {
            alert(res.error)
        }
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
                <Link href="/guru" className="p-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
                    <ArrowLeft className="h-5 w-5 text-slate-600" />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        {course.title}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Guru: {course.teacher.name} | Tahun: {course.academicYear.name}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 overflow-x-auto">
                <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
                    <button
                        onClick={() => setActiveTab('modules')}
                        className={`whitespace-nowrap pb-3 sm:pb-4 px-1 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 ${
                            activeTab === 'modules' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        <BookOpen className="h-4 w-4" />
                        Materi / Modul ({course.modules.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('assignments')}
                        className={`whitespace-nowrap pb-3 sm:pb-4 px-1 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 ${
                            activeTab === 'assignments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        <ClipboardList className="h-4 w-4" />
                        Tugas, Praktik & Ujian ({course.assignments.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`whitespace-nowrap pb-3 sm:pb-4 px-1 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 ${
                            activeTab === 'students' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        <Users className="h-4 w-4" />
                        Siswa ({course.enrollments.length})
                    </button>
                </nav>
            </div>

            {/* Content Area */}
            <div className="pt-4">
                {activeTab === 'modules' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900">Daftar Modul Pembelajaran</h3>
                            <button 
                                onClick={() => {
                                    setSelectedModuleCourseIds([course.id])
                                    setIsModuleFormOpen(true)
                                }}
                                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow"
                            >
                                <Plus className="h-4 w-4" /> Tambah Modul
                            </button>
                        </div>
                        
                        {course.modules.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-3xl border border-dashed">
                                <BookOpen className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                                <p className="text-slate-600 font-medium">Belum ada modul materi.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {course.modules.map(mod => (
                                    <div key={mod.id} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                                    {mod.videoUrl ? <Video className="h-5 w-5" /> : mod.documentUrl ? <FileText className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900">{mod.title}</h4>
                                                    <p className="text-xs text-slate-500">Urutan: {mod.order + 1}</p>
                                                </div>
                                            </div>

                                            {mod.documentUrl && (
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <button
                                                        onClick={() => setActivePdfModuleId(activePdfModuleId === mod.id ? null : mod.id)}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-sm"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        {activePdfModuleId === mod.id ? "Sembunyikan Dokumen PDF" : "Buka & Baca Dokumen PDF"}
                                                    </button>
                                                    <a
                                                        href={mod.documentUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl border border-indigo-200/60 transition-colors"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" /> Buka Tab Baru
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        {mod.documentUrl && activePdfModuleId === mod.id && (
                                            <div className="pt-3 border-t space-y-2">
                                                <div className="flex justify-between items-center bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 text-xs font-bold text-indigo-900">
                                                    <span>Pratinjau Dokumen PDF: {mod.title}</span>
                                                    <a href={mod.documentUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-semibold">
                                                        Layar Penuh &rarr;
                                                    </a>
                                                </div>
                                                <iframe
                                                    src={mod.documentUrl}
                                                    className="w-full h-[550px] rounded-2xl border border-slate-300 shadow-inner bg-slate-100"
                                                    title={mod.title}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'assignments' && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Penugasan, Praktik & Ujian Sumatif</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Kelola tugas harian, asesmen KKTP, tugas praktik Informatika/praktikum, dan ujian.</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setSelectedAssignmentCourseIds([course.id])
                                    setIsAssignmentFormOpen(true)
                                }}
                                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow shrink-0"
                            >
                                <Plus className="h-4 w-4" /> Buat Penugasan / Praktik / Ujian
                            </button>
                        </div>

                        {course.assignments.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-3xl border border-dashed">
                                <ClipboardList className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                                <p className="text-slate-600 font-medium">Belum ada tugas, praktik, atau ujian.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {course.assignments.map(assignment => {
                                    const submissionsCount = assignment.submissions?.length || 0
                                    const totalStudents = course.enrollments.length
                                    const type = assignment.type || 'TUGAS'
                                    
                                    // Style config per assignment type
                                    const typeConfig: any = {
                                        PRAKTIK: { label: "Tugas Praktik / Unjuk Kerja", bg: "bg-cyan-100 text-cyan-800 border-cyan-200" },
                                        PROYEK: { label: "Tugas Proyek / Portofolio", bg: "bg-purple-100 text-purple-800 border-purple-200" },
                                        SUMATIF: { label: "Asesmen Sumatif KKTP", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" },
                                        UJIAN: { label: "Ujian Resmi / PTS / PAS", bg: "bg-rose-100 text-rose-800 border-rose-200" },
                                        TUGAS: { label: "Tugas Harian", bg: "bg-slate-100 text-slate-800 border-slate-200" }
                                    }
                                    const currentConfig = typeConfig[type] || typeConfig.TUGAS

                                    return (
                                        <div key={assignment.id} className="p-5 bg-white border border-slate-200 rounded-3xl space-y-4 hover:shadow-md transition-shadow">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b pb-3">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentConfig.bg}`}>
                                                            {currentConfig.label}
                                                        </span>
                                                        {assignment.kktp && (
                                                            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                                                                KKTP: {assignment.kktp}
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-slate-500 font-medium">
                                                            Bobot Max: {assignment.maxScore || 100} Poin
                                                        </span>
                                                    </div>
                                                    <h4 className="font-bold text-slate-900 text-lg">{assignment.title}</h4>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                                                    <button 
                                                        onClick={() => handleOpenGrading(assignment)}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all shadow-sm"
                                                    >
                                                        <ListChecks className="h-4 w-4" />
                                                        Periksa & Nilai ({submissionsCount}/{totalStudents} Siswa)
                                                    </button>

                                                    <button 
                                                        onClick={() => handleExportRDM(assignment)}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-xl transition-colors shadow-sm"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                        Export RDM
                                                    </button>
                                                </div>
                                            </div>

                                            {assignment.description && (
                                                <p className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                    {assignment.description}
                                                </p>
                                            )}

                                            {assignment.rubric && (
                                                <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-2xl text-xs space-y-1">
                                                    <span className="font-bold text-amber-900 uppercase block">Rubrik / Kriteria Penilaian Praktik:</span>
                                                    <p className="text-amber-800 whitespace-pre-line">{assignment.rubric}</p>
                                                </div>
                                            )}

                                            {assignment.questionFileUrl && (
                                                <div className="pt-2 flex flex-wrap items-center gap-2">
                                                    <button
                                                        onClick={() => setActiveQuestionPdfId(activeQuestionPdfId === assignment.id ? null : assignment.id)}
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl border transition-colors"
                                                    >
                                                        <FileText className="h-4 w-4 text-indigo-600" />
                                                        {activeQuestionPdfId === assignment.id ? "Sembunyikan File Soal / Panduan PDF" : "Lihat File Soal / Panduan Praktikum PDF"}
                                                    </button>
                                                    <a
                                                        href={assignment.questionFileUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-xs text-indigo-600 hover:underline font-semibold"
                                                    >
                                                        Buka Tab Baru &rarr;
                                                    </a>
                                                </div>
                                            )}

                                            {assignment.questionFileUrl && activeQuestionPdfId === assignment.id && (
                                                <div className="mt-3 border-t pt-3 space-y-2">
                                                    <iframe
                                                        src={assignment.questionFileUrl}
                                                        className="w-full h-[500px] rounded-2xl border border-slate-300 shadow-inner bg-slate-100"
                                                        title={assignment.title}
                                                    />
                                                </div>
                                            )}

                                            {assignment.dueDate && (
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pt-1">
                                                    <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                                                    <span>Tenggat Waktu: {new Date(assignment.dueDate).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</span>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'students' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900">Daftar Siswa Terdaftar (Otomatis Sync WebMadrasah)</h3>
                        </div>
                        
                        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-5 py-3.5 font-bold text-slate-700">No</th>
                                        <th className="px-5 py-3.5 font-bold text-slate-700">NIS</th>
                                        <th className="px-5 py-3.5 font-bold text-slate-700">NISN</th>
                                        <th className="px-5 py-3.5 font-bold text-slate-700">Nama Siswa</th>
                                        <th className="px-5 py-3.5 font-bold text-slate-700">Kelas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {course.enrollments.map((en, idx) => (
                                        <tr key={en.student.id} className="border-b last:border-0 hover:bg-slate-50">
                                            <td className="px-5 py-3.5 text-slate-500 font-medium">{idx + 1}</td>
                                            <td className="px-5 py-3.5 font-bold text-slate-900">{en.student.nis}</td>
                                            <td className="px-5 py-3.5 text-slate-600">{(en.student as any).nisn || "-"}</td>
                                            <td className="px-5 py-3.5 font-medium">{en.student.name}</td>
                                            <td className="px-5 py-3.5 font-semibold text-indigo-600">{en.student.class}</td>
                                        </tr>
                                    ))}
                                    {course.enrollments.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                                                Belum ada siswa terdaftar. Pilih Target Kelas saat edit pelajaran untuk sinkronisasi otomatis.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Tambah Modul */}
            {isModuleFormOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <h3 className="text-xl font-bold mb-4">Tambah Modul Pembelajaran</h3>
                        <form onSubmit={handleCreateModule} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Judul Modul *</label>
                                <input name="title" type="text" required placeholder="Contoh: Bab 1 Persamaan Kuadrat" className="w-full p-3 border rounded-xl text-sm" />
                            </div>
                            
                            {targetCourseList.length > 1 && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                                        Terbitkan Juga Ke Kelas Lain ({selectedModuleCourseIds.length} terpilih)
                                    </label>
                                    <div className="space-y-1.5 max-h-36 overflow-y-auto p-3 border border-slate-200 rounded-xl bg-slate-50">
                                        {targetCourseList.map(c => {
                                            const isChecked = selectedModuleCourseIds.includes(c.id)
                                            return (
                                                <label key={c.id} className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => toggleModuleCourse(c.id)}
                                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                                    />
                                                    <span>{c.title}</span>
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Upload File Dokumen / PDF (Opsional)</label>
                                <input
                                    name="documentFile"
                                    type="file"
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt"
                                    className="w-full p-2 border rounded-xl text-xs bg-slate-50 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
                                />
                                <p className="text-[11px] text-slate-500 mt-1">Format didukung: PDF, Word, PowerPoint, Excel, ZIP (Otomatis tersimpan & diunduh siswa).</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">URL Video (YouTube / Link Opsional)</label>
                                <input name="videoUrl" type="url" placeholder="https://youtube.com/..." className="w-full p-3 border rounded-xl text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Isi Ringkasan Materi</label>
                                <textarea name="content" rows={3} placeholder="Tuliskan ringkasan materi..." className="w-full p-3 border rounded-xl text-sm resize-none" />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setIsModuleFormOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Batal</button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl disabled:opacity-50">
                                    {loading ? "Menyimpan..." : "Simpan Modul"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Tambah Tugas / Praktik / Ujian */}
            {isAssignmentFormOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <h3 className="text-xl font-bold mb-4">Buat Penugasan / Praktik / Ujian Baru</h3>
                        <form onSubmit={handleCreateAssignment} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Judul Penugasan / Praktik *</label>
                                <input name="title" type="text" required placeholder="Contoh: Praktikum HTML & CSS Bab 1" className="w-full p-3 border rounded-xl text-sm" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Kategori / Tipe Evaluation *</label>
                                    <select name="type" className="w-full p-3 border rounded-xl text-sm font-semibold bg-slate-50">
                                        <option value="PRAKTIK">Tugas Praktik / Unjuk Kerja (Informatika / IPA)</option>
                                        <option value="SUMATIF">Asesmen Sumatif (KKTP RDM)</option>
                                        <option value="PROYEK">Tugas Proyek / Portofolio</option>
                                        <option value="TUGAS">Tugas Harian (Teori)</option>
                                        <option value="UJIAN">Ujian Resmi (PTS / PAS / PAT)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Skor Maksimal (Default 100)</label>
                                    <input name="maxScore" type="number" defaultValue="100" className="w-full p-3 border rounded-xl text-sm" />
                                </div>
                            </div>

                            {targetCourseList.length > 1 && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                                        Terbitkan Juga Ke Kelas Lain ({selectedAssignmentCourseIds.length} terpilih)
                                    </label>
                                    <div className="space-y-1.5 max-h-36 overflow-y-auto p-3 border border-slate-200 rounded-xl bg-slate-50">
                                        {targetCourseList.map(c => {
                                            const isChecked = selectedAssignmentCourseIds.includes(c.id)
                                            return (
                                                <label key={c.id} className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => toggleAssignmentCourse(c.id)}
                                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                                    />
                                                    <span>{c.title}</span>
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Tenggat Waktu Pengumpulan (Opsional)</label>
                                <input name="dueDate" type="datetime-local" className="w-full p-3 border rounded-xl text-sm bg-slate-50" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Upload File Soal / Panduan Praktikum PDF (Opsional)</label>
                                <input
                                    name="questionFile"
                                    type="file"
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                                    className="w-full p-2 border rounded-xl text-xs bg-slate-50 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">KKTP (Kriteria Ketercapaian Tujuan Pembelajaran - Opsional)</label>
                                <input name="kktp" type="text" placeholder="Contoh: 75" className="w-full p-3 border rounded-xl text-sm" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Rubrik / Kriteria Penilaian Praktik (Opsional)</label>
                                <textarea name="rubric" rows={2} placeholder="Contoh: Kecepatan 30%, Fungsi Fitur Kode 40%, Kerapian Tampilan 30%" className="w-full p-3 border rounded-xl text-sm resize-none" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Petunjuk Soal / Deskripsi Detail</label>
                                <textarea name="description" rows={3} placeholder="Tulis petunjuk pengerjaan..." className="w-full p-3 border rounded-xl text-sm resize-none" />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t">
                                <button type="button" onClick={() => setIsAssignmentFormOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Batal</button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl disabled:opacity-50">
                                    {loading ? "Menyimpan..." : "Simpan Evaluasi"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Periksa & Nilai Siswa */}
            {gradingAssignment && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-4xl bg-white rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] space-y-6">
                        <div className="flex justify-between items-start border-b pb-4">
                            <div>
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                                    {gradingAssignment.type}
                                </span>
                                <h3 className="text-xl font-bold text-slate-900 mt-1">Periksa & Nilai Siswa: {gradingAssignment.title}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Mata Pelajaran: {course.title} | Skor Max: {gradingAssignment.maxScore || 100}</p>
                            </div>
                            <button onClick={() => setGradingAssignment(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {course.enrollments.length === 0 ? (
                                <p className="text-center text-slate-500 py-8 text-sm">Belum ada siswa terdaftar di kelas ini.</p>
                            ) : (
                                course.enrollments.map((en, idx) => {
                                    const student = en.student
                                    const sub = gradingAssignment.submissions?.find((s: any) => s.studentId === student.id)
                                    const isSubmitted = !!sub
                                    const isGraded = sub?.score !== null && sub?.score !== undefined

                                    return (
                                        <div key={student.id} className={`p-4 rounded-2xl border ${isSubmitted ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b pb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="h-7 w-7 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                                                        {idx + 1}
                                                    </span>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900">{student.name}</h4>
                                                        <p className="text-xs text-slate-500">NIS: {student.nis} | Kelas: {student.class}</p>
                                                    </div>
                                                </div>

                                                <div>
                                                    {isSubmitted ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                                            <CheckCircle2 className="h-3.5 w-3.5" /> Sudah Mengumpulkan
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-200 px-2.5 py-1 rounded-full">
                                                            <Clock className="h-3.5 w-3.5" /> Belum Mengumpulkan
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {isSubmitted && (
                                                <div className="mt-3 space-y-3">
                                                    {sub.content && (
                                                        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-800 border">
                                                            <span className="font-bold text-slate-500 uppercase block mb-1">Teks Jawaban / Laporan Siswa:</span>
                                                            <p className="whitespace-pre-line">{sub.content}</p>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-wrap gap-2">
                                                        {sub.fileUrl && (
                                                            <a
                                                                href={sub.fileUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                download
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-colors"
                                                            >
                                                                <FileCode className="h-4 w-4" /> Download / Buka File Hasil Praktik/Jawaban (ZIP/PDF/Dokumen)
                                                            </a>
                                                        )}

                                                        {sub.linkUrl && (
                                                            <a
                                                                href={sub.linkUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 text-xs font-bold rounded-xl border border-cyan-200 transition-colors"
                                                            >
                                                                <Globe className="h-4 w-4" /> Buka Link Repo / Demo Praktik
                                                            </a>
                                                        )}
                                                    </div>

                                                    {/* Form Input Nilai & Feedback */}
                                                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                                                        <div className="w-full sm:w-32">
                                                            <label className="block text-[10px] font-bold text-emerald-900 uppercase mb-1">Nilai (0 - 100)</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                placeholder="Nilai"
                                                                value={scores[student.id] || ''}
                                                                onChange={(e) => setScores({ ...scores, [student.id]: e.target.value })}
                                                                className="w-full p-2 border rounded-xl text-sm font-bold text-emerald-900 bg-white"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="block text-[10px] font-bold text-emerald-900 uppercase mb-1">Catatan / Feedback Guru</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Berikan catatan perbaikan..."
                                                                value={feedbacks[student.id] || ''}
                                                                onChange={(e) => setFeedbacks({ ...feedbacks, [student.id]: e.target.value })}
                                                                className="w-full p-2 border rounded-xl text-xs bg-white"
                                                            />
                                                        </div>
                                                        <div className="self-end sm:self-center">
                                                            <button
                                                                onClick={() => handleSaveGrade(sub.id, student.id)}
                                                                disabled={gradingLoading === sub.id}
                                                                className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow disabled:opacity-50 w-full sm:w-auto"
                                                            >
                                                                {gradeSuccessId === sub.id ? (
                                                                    <>
                                                                        <Check className="h-4 w-4" /> Tersimpan!
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Award className="h-4 w-4" /> Simpan Nilai
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        <div className="flex justify-end border-t pt-3">
                            <button onClick={() => setGradingAssignment(null)} className="px-5 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold">
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

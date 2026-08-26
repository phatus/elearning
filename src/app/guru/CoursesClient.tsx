'use client'

import { useState } from "react"
import {
    Plus, Search, BookOpen, Edit, Trash2, Users, RefreshCw, LogOut, ShieldCheck, Key
} from "lucide-react"
import Link from "next/link"
import { deleteElearningCourse, syncDataFromWebMadrasah } from "@/actions/elearning"
import { logoutTeacherAction, updateTeacherPasswordAction } from "@/actions/auth"
import CourseForm from "./CourseForm"

type Course = {
    id: number
    title: string
    description: string | null
    isActive: boolean
    teacher: { name: string }
    academicYear: { name: string }
    _count: { modules: number, assignments: number, enrollments: number }
}

export default function CoursesClient({
    session,
    courses,
    teachers,
    academicYears,
    availableClasses
}: {
    session: any
    courses: Course[]
    teachers: any[]
    academicYears: any[]
    availableClasses: string[]
}) {
    const [searchQuery, setSearchQuery] = useState('')
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingCourse, setEditingCourse] = useState<Course | null>(null)
    const [isDeleting, setIsDeleting] = useState<number | null>(null)
    const [isSyncing, setIsSyncing] = useState(false)
    const [syncMessage, setSyncMessage] = useState<string | null>(null)

    // Password Modal State
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [passwordLoading, setPasswordLoading] = useState(false)

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleSyncWebMadrasah = async () => {
        setIsSyncing(true)
        setSyncMessage(null)
        const res = await syncDataFromWebMadrasah()
        if (res.success) {
            setSyncMessage(`Berhasil menyinkronkan ${res.studentsCount} data siswa & ${res.teachersCount} data guru dari WebMadrasah!`)
            setTimeout(() => setSyncMessage(null), 4000)
        } else {
            alert(res.error)
        }
        setIsSyncing(false)
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newPassword.trim()) return
        setPasswordLoading(true)
        const res = await updateTeacherPasswordAction(newPassword.trim())
        if (res.success) {
            alert("Password berhasil diperbarui!")
            setIsPasswordModalOpen(false)
            setNewPassword('')
        } else {
            alert(res.error || "Gagal mengubah password")
        }
        setPasswordLoading(false)
    }

    const handleLogout = async () => {
        await logoutTeacherAction()
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Yakin ingin menghapus mata pelajaran ini? Semua modul dan tugas akan ikut terhapus.")) return
        
        setIsDeleting(id)
        const res = await deleteElearningCourse(id)
        if (!res.success) {
            alert(res.error)
        }
        setIsDeleting(null)
    }

    const openCreateForm = () => {
        setEditingCourse(null)
        setIsFormOpen(true)
    }

    const openEditForm = (course: Course) => {
        setEditingCourse(course)
        setIsFormOpen(true)
    }

    return (
        <div className="space-y-6">
            {/* Logged in Teacher Info Banner */}
            <div className="bg-slate-900 rounded-3xl p-4 sm:p-5 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                        <span className="text-[10px] sm:text-xs text-indigo-300 font-semibold uppercase tracking-wider block">Sesi Guru Terautentikasi</span>
                        <h1 className="text-base sm:text-lg font-bold truncate">{session.name} {session.nip ? `(NIP: ${session.nip})` : ''}</h1>
                    </div>
                </div>

                <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-2.5 w-full md:w-auto">
                    <button
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl bg-indigo-600/40 hover:bg-indigo-600 text-indigo-100 px-2 sm:px-3.5 py-2 text-[11px] sm:text-xs font-bold transition-all border border-indigo-400/30"
                    >
                        <Key className="h-3.5 w-3.5 shrink-0" />
                        <span className="hidden xs:inline">Ubah </span>Pass
                    </button>

                    <button
                        onClick={handleSyncWebMadrasah}
                        disabled={isSyncing}
                        className="inline-flex items-center justify-center gap-1 sm:gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-2 sm:px-3.5 py-2 text-[11px] sm:text-xs font-bold text-white transition-all shadow disabled:opacity-50"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? "Sync..." : "Sinkron"}</span>
                    </button>

                    <button
                        onClick={handleLogout}
                        className="inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl bg-red-600/30 hover:bg-red-600 text-red-100 hover:text-white px-2 sm:px-3.5 py-2 text-[11px] sm:text-xs font-bold transition-all border border-red-500/30"
                    >
                        <LogOut className="h-3.5 w-3.5 shrink-0" />
                        <span>Keluar</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                        <BookOpen className="h-7 w-7 text-indigo-600" />
                        Kelola Mata Pelajaran Guru
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Sistem Terproteksi. Kelola modul, tugas sumatif, dan unduh format Excel RDM.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cari mata pelajaran..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-64 pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:border-indigo-500 bg-white text-sm"
                        />
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    </div>
                    
                    <button
                        onClick={openCreateForm}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-all shadow shrink-0"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah Pelajaran Baru
                    </button>
                </div>
            </div>

            {syncMessage && (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-sm font-semibold border border-emerald-200 shadow-sm animate-fade-in">
                    {syncMessage}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed">
                        <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                        <h3 className="text-lg font-bold text-slate-900">Belum Ada Mata Pelajaran</h3>
                        <p className="text-slate-500 text-sm mt-1">Klik tombol di bawah untuk membuat mata pelajaran pertama.</p>
                        <button onClick={openCreateForm} className="mt-4 text-indigo-600 font-bold text-sm hover:underline">
                            + Tambah Pelajaran Baru
                        </button>
                    </div>
                ) : (
                    filteredCourses.map(course => (
                        <div key={course.id} className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2 ${course.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                                            {course.academicYear.name}
                                        </span>
                                        <Link href={`/guru/courses/${course.id}`} className="block">
                                            <h3 className="text-xl font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1">
                                                {course.title}
                                            </h3>
                                        </Link>
                                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                                            <Users className="h-3.5 w-3.5" />
                                            Guru: {course.teacher.name}
                                        </p>
                                    </div>
                                    
                                    <div className="flex gap-1.5">
                                        <button onClick={() => openEditForm(course)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(course.id)} 
                                            disabled={isDeleting === course.id}
                                            className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                
                                <p className="text-xs text-slate-600 mb-6 line-clamp-2">
                                    {course.description || "Tidak ada deskripsi."}
                                </p>
                            </div>

                            <div>
                                <div className="grid grid-cols-3 gap-2 border-t pt-4 text-center">
                                    <div>
                                        <p className="text-lg font-bold text-slate-900">{course._count.modules}</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Modul</p>
                                    </div>
                                    <div className="border-l border-r">
                                        <p className="text-lg font-bold text-slate-900">{course._count.assignments}</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Tugas</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-slate-900">{course._count.enrollments}</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Siswa</p>
                                    </div>
                                </div>
                                
                                <Link 
                                    href={`/guru/courses/${course.id}`}
                                    className="mt-5 block w-full text-center py-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl transition-all font-bold text-xs"
                                >
                                    Kelola Modul & Export RDM &rarr;
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal Ubah Password */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Key className="h-5 w-5 text-indigo-600" /> Ubah Password Akun Guru
                        </h3>
                        <p className="text-xs text-slate-500">Masukkan kata sandi baru untuk akun {session.name}.</p>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Password Baru *</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="Masukkan password baru"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Batal</button>
                                <button type="submit" disabled={passwordLoading || !newPassword.trim()} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl disabled:opacity-50">Simpan Password Baru</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isFormOpen && (
                <CourseForm 
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    session={session}
                    teachers={teachers}
                    academicYears={academicYears}
                    availableClasses={availableClasses}
                    editingCourse={editingCourse}
                />
            )}
        </div>
    )
}

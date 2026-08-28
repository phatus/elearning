'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck,
  BookOpen,
  Users,
  UserCheck,
  KeyRound,
  LogOut,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Sparkles,
  Settings,
  User,
  Lock,
  Loader2,
} from 'lucide-react'
import { logoutAdminAction, resetStudentPasswordAction, resetTeacherPasswordAction, updateAdminAccountAction } from '@/actions/auth'
import DataTablePagination from '@/components/ui/DataTablePagination'
import SearchAndFilterBar from '@/components/ui/SearchAndFilterBar'

type Props = {
  admin: { name: string; username: string }
  stats: {
    totalCourses: number
    totalStudents: number
    totalTeachers: number
    totalSubmissions: number
  }
  students: Array<{ id: number; nis: string; name: string; class: string; status: string; hasPassword: boolean }>
  teachers: Array<{ id: number; name: string; nip: string | null; subject: string | null; hasPassword: boolean }>
  courses: Array<{ id: number; title: string; targetClass: string | null; teacherName: string; moduleCount: number; assignmentCount: number }>
}

export default function AdminClient({ admin, stats, students, teachers, courses }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'teachers' | 'courses' | 'settings'>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [resetStatus, setResetStatus] = useState<{ id: number; message?: string; error?: string } | null>(null)
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [newPasswordInput, setNewPasswordInput] = useState<{ [key: number]: string }>({})

  // Admin Account Settings State
  const [accountForm, setAccountForm] = useState({
    name: admin.name,
    username: admin.username,
    currentPassword: '',
    newPassword: '',
  })
  const [accountStatus, setAccountStatus] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)
  const [accountLoading, setAccountLoading] = useState(false)

  const handleUpdateAdminAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAccountStatus(null)
    setAccountLoading(true)

    const formData = new FormData()
    formData.append('name', accountForm.name)
    formData.append('username', accountForm.username)
    formData.append('currentPassword', accountForm.currentPassword)
    formData.append('newPassword', accountForm.newPassword)

    try {
      const res = await updateAdminAccountAction(formData)
      if (res.success) {
        setAccountStatus({ success: true, message: res.message })
        setAccountForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }))
        router.refresh()
      } else {
        setAccountStatus({ success: false, error: res.error })
      }
    } catch (err: any) {
      setAccountStatus({ success: false, error: err.message || 'Gagal menyimpan perubahan.' })
    } finally {
      setAccountLoading(false)
    }
  }

  const handleLogout = async () => {
    await logoutAdminAction()
  }

  const handleResetStudentPassword = async (studentId: number) => {
    setLoadingId(studentId)
    setResetStatus(null)
    const customPass = newPasswordInput[studentId]?.trim() || undefined
    try {
      const res = await resetStudentPasswordAction(studentId, customPass)
      if (res.success) {
        setResetStatus({ id: studentId, message: customPass ? `Password diubah ke: "${customPass}"` : 'Password berhasil di-reset (kosong/bebas diisi siswa saat login).' })
      } else {
        setResetStatus({ id: studentId, error: res.error })
      }
    } catch (err: any) {
      setResetStatus({ id: studentId, error: err.message })
    } finally {
      setLoadingId(null)
      router.refresh()
    }
  }

  const handleResetTeacherPassword = async (teacherId: number) => {
    setLoadingId(teacherId)
    setResetStatus(null)
    const customPass = newPasswordInput[teacherId]?.trim() || undefined
    try {
      const res = await resetTeacherPasswordAction(teacherId, customPass)
      if (res.success) {
        setResetStatus({ id: teacherId, message: customPass ? `Password diubah ke: "${customPass}"` : 'Password berhasil di-reset (kosong/bebas diisi guru saat login).' })
      } else {
        setResetStatus({ id: teacherId, error: res.error })
      }
    } catch (err: any) {
      setResetStatus({ id: teacherId, error: err.message })
    } finally {
      setLoadingId(null)
      router.refresh()
    }
  }

  // Pagination & Filtering States
  const [studentPage, setStudentPage] = useState(1)
  const [studentLimit, setStudentLimit] = useState(10)
  const [studentClassFilter, setStudentClassFilter] = useState('')

  const [teacherPage, setTeacherPage] = useState(1)
  const [teacherLimit, setTeacherLimit] = useState(10)

  const [coursePage, setCoursePage] = useState(1)
  const [courseLimit, setCourseLimit] = useState(10)

  // Compute unique class options for student filter
  const classOptions = [
    { label: 'Semua Kelas', value: '' },
    ...Array.from(new Set(students.map((s) => s.class))).sort().map((c) => ({ label: `Kelas ${c}`, value: c })),
  ]

  // Filtered & Paginated Students
  const filteredStudents = students.filter(
    (s) =>
      (!studentClassFilter || s.class === studentClassFilter) &&
      (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.includes(searchQuery) ||
        s.class.toLowerCase().includes(searchQuery.toLowerCase()))
  )
  const studentTotalPages = Math.ceil(filteredStudents.length / studentLimit) || 1
  const paginatedStudents = filteredStudents.slice(
    (studentPage - 1) * studentLimit,
    studentPage * studentLimit
  )

  // Filtered & Paginated Teachers
  const filteredTeachers = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.nip && t.nip.includes(searchQuery)) ||
      (t.subject && t.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  )
  const teacherTotalPages = Math.ceil(filteredTeachers.length / teacherLimit) || 1
  const paginatedTeachers = filteredTeachers.slice(
    (teacherPage - 1) * teacherLimit,
    teacherPage * teacherLimit
  )

  // Filtered & Paginated Courses
  const filteredCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.targetClass && c.targetClass.toLowerCase().includes(searchQuery.toLowerCase()))
  )
  const courseTotalPages = Math.ceil(filteredCourses.length / courseLimit) || 1
  const paginatedCourses = filteredCourses.slice(
    (coursePage - 1) * courseLimit,
    coursePage * courseLimit
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-16">
      {/* Header Admin */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white leading-none">
                Admin E-Learning
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                MTsN 1 Pacitan • {admin.name}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/60 rounded-xl border border-rose-200/80 dark:border-rose-800 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Ringkasan</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'students'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Kelola Siswa ({students.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'teachers'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Kelola Guru ({teachers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'courses'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Daftar Kursus ({courses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Pengaturan Akun</span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Kursus
                </p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {stats.totalCourses}
                </h3>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Siswa Aktif
                </p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {stats.totalStudents}
                </h3>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 flex items-center justify-center mb-4">
                  <UserCheck className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Guru
                </p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {stats.totalTeachers}
                </h3>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Pengumpulan Tugas
                </p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {stats.totalSubmissions}
                </h3>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Aksi Cepat Admin
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Pilih menu kelola di atas untuk melakukan pencarian dan reset password akun siswa/guru jika terjadi kendala lupa kata sandi.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveTab('students')}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  Reset Password Siswa
                </button>
                <button
                  onClick={() => setActiveTab('teachers')}
                  className="px-4 py-2 text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 rounded-xl hover:bg-purple-100 transition-colors cursor-pointer"
                >
                  Reset Password Guru
                </button>
                <button
                  onClick={() => setActiveTab('courses')}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  Lihat Semua Kursus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Students */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <SearchAndFilterBar
              searchQuery={searchQuery}
              onSearchChange={(q) => {
                setSearchQuery(q)
                setStudentPage(1)
              }}
              placeholder="Cari nama, NIS, atau kelas siswa..."
              filterOptions={classOptions}
              selectedFilter={studentClassFilter}
              onFilterChange={(cls) => {
                setStudentClassFilter(cls)
                setStudentPage(1)
              }}
            />

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">NIS</th>
                      <th className="py-3.5 px-4">Nama Siswa</th>
                      <th className="py-3.5 px-4">Kelas</th>
                      <th className="py-3.5 px-4">Status Password</th>
                      <th className="py-3.5 px-4 text-right">Aksi Password</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                          Tidak ada data siswa yang ditemukan.
                        </td>
                      </tr>
                    ) : (
                      paginatedStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {student.nis}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                            {student.name}
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                              {student.class}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {student.hasPassword ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Terkunci (Ada Password)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                                <AlertCircle className="w-3.5 h-3.5" /> Belum Set (Kosong)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <input
                                type="text"
                                placeholder="Pass baru (opsional)"
                                value={newPasswordInput[student.id] || ''}
                                onChange={(e) =>
                                  setNewPasswordInput({ ...newPasswordInput, [student.id]: e.target.value })
                                }
                                className="w-36 text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                              />
                              <button
                                onClick={() => handleResetStudentPassword(student.id)}
                                disabled={loadingId === student.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                                <span>{loadingId === student.id ? 'Memproses...' : 'Reset Pass'}</span>
                              </button>
                            </div>
                            {resetStatus?.id === student.id && (
                              <div className={`mt-1 text-[11px] font-medium ${resetStatus.error ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {resetStatus.error || resetStatus.message}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="border-t border-slate-200 dark:border-slate-800 px-4">
                <DataTablePagination
                  currentPage={studentPage}
                  totalPages={studentTotalPages}
                  totalCount={filteredStudents.length}
                  limit={studentLimit}
                  onPageChange={(page) => setStudentPage(page)}
                  onLimitChange={(limit) => {
                    setStudentLimit(limit)
                    setStudentPage(1)
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Teachers */}
        {activeTab === 'teachers' && (
          <div className="space-y-4">
            <SearchAndFilterBar
              searchQuery={searchQuery}
              onSearchChange={(q) => {
                setSearchQuery(q)
                setTeacherPage(1)
              }}
              placeholder="Cari nama, NIP, atau mata pelajaran guru..."
            />

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">NIP</th>
                      <th className="py-3.5 px-4">Nama Guru</th>
                      <th className="py-3.5 px-4">Mata Pelajaran</th>
                      <th className="py-3.5 px-4">Status Password</th>
                      <th className="py-3.5 px-4 text-right">Aksi Password</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedTeachers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                          Tidak ada data guru yang ditemukan.
                        </td>
                      </tr>
                    ) : (
                      paginatedTeachers.map((teacher) => (
                        <tr key={teacher.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {teacher.nip || '-'}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                            {teacher.name}
                          </td>
                          <td className="py-3 px-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                            {teacher.subject || 'Guru Pengampu'}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {teacher.hasPassword ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Terkunci (Ada Password)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                                <AlertCircle className="w-3.5 h-3.5" /> Belum Set (Kosong)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <input
                                type="text"
                                placeholder="Pass baru (opsional)"
                                value={newPasswordInput[teacher.id] || ''}
                                onChange={(e) =>
                                  setNewPasswordInput({ ...newPasswordInput, [teacher.id]: e.target.value })
                                }
                                className="w-36 text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                              />
                              <button
                                onClick={() => handleResetTeacherPassword(teacher.id)}
                                disabled={loadingId === teacher.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                                <span>{loadingId === teacher.id ? 'Memproses...' : 'Reset Pass'}</span>
                              </button>
                            </div>
                            {resetStatus?.id === teacher.id && (
                              <div className={`mt-1 text-[11px] font-medium ${resetStatus.error ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {resetStatus.error || resetStatus.message}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="border-t border-slate-200 dark:border-slate-800 px-4">
                <DataTablePagination
                  currentPage={teacherPage}
                  totalPages={teacherTotalPages}
                  totalCount={filteredTeachers.length}
                  limit={teacherLimit}
                  onPageChange={(page) => setTeacherPage(page)}
                  onLimitChange={(limit) => {
                    setTeacherLimit(limit)
                    setTeacherPage(1)
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Courses */}
        {activeTab === 'courses' && (
          <div className="space-y-4">
            <SearchAndFilterBar
              searchQuery={searchQuery}
              onSearchChange={(q) => {
                setSearchQuery(q)
                setCoursePage(1)
              }}
              placeholder="Cari judul kursus, nama guru, atau kelas sasaran..."
            />

            {paginatedCourses.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 shadow-sm">
                Tidak ada data kursus yang ditemukan.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedCourses.map((course) => (
                  <div key={course.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                        {course.title}
                      </h4>
                      {course.targetClass && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                          {course.targetClass}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Guru: <span className="text-slate-800 dark:text-slate-200 font-semibold">{course.teacherName}</span>
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{course.moduleCount}</span> Modul
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{course.assignmentCount}</span> Tugas
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-4">
              <DataTablePagination
                currentPage={coursePage}
                totalPages={courseTotalPages}
                totalCount={filteredCourses.length}
                limit={courseLimit}
                onPageChange={(page) => setCoursePage(page)}
                onLimitChange={(limit) => {
                  setCourseLimit(limit)
                  setCoursePage(1)
                }}
              />
            </div>
          </div>
        )}

        {/* Tab 5: Settings */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Pengaturan Akun Admin</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Perbarui nama pengelola, username login, atau ubah kata sandi akun Admin ini.
              </p>
            </div>

            {accountStatus && (
              <div
                className={`p-4 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 border ${
                  accountStatus.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                }`}
              >
                {accountStatus.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <span>{accountStatus.success ? accountStatus.message : accountStatus.error}</span>
              </div>
            )}

            <form onSubmit={handleUpdateAdminAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Nama Lengkap Admin
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={accountForm.name}
                    onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Username Admin
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={accountForm.username}
                    onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Ubah Kata Sandi (Opsional)
                </h4>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Password Lama
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      placeholder="Masukkan password lama untuk konfirmasi"
                      value={accountForm.currentPassword}
                      onChange={(e) => setAccountForm({ ...accountForm, currentPassword: e.target.value })}
                      className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Password Baru
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      placeholder="Minimal 4 karakter"
                      value={accountForm.newPassword}
                      onChange={(e) => setAccountForm({ ...accountForm, newPassword: e.target.value })}
                      className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={accountLoading}
                  className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {accountLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Konfigurasi Akun</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}

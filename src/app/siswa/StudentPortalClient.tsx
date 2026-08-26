'use client'

import { useState } from "react"
import {
    BookOpen, Clock, FileText, Send, LogOut,
    Award, Sparkles, ChevronRight, Video, CheckCircle2,
    Eye, ExternalLink
} from "lucide-react"
import { submitAssignment } from "@/actions/elearning"
import { logoutStudentAction } from "@/actions/auth"

export default function StudentPortalClient({
    studentData,
    initialCourses
}: {
    studentData: any
    initialCourses: any[]
}) {
    const [courses, setCourses] = useState<any[]>(initialCourses)
    const [loading, setLoading] = useState<boolean>(false)
    
    // Active view state
    const [selectedCourse, setSelectedCourse] = useState<any | null>(null)
    const [submittingAssignmentId, setSubmittingAssignmentId] = useState<number | null>(null)
    const [answerText, setAnswerText] = useState<string>('')
    const [submissionLinkText, setSubmissionLinkText] = useState<string>('')
    const [submissionFile, setSubmissionFile] = useState<File | null>(null)
    const [submitSuccess, setSubmitSuccess] = useState<boolean>(false)
    const [activePdfModuleId, setActivePdfModuleId] = useState<number | null>(null)
    const [activeQuestionPdfId, setActiveQuestionPdfId] = useState<number | null>(null)

    const handleLogout = async () => {
        await logoutStudentAction()
    }

    const handleSubmitAnswer = async (assignmentId: number) => {
        if (!answerText.trim() && !submissionFile && !submissionLinkText.trim()) return
        setLoading(true)
        const res = await submitAssignment(
            assignmentId,
            studentData.id,
            answerText,
            undefined,
            submissionLinkText,
            submissionFile
        )
        if (res.success) {
            setSubmitSuccess(true)
            setTimeout(() => {
                setSubmitSuccess(false)
                setSubmittingAssignmentId(null)
                setAnswerText('')
                setSubmissionLinkText('')
                setSubmissionFile(null)
            }, 1500)
        } else {
            alert(res.error)
        }
        setLoading(false)
    }

    let totalAssignments = 0
    let completedAssignments = 0
    courses.forEach(course => {
        course.assignments.forEach((asgn: any) => {
            totalAssignments++
            if (asgn.submissions && asgn.submissions.length > 0) {
                completedAssignments++
            }
        })
    })

    const studentXp = completedAssignments * 50

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Student Top Banner */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 rounded-3xl p-4 sm:p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-xl sm:text-2xl font-bold border border-white/30 shrink-0">
                        {studentData.name.charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                            <span className="bg-emerald-500/40 text-emerald-100 text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-400/30">
                                Kelas {studentData.class}
                            </span>
                            <span className="text-emerald-200 text-xs font-medium">NIS: {studentData.nis}</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold mt-1 leading-tight">{studentData.name}</h1>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-1 sm:gap-4 bg-white/10 backdrop-blur-md p-2.5 sm:px-5 sm:py-3 rounded-2xl border border-white/20 w-full md:w-auto items-center">
                    <div className="text-center border-r border-white/20 pr-1 sm:pr-4">
                        <div className="flex items-center justify-center gap-1 text-amber-300 font-bold text-sm sm:text-lg">
                            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                            {studentXp} XP
                        </div>
                        <p className="text-[9px] sm:text-[11px] text-emerald-100 uppercase tracking-wider mt-0.5 font-medium">Poin Belajar</p>
                    </div>
                    <div className="text-center border-r border-white/20 px-1 sm:px-4">
                        <div className="flex items-center justify-center gap-1 text-emerald-300 font-bold text-sm sm:text-lg">
                            <Award className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                            {completedAssignments}/{totalAssignments}
                        </div>
                        <p className="text-[9px] sm:text-[11px] text-emerald-100 uppercase tracking-wider mt-0.5 font-medium">Tugas Selesai</p>
                    </div>
                    <div className="flex items-center justify-center pl-1 sm:pl-2">
                        <button
                            onClick={handleLogout}
                            title="Keluar / Logout Siswa"
                            className="inline-flex items-center justify-center gap-1 text-xs font-bold text-red-100 hover:text-white bg-red-500/20 hover:bg-red-500/40 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-colors border border-red-400/30 w-full"
                        >
                            <LogOut className="h-3.5 w-3.5 shrink-0" />
                            <span>Keluar</span>
                        </button>
                    </div>
                </div>
            </div>

            {selectedCourse ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                    <button
                        onClick={() => setSelectedCourse(null)}
                        className="text-sm text-emerald-600 font-medium hover:underline flex items-center gap-1 mb-2"
                    >
                        &larr; Kembali ke daftar semua mata pelajaran
                    </button>
                    
                    <div className="border-b pb-4">
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-semibold">
                            {selectedCourse.academicYear?.name || "Tahun Aktif"}
                        </span>
                        <h2 className="text-2xl font-bold text-slate-900 mt-2">{selectedCourse.title}</h2>
                        <p className="text-sm text-slate-500 mt-1">Guru Pengampu: {selectedCourse.teacher?.name}</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-emerald-600" />
                            Materi Pembelajaran ({selectedCourse.modules.length})
                        </h3>

                        {selectedCourse.modules.length === 0 ? (
                            <p className="text-sm text-slate-500 py-4 italic">Belum ada modul materi untuk kelas ini.</p>
                        ) : (
                            <div className="grid gap-3">
                                {selectedCourse.modules.map((mod: any, idx: number) => (
                                    <div key={mod.id} className="p-4 rounded-2xl border bg-slate-50 hover:bg-white transition-all">
                                        <div className="flex items-center gap-3">
                                            <span className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                                                {idx + 1}
                                            </span>
                                            <h4 className="font-semibold text-slate-900">{mod.title}</h4>
                                        </div>

                                        {mod.content && (
                                            <div className="mt-3 text-sm text-slate-700 bg-white p-3.5 rounded-xl border">
                                                {mod.content}
                                            </div>
                                        )}

                                        {mod.documentUrl && (
                                            <div className="mt-3 space-y-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <button
                                                        onClick={() => setActivePdfModuleId(activePdfModuleId === mod.id ? null : mod.id)}
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl transition-all shadow-sm"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        {activePdfModuleId === mod.id ? "Sembunyikan Dokumen PDF" : "Buka & Baca Dokumen PDF"}
                                                    </button>
                                                    <a
                                                        href={mod.documentUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 px-3.5 py-2 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" /> Buka di Tab Baru
                                                    </a>
                                                </div>

                                                {activePdfModuleId === mod.id && (
                                                    <div className="mt-3 border-t pt-3 space-y-2">
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
                                        )}

                                        {mod.videoUrl && (
                                            <div className="mt-3">
                                                <a
                                                    href={mod.videoUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-2 text-xs font-semibold bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-100 transition-colors"
                                                >
                                                    <Video className="h-4 w-4" /> Tonton Video Pembelajaran
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t">
                        <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-indigo-600" />
                            Penugasan, Praktik & Ujian ({selectedCourse.assignments.length})
                        </h3>

                        {selectedCourse.assignments.length === 0 ? (
                            <p className="text-sm text-slate-500 py-4 italic">Belum ada tugas atau ujian untuk kelas ini.</p>
                        ) : (
                            <div className="grid gap-4">
                                {selectedCourse.assignments.map((asgn: any) => {
                                    const isDone = asgn.submissions && asgn.submissions.length > 0
                                    const userSubmission = isDone ? asgn.submissions[0] : null
                                    const type = asgn.type || 'TUGAS'

                                    const typeConfig: any = {
                                        PRAKTIK: { label: "Tugas Praktik / Unjuk Kerja", bg: "bg-cyan-100 text-cyan-800 border-cyan-200" },
                                        PROYEK: { label: "Tugas Proyek / Portofolio", bg: "bg-purple-100 text-purple-800 border-purple-200" },
                                        SUMATIF: { label: "Asesmen Sumatif KKTP", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" },
                                        UJIAN: { label: "Ujian Resmi / PTS / PAS", bg: "bg-rose-100 text-rose-800 border-rose-200" },
                                        TUGAS: { label: "Tugas Harian", bg: "bg-slate-100 text-slate-800 border-slate-200" }
                                    }
                                    const currentConfig = typeConfig[type] || typeConfig.TUGAS

                                    return (
                                        <div key={asgn.id} className={`p-5 rounded-3xl border space-y-3 ${isDone ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200'}`}>
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${currentConfig.bg}`}>
                                                        {currentConfig.label}
                                                    </span>
                                                    {asgn.kktp && (
                                                        <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                                                            KKTP: {asgn.kktp}
                                                        </span>
                                                    )}
                                                    {isDone ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                                            <CheckCircle2 className="h-3.5 w-3.5" /> Sudah Dikumpulkan
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                                                            <Clock className="h-3.5 w-3.5" /> Belum Dikerjakan
                                                        </span>
                                                    )}
                                                </div>

                                                {asgn.dueDate && (
                                                    <span className="text-[11px] text-slate-500 font-medium">
                                                        Tenggat: {new Date(asgn.dueDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                                    </span>
                                                )}
                                            </div>

                                            <div>
                                                <h4 className="font-bold text-slate-900 text-base sm:text-lg">{asgn.title}</h4>
                                                {asgn.description && (
                                                    <p className="text-sm text-slate-700 mt-1 whitespace-pre-line bg-slate-50 p-3 rounded-2xl border border-slate-100">{asgn.description}</p>
                                                )}
                                            </div>

                                            {asgn.rubric && (
                                                <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-2xl text-xs space-y-1">
                                                    <span className="font-bold text-amber-900 uppercase block">Rubrik / Kriteria Penilaian Praktik:</span>
                                                    <p className="text-amber-800 whitespace-pre-line">{asgn.rubric}</p>
                                                </div>
                                            )}

                                            {asgn.questionFileUrl && (
                                                <div className="pt-1 flex flex-wrap items-center gap-2">
                                                    <button
                                                        onClick={() => setActiveQuestionPdfId(activeQuestionPdfId === asgn.id ? null : asgn.id)}
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3.5 py-2 rounded-xl border border-indigo-200 transition-colors"
                                                    >
                                                        <FileText className="h-4 w-4 text-indigo-600" />
                                                        {activeQuestionPdfId === asgn.id ? "Sembunyikan Panduan / Soal PDF" : "Buka & Baca Panduan / Soal PDF"}
                                                    </button>
                                                    <a
                                                        href={asgn.questionFileUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-xs text-indigo-600 hover:underline font-semibold"
                                                    >
                                                        Buka Tab Baru &rarr;
                                                    </a>
                                                </div>
                                            )}

                                            {asgn.questionFileUrl && activeQuestionPdfId === asgn.id && (
                                                <div className="mt-2 border-t pt-2 space-y-2">
                                                    <iframe
                                                        src={asgn.questionFileUrl}
                                                        className="w-full h-[450px] rounded-2xl border border-slate-300 shadow-inner bg-slate-100"
                                                        title={asgn.title}
                                                    />
                                                </div>
                                            )}

                                            <div className="mt-3 pt-3 border-t">
                                                {isDone ? (
                                                    <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs space-y-2.5 shadow-sm">
                                                        <div className="flex justify-between items-center border-b pb-2">
                                                            <span className="font-bold text-slate-700 uppercase">Status Pengumpulan Kamu</span>
                                                            <span className="text-slate-400 font-medium">{new Date(userSubmission.createdAt).toLocaleString('id-ID')}</span>
                                                        </div>

                                                        {userSubmission.content && (
                                                            <div>
                                                                <span className="font-semibold text-slate-500 block mb-0.5">Catatan / Jawaban Teks:</span>
                                                                <p className="text-slate-800 bg-slate-50 p-2.5 rounded-xl border whitespace-pre-line">{userSubmission.content}</p>
                                                            </div>
                                                        )}

                                                        <div className="flex flex-wrap gap-2 pt-1">
                                                            {userSubmission.fileUrl && (
                                                                <a
                                                                    href={userSubmission.fileUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    download
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl border border-indigo-200 hover:bg-indigo-100 transition-colors"
                                                                >
                                                                    <FileText className="h-4 w-4 text-indigo-600" /> Buka / Download File Terunggah
                                                                </a>
                                                            )}
                                                            {userSubmission.linkUrl && (
                                                                <a
                                                                    href={userSubmission.linkUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 text-cyan-700 font-bold rounded-xl border border-cyan-200 hover:bg-cyan-100 transition-colors"
                                                                >
                                                                    <ExternalLink className="h-3.5 w-3.5" /> Buka Link Repo / Demo
                                                                </a>
                                                            )}
                                                        </div>

                                                        {userSubmission.score !== null && userSubmission.score !== undefined ? (
                                                            <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                                                <div>
                                                                    <span className="text-xs font-bold text-emerald-900 block">NILAI DARI GURU:</span>
                                                                    {userSubmission.feedback && (
                                                                        <p className="text-xs text-emerald-800 italic mt-0.5">Catatan Guru: "{userSubmission.feedback}"</p>
                                                                    )}
                                                                </div>
                                                                <div className="text-2xl font-black text-emerald-700 bg-white px-4 py-1 rounded-xl border border-emerald-200 shadow-sm">
                                                                    {userSubmission.score} <span className="text-xs font-semibold text-slate-400">/ {asgn.maxScore || 100}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="mt-2 text-amber-700 text-[11px] font-semibold bg-amber-50 p-2 rounded-xl border border-amber-200 text-center">
                                                                Tugas berhasil terkirim. Menunggu pemeriksaan dan penilaian dari guru.
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div>
                                                        {submittingAssignmentId === asgn.id ? (
                                                            <div className="space-y-3 bg-emerald-50/60 p-4 sm:p-5 rounded-2xl border border-emerald-200">
                                                                <h5 className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                                                                    <Send className="h-4 w-4 text-emerald-600" /> Form Pengumpulan Tugas & Praktik
                                                                </h5>

                                                                <div>
                                                                    <label className="block text-xs font-bold text-emerald-900 uppercase mb-1">Catatan / Jawaban Teks (Opsional)</label>
                                                                    <textarea
                                                                        rows={3}
                                                                        placeholder="Ketik ringkasan laporan praktik atau jawaban teks di sini..."
                                                                        value={answerText}
                                                                        onChange={(e) => setAnswerText(e.target.value)}
                                                                        className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-emerald-500 bg-white"
                                                                    ></textarea>
                                                                </div>

                                                                <div>
                                                                    <label className="block text-xs font-bold text-emerald-900 uppercase mb-1">Upload File Hasil Praktik / Lembar Jawaban (ZIP / PDF / Dokumentasi / Kode)</label>
                                                                    <input
                                                                        type="file"
                                                                        accept=".zip,.pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.py,.html,.css,.js,.cpp,.txt"
                                                                        onChange={(e) => setSubmissionFile(e.target.files ? e.target.files[0] : null)}
                                                                        className="w-full p-2 border rounded-xl text-xs bg-white file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200"
                                                                    />
                                                                    <p className="text-[11px] text-slate-500 mt-1">Format: ZIP, PDF, Word, PowerPoint, Gambar, Kode Program.</p>
                                                                </div>

                                                                <div>
                                                                    <label className="block text-xs font-bold text-emerald-900 uppercase mb-1">Link Demo / Repository (GitHub, Drive, YouTube - Opsional)</label>
                                                                    <input
                                                                        type="url"
                                                                        placeholder="https://github.com/... atau https://drive.google.com/..."
                                                                        value={submissionLinkText}
                                                                        onChange={(e) => setSubmissionLinkText(e.target.value)}
                                                                        className="w-full p-2.5 border rounded-xl text-xs bg-white"
                                                                    />
                                                                </div>

                                                                {submitSuccess && (
                                                                    <div className="p-2.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl text-center border border-emerald-300">
                                                                        Jawaban & Berkas Praktik Berhasil Dikirim!
                                                                    </div>
                                                                )}

                                                                <div className="flex gap-2 justify-end pt-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setSubmittingAssignmentId(null)}
                                                                        className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                                                                    >
                                                                        Batal
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSubmitAnswer(asgn.id)}
                                                                        disabled={loading || (!answerText.trim() && !submissionFile && !submissionLinkText.trim())}
                                                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
                                                                    >
                                                                        <Send className="h-4 w-4" /> Kirim Tugas / Hasil Praktik
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setSubmittingAssignmentId(asgn.id)
                                                                    setAnswerText('')
                                                                    setSubmissionLinkText('')
                                                                    setSubmissionFile(null)
                                                                }}
                                                                className="inline-flex items-center gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow"
                                                            >
                                                                <Send className="h-4 w-4" /> Kerjakan / Unggah Hasil Praktik
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-emerald-600" />
                        Mata Pelajaran Saya
                    </h2>

                    {courses.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-dashed">
                            <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                            <h3 className="text-lg font-bold text-slate-800">Belum Ada Kelas Aktif</h3>
                            <p className="text-sm text-slate-500 mt-1">Anda belum terdaftar di mata pelajaran apa pun untuk kelas {studentData.class}.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {courses.map(course => (
                                <div
                                    key={course.id}
                                    onClick={() => setSelectedCourse(course)}
                                    className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between group"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                                                {course.academicYear?.name || "Tahun Aktif"}
                                            </span>
                                            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                                            {course.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">Guru: {course.teacher?.name}</p>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-600 font-medium">
                                        <span>{course.modules.length} Modul Materi</span>
                                        <span>{course.assignments.length} Tugas/Ujian</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

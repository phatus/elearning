'use client'

import { useState } from "react"
import { X, Save, AlertCircle } from "lucide-react"
import { createElearningCourse, updateElearningCourse } from "@/actions/elearning"

interface CourseFormProps {
    isOpen: boolean
    onClose: () => void
    session?: any
    teachers: { id: number; name: string }[]
    academicYears: { id: number; name: string }[]
    availableClasses: string[]
    editingCourse: any | null
}

export default function CourseForm({
    isOpen,
    onClose,
    session,
    teachers,
    academicYears,
    availableClasses,
    editingCourse
}: CourseFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedClasses, setSelectedClasses] = useState<string[]>(
        editingCourse?.targetClass ? [editingCourse.targetClass] : []
    )

    if (!isOpen) return null

    // Automatically match logged in teacher
    const defaultTeacher = teachers.find(t => 
        (session?.id && t.id === session.id) || (session?.name && t.name.toLowerCase() === session.name.toLowerCase())
    )
    const defaultTeacherId = editingCourse?.teacherId || defaultTeacher?.id || ""

    const toggleClass = (cls: string) => {
        setSelectedClasses(prev => 
            prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
        )
    }

    const toggleSelectAllClasses = () => {
        if (selectedClasses.length === availableClasses.length) {
            setSelectedClasses([])
        } else {
            setSelectedClasses([...availableClasses])
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        formData.set('isActive', (formData.get('isActive') === 'on').toString())

        // Attach selected classes for multi-class creation
        formData.delete('targetClasses')
        selectedClasses.forEach(cls => {
            formData.append('targetClasses', cls)
        })

        try {
            const res = editingCourse 
                ? await updateElearningCourse(editingCourse.id, formData)
                : await createElearningCourse(formData)
                
            if (res.success) {
                onClose()
            } else {
                setError(res.error || "Terjadi kesalahan")
            }
        } catch (err: any) {
            setError(err.message || "Terjadi kesalahan saat menyimpan data")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between mb-5 border-b pb-4">
                    <h2 className="text-xl font-bold text-slate-800">
                        {editingCourse ? "Edit Mata Pelajaran" : "Mata Pelajaran Baru"}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 flex items-center gap-3 rounded-xl bg-red-50 p-4 text-red-700 text-sm font-medium">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-900">
                            Nama Mata Pelajaran <span className="text-red-500">*</span>
                        </label>
                        <input
                            name="title"
                            type="text"
                            defaultValue={editingCourse?.title || ""}
                            placeholder="Contoh: Matematika"
                            required
                            className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-900">
                            Guru Pengampu (Terkunci Sesuai Akun)
                        </label>
                        <input type="hidden" name="teacherId" value={defaultTeacherId} />
                        <div className="w-full rounded-xl border border-slate-200 bg-slate-100 p-3 text-slate-700 text-sm font-semibold flex items-center justify-between">
                            <span>{defaultTeacher?.name || session?.name || "Guru Terautentikasi"}</span>
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase">Akun Terkunci</span>
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-900">
                            Tahun Ajaran <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="academicYearId"
                            defaultValue={editingCourse?.academicYearId || ""}
                            required
                            className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                        >
                            <option value="">-- Pilih Tahun Ajaran --</option>
                            {academicYears.map(year => (
                                <option key={year.id} value={year.id}>
                                    {year.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-semibold text-slate-900">
                                Target Kelas Siswa (Bisa Pilih Banyak Kelas)
                            </label>
                            {!editingCourse && availableClasses.length > 0 && (
                                <button
                                    type="button"
                                    onClick={toggleSelectAllClasses}
                                    className="text-xs text-indigo-600 font-semibold hover:underline"
                                >
                                    {selectedClasses.length === availableClasses.length ? "Hapus Semua" : "Pilih Semua"}
                                </button>
                            )}
                        </div>

                        {editingCourse ? (
                            <select
                                name="targetClass"
                                defaultValue={editingCourse?.targetClass || ""}
                                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                            >
                                <option value="">-- Pilih Kelas (Opsional) --</option>
                                {availableClasses.map(cls => (
                                    <option key={cls} value={cls}>
                                        Kelas {cls}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-3 border border-slate-200 rounded-2xl bg-slate-50">
                                {availableClasses.map(cls => {
                                    const isChecked = selectedClasses.includes(cls)
                                    return (
                                        <label
                                            key={cls}
                                            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                                                isChecked
                                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => toggleClass(cls)}
                                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                            />
                                            Kelas {cls}
                                        </label>
                                    )
                                })}
                                {availableClasses.length === 0 && (
                                    <p className="col-span-full text-xs text-slate-500 py-2 text-center">Belum ada data kelas siswa.</p>
                                )}
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Semua siswa aktif di kelas yang dipilih akan otomatis terdaftar di mata pelajaran.</p>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-900">
                            Deskripsi Singkat
                        </label>
                        <textarea
                            name="description"
                            defaultValue={editingCourse?.description || ""}
                            rows={3}
                            placeholder="Deskripsi mata pelajaran..."
                            className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500 text-sm resize-none"
                        ></textarea>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                        <input 
                            type="checkbox" 
                            name="isActive" 
                            id="isActive" 
                            defaultChecked={editingCourse ? editingCourse.isActive : true}
                            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-slate-900 cursor-pointer">
                            Status Aktif (Ditampilkan ke Siswa)
                        </label>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? (
                                "Menyimpan..."
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Simpan Pelajaran
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserCheck, Lock, User, AlertCircle, ShieldCheck } from 'lucide-react'
import { loginTeacherAction } from '@/actions/auth'

export default function LoginGuruClient() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const res = await loginTeacherAction(formData)

        if (res.success) {
            router.push('/guru')
            router.refresh()
        } else {
            setError(res.error || "Gagal masuk")
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="text-center space-y-2">
                <div className="h-16 w-16 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <UserCheck className="h-8 w-8" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Masuk Portal Guru & RDM</h1>
                <p className="text-xs text-slate-500">Masukkan NIP / Nama Guru dan Password untuk mengelola modul & tugas</p>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2 border border-red-100">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">NIP / Nama Guru *</label>
                    <div className="relative">
                        <input
                            name="nip"
                            type="text"
                            required
                            placeholder="Ketik NIP atau Nama Anda"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 text-sm"
                        />
                        <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Password Guru *</label>
                    <div className="relative">
                        <input
                            name="password"
                            type="password"
                            required
                            placeholder="Masukkan Password"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 text-sm"
                        />
                        <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <ShieldCheck className="h-5 w-5" />
                    {isLoading ? "Verifikasi Kredensial..." : "Masuk Ke Kelola Guru"}
                </button>
            </form>
        </div>
    )
}

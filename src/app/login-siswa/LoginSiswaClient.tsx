'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, Lock, KeyRound, AlertCircle, ShieldCheck } from 'lucide-react'
import { loginStudentAction } from '@/actions/auth'

export default function LoginSiswaClient() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const res = await loginStudentAction(formData)

        if (res.success) {
            router.push('/siswa')
            router.refresh()
        } else {
            setError(res.error || "Gagal masuk")
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="text-center space-y-2">
                <div className="h-16 w-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <GraduationCap className="h-8 w-8" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Masuk Portal Siswa</h1>
                <p className="text-xs text-slate-500">Masukkan NIS dan PIN / Password Anda untuk mengakses E-Learning</p>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2 border border-red-100">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Nomor Induk Siswa (NIS) *</label>
                    <div className="relative">
                        <input
                            name="nis"
                            type="text"
                            required
                            placeholder="Contoh: 240181"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 text-sm"
                        />
                        <KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Password / PIN Siswa *</label>
                    <div className="relative">
                        <input
                            name="password"
                            type="password"
                            required
                            placeholder="Masukkan PIN / Password"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 text-sm"
                        />
                        <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Gunakan kata sandi yang telah Anda buat atau tanyakan ke Admin jika lupa.</p>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <ShieldCheck className="h-5 w-5" />
                    {isLoading ? "Verifikasi Kredensial..." : "Masuk Ke Ruang Belajar"}
                </button>
            </form>
        </div>
    )
}

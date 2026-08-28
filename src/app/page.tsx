import Link from 'next/link'
import { GraduationCap, UserCheck, BookOpen, Download, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="space-y-16 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-8 md:p-12 text-white shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-emerald-100 border border-white/30">
            <Sparkles className="h-4 w-4" /> Platform Resmi E-Learning MTsN 1 Pacitan
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Belajar Mudah, Interaktif & Terintegrasi
          </h1>
          <p className="text-emerald-100 text-base md:text-lg">
            Sistem pembelajaran online mandiri MTsN 1 Pacitan yang tersinkronisasi langsung dengan data siswa dan format Rapor Digital Madrasah (RDM).
          </p>
          <div className="pt-4 flex flex-wrap gap-4">
            <Link
              href="/siswa"
              className="px-6 py-3.5 bg-white text-emerald-800 font-bold rounded-2xl shadow-lg hover:bg-emerald-50 hover:scale-105 transition-all flex items-center gap-2"
            >
              <GraduationCap className="h-5 w-5" /> Portal Masuk Siswa
            </Link>
            <Link
              href="/guru"
              className="px-6 py-3.5 bg-emerald-900/40 text-white font-semibold rounded-2xl border border-white/30 hover:bg-emerald-900/60 transition-all flex items-center gap-2"
            >
              <UserCheck className="h-5 w-5" /> Portal Kelola Guru / RDM
            </Link>
            <Link
              href="/admin"
              className="px-6 py-3.5 bg-purple-900/40 text-white font-semibold rounded-2xl border border-white/30 hover:bg-purple-900/60 transition-all flex items-center gap-2"
            >
              <ShieldCheck className="h-5 w-5" /> Portal Admin
            </Link>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <BookOpen className="w-96 h-96" />
        </div>
      </div>

      {/* Main Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Siswa Card */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
          <div className="h-16 w-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Portal Ruang Siswa</h2>
          <p className="text-slate-600 mt-2 mb-6 text-sm leading-relaxed">
            Masuk dengan NIS (Nomor Induk Siswa) Anda untuk mengakses materi pembelajaran, video, dan mengumpulkan tugas harian.
          </p>

          <ul className="space-y-2.5 mb-8 text-sm text-slate-700">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Cukup Masuk dengan NIS
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Tampilan Mudah & Ringan di Layar HP
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Poin XP & Lencana Belajar Interaktif
            </li>
          </ul>

          <Link
            href="/siswa"
            className="block text-center py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition-colors"
          >
            Masuk Portal Siswa &rarr;
          </Link>
        </div>

        {/* Guru Card */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
          <div className="h-16 w-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <UserCheck className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Portal Guru & Export RDM</h2>
          <p className="text-slate-600 mt-2 mb-6 text-sm leading-relaxed">
            Kelola materi pelajaran, tugaskan ujian dengan kriteria KKTP, serta unduh rekapan nilai ke format Excel RDM.
          </p>

          <ul className="space-y-2.5 mb-8 text-sm text-slate-700">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-600" /> Otomatis Sinkron Data Siswa Per Kelas
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-600" /> Ekspor Format Excel Template Nilai Sumatif RDM
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-600" /> Upload Modul Teks, Video YouTube/Lokal & PDF
            </li>
          </ul>

          <Link
            href="/guru"
            className="block text-center py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-md transition-colors"
          >
            Kelola Mata Pelajaran Guru &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}

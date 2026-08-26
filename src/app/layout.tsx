import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, GraduationCap, UserCheck } from 'lucide-react'
import SyncButton from '@/components/SyncButton'
import './globals.css'

export const metadata: Metadata = {
  title: 'E-Learning MTsN 1 Pacitan',
  description: 'Aplikasi E-Learning Mandiri MTsN 1 Pacitan tersinkronisasi otomatis dengan data madrasah.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-0 min-h-[4rem] flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-md group-hover:scale-105 transition-transform shrink-0">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <span className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight block leading-tight">
                  MTsN 1 Pacitan
                </span>
                <span className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold tracking-wider uppercase block">
                  E-Learning
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-1.5 sm:gap-2.5">
              <SyncButton />
              
              <Link
                href="/siswa"
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors flex items-center gap-1 shrink-0"
              >
                <GraduationCap className="h-4 w-4 shrink-0" />
                <span className="hidden xs:inline sm:inline">Portal </span>Siswa
              </Link>
              <Link
                href="/guru"
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1 shrink-0"
              >
                <UserCheck className="h-4 w-4 shrink-0" />
                <span className="hidden xs:inline sm:inline">Portal </span>Guru
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-grow">{children}</main>

        <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-center text-sm">
          <div className="max-w-7xl mx-auto px-4">
            <p>© {new Date().getFullYear()} MTsN 1 Pacitan. E-Learning Web Application.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}

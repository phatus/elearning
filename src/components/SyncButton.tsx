'use client'

import { useState } from "react"
import { RefreshCw, CheckCircle2 } from "lucide-react"
import { syncDataFromWebMadrasah } from "@/actions/elearning"

export default function SyncButton({ className = "" }: { className?: string }) {
    const [isSyncing, setIsSyncing] = useState(false)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)

    const handleSync = async () => {
        setIsSyncing(true)
        setStatusMessage(null)
        try {
            const res = await syncDataFromWebMadrasah()
            if (res.success) {
                setStatusMessage(`Sinkron Berhasil! (${res.studentsCount} Siswa)`)
                setTimeout(() => setStatusMessage(null), 3500)
            } else {
                alert(res.error || "Gagal melakukan sinkronisasi")
            }
        } catch (error: any) {
            alert("Error: " + error.message)
        } finally {
            setIsSyncing(false)
        }
    }

    return (
        <div className="relative inline-block">
            <button
                onClick={handleSync}
                disabled={isSyncing}
                className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-all shadow-sm disabled:opacity-50 ${className}`}
                title="Tarik data siswa & guru terbaru dari WebMadrasah"
            >
                <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-700 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">{isSyncing ? "Menyinkronkan..." : "Sinkron Data Madrasah"}</span>
                <span className="md:hidden">{isSyncing ? "Sync..." : "Sinkron"}</span>
            </button>

            {statusMessage && (
                <div className="absolute right-0 top-12 z-50 whitespace-nowrap bg-emerald-900 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-xl border border-emerald-700 flex items-center gap-1.5 animate-fade-in">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    {statusMessage}
                </div>
            )}
        </div>
    )
}

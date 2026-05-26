"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart3, LayoutDashboard, Search, Zap } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Navigation */}
      <header className="px-6 md:px-12 py-4 flex items-center justify-between sticky top-0 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md z-50 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">ApplyFlowPH</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/dashboard">
            <Button className="rounded-full px-6 font-medium shadow-md hover:shadow-lg transition-all bg-blue-600 hover:bg-blue-700 text-white">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 md:py-32 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-400/20 dark:bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-400/20 dark:bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium mb-4">
            <Zap size={16} /> <span>The #1 Job Application Tracker</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Land your dream job <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">
              faster and smarter.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Stop losing track of your applications in messy spreadsheets. ApplyFlowPH is a premium tracking platform that organizes your job hunt, gives you actionable insights, and keeps you motivated.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/dashboard">
              <Button size="lg" className="rounded-full px-8 h-14 text-base font-semibold shadow-xl shadow-blue-500/20 hover:scale-105 transition-all w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                Start Tracking for Free <ArrowRight className="ml-2" size={18} />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Preview */}
        <div className="w-full max-w-6xl mx-auto mt-24 grid md:grid-cols-3 gap-6 relative z-10">
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-shadow text-left group">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform">
              <LayoutDashboard size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Kanban & List Views</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Drag and drop your applications across different stages. Visualize your progress perfectly whether you prefer tables or boards.</p>
          </div>
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-shadow text-left group">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
              <BarChart3 size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Smart Analytics</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Understand your success rate. See exactly which platforms get you the most interviews with our beautiful built-in charts.</p>
          </div>
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-shadow text-left group">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
              <Search size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Lightning Fast</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Powered by Next.js and Supabase. Filter, search, and update thousands of applications in milliseconds without breaking a sweat.</p>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm border-t border-slate-200/50 dark:border-slate-800/50 relative z-10">
        &copy; {new Date().getFullYear()} ApplyFlowPH. Track better, hire faster.
      </footer>
    </div>
  )
}

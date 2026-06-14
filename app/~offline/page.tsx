import { Zap } from "lucide-react"

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 text-center">
      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
        <Zap size={32} />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">You are offline</h1>
      <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8">
        Don't worry! ApplyFlow is a local-first app. Once you connect to the internet, we will sync your changes automatically.
      </p>
      <button 
        onClick={() => window.location.reload()} 
        className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  )
}

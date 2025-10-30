import { Activity, RefreshCw, Clock } from 'lucide-react'

export default function Header({ onRefresh, isRefreshing, lastUpdate }) {
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }

  return (
    <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-white">Developers Dashboard</h1>
              <p className="text-sm text-slate-400">Local Development Environment</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-400 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Last update: {formatTime(lastUpdate)}
            </div>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

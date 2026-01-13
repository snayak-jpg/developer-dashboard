import { CheckCircle2, XCircle, AlertCircle, Activity, Loader2 } from 'lucide-react'

export default function Stats({ stats, total, loading = 0 }) {
  const loaded = stats.healthy + stats.unhealthy + stats.error

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">Total Services</p>
            <p className="text-3xl font-bold text-white mt-1">{total}</p>
          </div>
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6 text-blue-500" />
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">Healthy</p>
            <p className="text-3xl font-bold text-green-500 mt-1">
              {stats.healthy}
              {loading > 0 && <span className="text-sm text-slate-500 ml-2">/{loaded + loading}</span>}
            </p>
          </div>
          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">Unhealthy</p>
            <p className="text-3xl font-bold text-red-500 mt-1">{stats.unhealthy}</p>
          </div>
          <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-500" />
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">Errors</p>
            <p className="text-3xl font-bold text-yellow-500 mt-1">{stats.error}</p>
          </div>
          <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-yellow-500" />
          </div>
        </div>
      </div>

      {loading > 0 && (
        <div className="bg-slate-800 rounded-lg p-6 border border-blue-500/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Checking</p>
              <p className="text-3xl font-bold text-blue-400 mt-1">{loading}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

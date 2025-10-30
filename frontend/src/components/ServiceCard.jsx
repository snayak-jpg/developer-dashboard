import { useState } from 'react'
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, AlertCircle, GitBranch, ExternalLink } from 'lucide-react'

export default function ServiceCard({ service }) {
  const [expanded, setExpanded] = useState(false)

  // Extract PL-##### pattern from branch name for Jira links
  const extractJiraTicket = (branchName) => {
    const match = branchName.match(/PL-\d{5}/)
    return match ? match[0] : branchName
  }

  const getStatusIcon = (status) => {
    if (status === 'healthy') return <CheckCircle2 className="w-5 h-5 text-green-500" />
    if (status === 'unhealthy') return <XCircle className="w-5 h-5 text-red-500" />
    if (status === 'no-check') return <GitBranch className="w-5 h-5 text-slate-500" />
    return <AlertCircle className="w-5 h-5 text-yellow-500" />
  }

  const getStatusColor = (status) => {
    if (status === 'healthy') return 'border-green-500 bg-green-500/10'
    if (status === 'unhealthy') return 'border-red-500 bg-red-500/10'
    if (status === 'no-check') return 'border-slate-600 bg-slate-600/10'
    return 'border-yellow-500 bg-yellow-500/10'
  }

  const getStatusBadge = (status) => {
    if (status === 'healthy') return 'bg-green-500/20 text-green-400'
    if (status === 'unhealthy') return 'bg-red-500/20 text-red-400'
    if (status === 'no-check') return 'bg-slate-500/20 text-slate-400'
    return 'bg-yellow-500/20 text-yellow-400'
  }

  const hasUnhealthyDependencies = service.dependencies?.some(dep => dep.status !== 'healthy')

  return (
    <div className={`bg-slate-800 rounded-lg border ${getStatusColor(service.status)} transition-all`}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            {service.hasGitRepo && service.gitBranch ? (
              <a
                href={`https://github.com/methodcrm/${service.repoName}/tree/${service.gitBranch}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold text-white hover:text-blue-400 transition-colors inline-block underline decoration-slate-600 hover:decoration-blue-400"
              >
                {service.id}
              </a>
            ) : (
              <h3 className="text-lg font-semibold text-white">{service.id}</h3>
            )}
            {service.hasGitRepo && service.gitBranch && (
              <div className="flex items-center gap-2 mt-1">
                <GitBranch className="w-3 h-3 text-slate-400" />
                {service.gitBranch === 'master' || service.gitBranch === 'main' ? (
                  <span className="text-xs text-slate-400">{service.gitBranch}</span>
                ) : (
                  <a
                    href={`https://method.atlassian.net/browse/${extractJiraTicket(service.gitBranch)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1 transition-colors"
                  >
                    {service.gitBranch}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>
          {service.status !== 'no-check' && (
            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(service.status)}`}>
              {service.status}
            </span>
          )}
        </div>

        {service.error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded p-2 mb-3">
            <p className="text-xs text-red-400">{service.error}</p>
          </div>
        )}

        {service.dependencies && service.dependencies.length > 0 && (
          <div className="mb-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              Dependencies ({service.dependencies.length})
              {hasUnhealthyDependencies && (
                <span className="ml-1 text-red-400 text-xs">({service.dependencies.filter(d => d.status !== 'healthy').length} issues)</span>
              )}
            </button>

            {expanded && (
              <div className="mt-2 space-y-1 ml-6">
                {service.dependencies.map((dep, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-slate-900/50 rounded p-2">
                    <div className="flex items-center gap-2">
                      {dep.status === 'healthy' ? (
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-500" />
                      )}
                      <span className="text-slate-300">{dep.name}</span>
                      {dep.type && <span className="text-slate-500">({dep.type})</span>}
                    </div>
                    {dep.timeMs !== undefined && (
                      <span className="text-slate-500">{dep.timeMs.toFixed(0)}ms</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

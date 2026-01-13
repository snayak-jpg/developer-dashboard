import { useState } from 'react'
import { Hammer, Trash2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import RebuildModal from './RebuildModal'

export default function ActionButtons() {
  const [showRebuildModal, setShowRebuildModal] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const clearRedisMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/global/clear-redis', {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to clear Redis')
      return response.json()
    },
    onSuccess: () => {
      setShowResult(true)
      setTimeout(() => setShowResult(false), 3000)
    }
  })

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setShowRebuildModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm font-medium"
          >
            <Hammer className="w-4 h-4" />
            Rebuild Runtime-Core
          </button>

          <button
            onClick={() => clearRedisMutation.mutate()}
            disabled={clearRedisMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            {clearRedisMutation.isPending ? 'Clearing...' : 'Clear Redis Cache'}
          </button>

          {showResult && clearRedisMutation.data && (
            <div className={`text-sm px-3 py-2 rounded ${clearRedisMutation.data.success ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}>
              {clearRedisMutation.data.message}
            </div>
          )}
        </div>
      </div>

      <RebuildModal
        isOpen={showRebuildModal}
        onClose={() => setShowRebuildModal(false)}
      />
    </>
  )
}

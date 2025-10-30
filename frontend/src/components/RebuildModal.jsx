import { useState } from 'react'
import { X, Coffee, Check, AlertCircle, Loader2 } from 'lucide-react'

export default function RebuildModal({ isOpen, onClose }) {
  const [isRebuilding, setIsRebuilding] = useState(false)
  const [steps, setSteps] = useState([
    { id: 1, name: 'Stop IIS', status: 'pending', message: '', output: '' },
    { id: 2, name: 'Clean Solution', status: 'pending', message: '', output: '' },
    { id: 3, name: 'Build Solution', status: 'pending', message: '', output: '' },
    { id: 4, name: 'Restart IIS', status: 'pending', message: '', output: '' }
  ])
  const [isComplete, setIsComplete] = useState(false)
  const [hasError, setHasError] = useState(false)

  const startRebuild = async () => {
    setIsRebuilding(true)
    setIsComplete(false)
    setHasError(false)
    setSteps(steps.map(s => ({ ...s, status: 'pending', message: '', output: '' })))

    try {
      const response = await fetch('/api/global/rebuild-runtime-core', {
        method: 'POST'
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            const progress = JSON.parse(line)

            if (progress.step === 5 && progress.status === 'complete') {
              setIsComplete(true)
              setIsRebuilding(false)
              continue
            }

            setSteps(prev => prev.map(step => {
              if (step.id === progress.step) {
                return {
                  ...step,
                  status: progress.status,
                  message: progress.message,
                  output: progress.output
                }
              }
              return step
            }))

            if (progress.status === 'error') {
              setHasError(true)
              setIsRebuilding(false)
            }
          } catch (e) {
            console.error('Failed to parse progress:', e)
          }
        }
      }
    } catch (error) {
      console.error('Rebuild error:', error)
      setHasError(true)
      setIsRebuilding(false)
    }
  }

  const getStepIcon = (status) => {
    if (status === 'success') return <Check className="w-5 h-5 text-green-500" />
    if (status === 'error') return <AlertCircle className="w-5 h-5 text-red-500" />
    if (status === 'running') return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
    return <div className="w-5 h-5 rounded-full border-2 border-slate-600" />
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Rebuild Runtime-Core</h2>
            <p className="text-sm text-slate-400 mt-1">C:\MethodDev\runtime-core\runtime-stack.sln</p>
          </div>
          {!isRebuilding && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {!isRebuilding && !isComplete && !hasError && (
            <div className="text-center py-8">
              <Coffee className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Ready to rebuild?</h3>
              <p className="text-slate-400 mb-6">This process will stop IIS, clean and build the solution, then restart IIS.</p>
              <p className="text-sm text-yellow-400 mb-6">
                ⚠ This may take a few minutes. Grab a coffee!
              </p>
              <button
                onClick={startRebuild}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                Start Rebuild
              </button>
            </div>
          )}

          {(isRebuilding || isComplete || hasError) && (
            <div className="space-y-4">
              {isRebuilding && (
                <div className="bg-orange-500/10 border border-orange-500/50 rounded-lg p-4 flex items-center gap-3">
                  <Coffee className="w-6 h-6 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-orange-400">Grab a coffee!</p>
                    <p className="text-xs text-slate-400">This process takes a while...</p>
                  </div>
                </div>
              )}

              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`border rounded-lg p-4 ${
                    step.status === 'success'
                      ? 'border-green-500/50 bg-green-500/10'
                      : step.status === 'error'
                      ? 'border-red-500/50 bg-red-500/10'
                      : step.status === 'running'
                      ? 'border-blue-500/50 bg-blue-500/10'
                      : 'border-slate-700 bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getStepIcon(step.status)}
                    <div className="flex-1">
                      <p className="font-medium text-white">{step.name}</p>
                      {step.message && (
                        <p className={`text-sm mt-1 ${
                          step.status === 'error' ? 'text-red-400' : 'text-slate-400'
                        }`}>
                          {step.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {step.output && (
                    <div className="mt-3">
                      <details className="text-xs">
                        <summary className="cursor-pointer text-slate-500 hover:text-slate-400">
                          View output
                        </summary>
                        <pre className="mt-2 p-2 bg-slate-950 rounded text-slate-300 overflow-auto max-h-40">
                          {step.output}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              ))}

              {isComplete && (
                <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 text-center">
                  <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-lg font-medium text-green-400">Rebuild Complete!</p>
                  <p className="text-sm text-slate-400 mt-1">Runtime-core has been successfully rebuilt</p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}

              {hasError && !isRebuilding && (
                <div className="mt-4 text-center">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, AlertCircle } from 'lucide-react'
import ServiceCard from './components/ServiceCard'
import Header from './components/Header'
import Stats from './components/Stats'
import ActionButtons from './components/ActionButtons'

function App() {
  // Fetch service metadata immediately (no health checks)
  const { data: servicesMetadata, isLoading: metadataLoading, error: metadataError, refetch: refetchMetadata } = useQuery({
    queryKey: ['services-metadata'],
    queryFn: async () => {
      const response = await fetch('/api/services')
      if (!response.ok) throw new Error('Failed to fetch services')
      return response.json()
    },
    refetchInterval: 300000, // 5 minutes
    staleTime: 60000 // 1 minute
  })

  // Track individual service health states
  const [servicesHealth, setServicesHealth] = useState({})
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Fetch health for a single service
  const fetchServiceHealth = async (serviceId) => {
    try {
      setServicesHealth(prev => ({
        ...prev,
        [serviceId]: { ...prev[serviceId], loading: true }
      }))

      const response = await fetch(`/api/services/${serviceId}/health`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const healthData = await response.json()

      setServicesHealth(prev => ({
        ...prev,
        [serviceId]: {
          ...healthData,
          loading: false,
          error: null
        }
      }))
    } catch (error) {
      setServicesHealth(prev => ({
        ...prev,
        [serviceId]: {
          loading: false,
          error: error.message,
          status: 'error'
        }
      }))
    }
  }

  // Staggered health checks with 100ms delay
  useEffect(() => {
    if (!servicesMetadata) return

    const fetchAllHealth = async () => {
      for (let i = 0; i < servicesMetadata.length; i++) {
        const service = servicesMetadata[i]
        // Only fetch health for services with URLs
        if (service.url && service.type !== 'no-health-check') {
          setTimeout(() => {
            fetchServiceHealth(service.id)
          }, i * 100) // 100ms stagger
        }
      }
    }

    fetchAllHealth()
  }, [servicesMetadata, refreshTrigger])

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
    refetchMetadata()
  }, [refetchMetadata])

  // Merge metadata with health data
  const services = servicesMetadata?.map(meta => ({
    ...meta,
    ...(servicesHealth[meta.id] || { loading: meta.url && meta.type !== 'no-health-check' })
  }))

  // Separate services into health-checked and non-health-checked
  const gitOnlyServices = services?.filter(s => !s.url || s.type === 'no-health-check') || []
  const healthCheckServices = services?.filter(s => s.url && s.type !== 'no-health-check') || []

  // Stats only for health-checked services that have loaded
  const stats = healthCheckServices.reduce((acc, service) => {
    if (service.loading || !service.status) return acc
    if (service.status === 'healthy') acc.healthy++
    else if (service.status === 'unhealthy') acc.unhealthy++
    else if (service.status === 'error') acc.error++
    return acc
  }, { healthy: 0, unhealthy: 0, error: 0 })

  // Get last update time from most recent health check
  const lastUpdate = Object.values(servicesHealth)
    .map(h => h.lastChecked)
    .filter(Boolean)
    .sort()
    .reverse()[0]

  // Check if any service is currently loading
  const anyLoading = healthCheckServices.some(s => s.loading)

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header
        onRefresh={handleRefresh}
        isRefreshing={anyLoading}
        lastUpdate={lastUpdate}
      />

      <ActionButtons />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {metadataLoading && !services && (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3 text-lg">Loading services...</span>
          </div>
        )}

        {metadataError && !services && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span>Error loading services: {metadataError.message}</span>
          </div>
        )}

        {services && (
          <>
            {/* Git-only services (runtime-core, platform-ui) */}
            {gitOnlyServices.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-300 mb-3">Git Repositories</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gitOnlyServices.map(service => (
                    <ServiceCard key={service.id} service={service} isGitOnly={true} />
                  ))}
                </div>
              </div>
            )}

            {/* Stats for health-checked services */}
            <Stats
              stats={stats}
              total={healthCheckServices.length}
              loading={healthCheckServices.filter(s => s.loading).length}
            />

            {/* Health-checked services */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {healthCheckServices.map(service => (
                <ServiceCard key={service.id} service={service} isGitOnly={false} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default App

import { useQuery } from '@tanstack/react-query'
import { RefreshCw, AlertCircle } from 'lucide-react'
import ServiceCard from './components/ServiceCard'
import Header from './components/Header'
import Stats from './components/Stats'
import ActionButtons from './components/ActionButtons'

function App() {
  const { data: services, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await fetch('/api/services')
      if (!response.ok) throw new Error('Failed to fetch services')
      return response.json()
    }
  })

  const stats = services?.reduce((acc, service) => {
    if (service.status === 'healthy') acc.healthy++
    else if (service.status === 'unhealthy') acc.unhealthy++
    else if (service.status !== 'no-check') acc.error++
    return acc
  }, { healthy: 0, unhealthy: 0, error: 0 }) || { healthy: 0, unhealthy: 0, error: 0 }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        lastUpdate={services?.[0]?.lastChecked}
      />

      <ActionButtons />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Stats stats={stats} total={services?.length || 0} />

        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3 text-lg">Loading services...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span>Error loading services: {error.message}</span>
          </div>
        )}

        {services && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default App

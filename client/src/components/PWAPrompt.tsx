import { useRegisterSW } from 'virtual:pwa-register/react'
import { X } from 'lucide-react'

function PWAPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: string | ServiceWorkerRegistration | undefined) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error: Error | any) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-200 shadow-xl rounded-lg p-4 max-w-sm w-full">
      <button 
        onClick={close}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
      >
        <X size={18} />
      </button>
      
      <div className="mb-3">
        {offlineReady ? (
          <p className="text-sm font-medium text-gray-800">
            App ready to work offline
          </p>
        ) : (
          <p className="text-sm font-medium text-gray-800">
            New content available, click on reload button to update.
          </p>
        )}
      </div>
      
      <div className="flex justify-end gap-2">
        <button
          onClick={close}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          Close
        </button>
        {needRefresh && (
          <button
            onClick={() => updateServiceWorker(true)}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Reload
          </button>
        )}
      </div>
    </div>
  )
}

export default PWAPrompt

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const networkStatus = ref<'online' | 'offline'>('online')
  const updateAvailable = ref(false)

  function setLoading(val: boolean) {
    loading.value = val
  }

  function setError(msg: string | null) {
    error.value = msg
    loading.value = false
  }

  function clearError() {
    error.value = null
  }

  function setNetworkStatus(status: 'online' | 'offline') {
    networkStatus.value = status
  }

  function setUpdateAvailable(val: boolean) {
    updateAvailable.value = val
  }

  return {
    loading,
    error,
    networkStatus,
    updateAvailable,
    setLoading,
    setError,
    clearError,
    setNetworkStatus,
    setUpdateAvailable
  }
})

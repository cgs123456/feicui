import { ref } from 'vue'

export function useLoading(initial = true) {
  const loading = ref(initial)
  const error = ref<string | null>(null)

  function start() {
    loading.value = true
    error.value = null
  }

  function finish() {
    loading.value = false
  }

  function setError(msg: string) {
    error.value = msg
    loading.value = false
  }

  return { loading, error, start, finish, setError }
}

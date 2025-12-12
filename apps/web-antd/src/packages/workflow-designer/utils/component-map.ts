import { ref } from 'vue'
import { workflowApi } from '#/api/workflow'

// 兜底表：兼容未取到组件列表或移植使用时的常用组件名称映射
const fallbackIdToName: Record<string, string> = {
  '1': 'Start',
  '2': 'End',
  '3': 'Answer',
  '4': 'Classifier',
  '5': 'KeywordExtractor',
  '6': 'KnowledgeRetrieval',
  '7': 'DocumentExtractor',
  '8': 'FaqExtractor',
  '9': 'Switcher',
  '10': 'Template',
  '11': 'Dalle3',
  '12': 'TongyiWanx',
  '13': 'Google',
  '14': 'HumanFeedback',
  '15': 'MailSend',
  '16': 'HttpRequest',
}

export function createComponentNameMap() {
  const componentIdToNameMap = ref<Record<string, string>>({ ...fallbackIdToName })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function refresh() {
    loading.value = true
    error.value = null
    try {
      const response = await workflowApi.workflowComponents()
      const components = Array.isArray(response) ? response : (response?.data || [])
      const map: Record<string, string> = { ...fallbackIdToName }
      if (Array.isArray(components)) {
        components.forEach((component: any) => {
          const id = String(component.id)
          map[id] = component.name
        })
      }
      componentIdToNameMap.value = map
    } catch (e: any) {
      error.value = e?.message || 'fetch components failed'
      componentIdToNameMap.value = { ...fallbackIdToName }
    } finally {
      loading.value = false
    }
  }

  function getNameById(workflowComponentId: number | string): string {
    const idStr = String(workflowComponentId)
    return componentIdToNameMap.value[idStr] || fallbackIdToName[idStr] || 'Unknown'
  }

  return { componentIdToNameMap, getNameById, refresh, loading, error }
}

export function getFallbackNameById(workflowComponentId: number | string): string {
  const idStr = String(workflowComponentId)
  return fallbackIdToName[idStr] || 'Unknown'
}


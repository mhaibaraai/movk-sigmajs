export function useCategory() {
  const categories = computed(() => ({
    'getting-started': [
      { id: 'ai', title: 'AI 集成', icon: 'i-lucide-bot' }
    ],
    'components': [
      { id: 'core', title: '核心', icon: 'i-lucide-box' },
      { id: 'controls', title: '控件', icon: 'i-lucide-sliders-horizontal' }
    ],
    'composables': [
      { id: 'base', title: '基础', icon: 'i-lucide-plug' },
      { id: 'interaction', title: '交互', icon: 'i-lucide-mouse-pointer-click' },
      { id: 'analysis', title: '布局与分析', icon: 'i-lucide-network' }
    ]
  }))

  return {
    categories
  }
}

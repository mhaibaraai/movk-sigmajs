export function useHeader() {
  const route = useRoute()

  const desktopLinks = computed(() => [{
    label: '文档',
    to: '/docs/getting-started',
    active: route.path.startsWith('/docs/')
  }, {
    label: '版本发布',
    to: '/releases'
  }])

  const mobileLinks = computed(() => [{
    label: '快速开始',
    icon: 'i-lucide-square-play',
    to: '/docs/getting-started',
    active: route.path.startsWith('/docs/getting-started')
  }, {
    label: '组件',
    icon: 'i-lucide-box',
    to: '/docs/components/graph',
    active: route.path.startsWith('/docs/components')
  }, {
    label: 'Composables',
    icon: 'i-lucide-function-square',
    to: '/docs/composables/use-sigma-camera',
    active: route.path.startsWith('/docs/composables')
  }, {
    label: '工具函数',
    icon: 'i-lucide-wrench',
    to: '/docs/utils/apply-graph-diff',
    active: route.path.startsWith('/docs/utils')
  }, {
    label: '发布版本',
    icon: 'i-lucide-newspaper',
    to: '/releases'
  }])

  return {
    desktopLinks,
    mobileLinks
  }
}

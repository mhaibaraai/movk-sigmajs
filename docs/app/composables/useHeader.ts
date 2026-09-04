export function useHeader() {
  const route = useRoute()

  const isActive = (path: string) => route.path.startsWith(path)

  const desktopLinks = computed(() => [{
    label: '文档',
    to: '/docs/getting-started',
    active: isActive('/docs')
  }, {
    label: '版本发布',
    to: '/releases'
  }])

  const docsNav = [
    { label: '快速开始', icon: 'i-lucide-square-play', slug: 'getting-started' },
    { label: '组件', icon: 'i-lucide-box', slug: 'components' },
    { label: 'Composables', icon: 'i-lucide-square-function', slug: 'composables' },
    { label: '工具函数', icon: 'i-lucide-wrench', slug: 'utils' }
  ]

  const mobileLinks = computed(() => [
    ...docsNav.map(({ label, icon, slug }) => ({
      label,
      icon,
      to: `/docs/${slug}`,
      active: isActive(`/docs/${slug}`)
    })),
    {
      label: '发布版本',
      icon: 'i-lucide-newspaper',
      to: '/releases'
    },
    {
      label: 'GitHub',
      to: 'https://github.com/mhaibaraai/movk-sigmajs',
      icon: 'i-simple-icons-github',
      target: '_blank'
    }
  ])

  return {
    desktopLinks,
    mobileLinks
  }
}

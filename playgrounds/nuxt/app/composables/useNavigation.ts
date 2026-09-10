export interface NavigationLink {
  to: string
  label: string
  icon: string
}

export interface NavigationGroup {
  title: string
  links: NavigationLink[]
}

/** 分组与文案对齐 docs 的 useCategory()，保证 playground 与文档站一一对应 */
export function useNavigation(): NavigationGroup[] {
  return [
    {
      title: '组件',
      links: [
        { to: '/components/core', label: '核心', icon: 'i-lucide-box' },
        { to: '/components/controls', label: '控件', icon: 'i-lucide-sliders-horizontal' }
      ]
    },
    {
      title: 'Composables',
      links: [
        { to: '/composables/base', label: '基础', icon: 'i-lucide-plug' },
        { to: '/composables/interaction', label: '交互', icon: 'i-lucide-mouse-pointer-click' },
        { to: '/composables/analysis', label: '布局与分析', icon: 'i-lucide-network' }
      ]
    },
    {
      title: '工具函数',
      links: [
        { to: '/utils', label: '工具函数', icon: 'i-lucide-wrench' }
      ]
    }
  ]
}

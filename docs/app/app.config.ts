export default defineAppConfig({
  ui: {
    colors: {
      primary: 'rose',
      neutral: 'mist'
    }
  },
  aside: {
    filter: {
      enabled: true
    }
  },
  toaster: {
    position: 'top-center' as const,
    duration: 3000
  },
  aiChat: {
    faqQuestions: {
      'zh-CN': [
        {
          category: '集成与上手',
          items: [
            'Nuxt 4 如何安装并配置 @movk/sigma？',
            'sigma 与 graphology 为什么要自己装？',
            'SSR 下为什么必须动态 import sigma？'
          ]
        },
        {
          category: '数据与渲染',
          items: [
            'data 与 graph 两种传法该怎么选？',
            'styles 怎么把节点属性绑到颜色和大小？',
            '自定义节点形状与渲染原语怎么接？'
          ]
        },
        {
          category: '交互与覆盖层',
          items: [
            'Tooltip / Popover / ContextMenu 怎么选？',
            '怎么做选中与邻域高亮？',
            '控件外观怎么用插槽接管？'
          ]
        },
        {
          category: '布局分析与导出',
          items: [
            'ForceAtlas2 怎么跑在 worker 里？',
            '社区发现与中心性指标怎么算？',
            '图谱怎么导出成 PNG？'
          ]
        }
      ]
    }
  },
  github: {
    rootDir: 'docs',
    commitPath: 'src/runtime'
  },
  toc: {
    bottom: {
      links: [
        {
          icon: 'i-lucide-message-circle-code',
          to: 'https://sigma.mhaibaraai.cn/llms.txt',
          target: '_blank',
          label: 'Open LLMs'
        }
      ]
    }
  },
  footer: {
    credits: `Copyright © 2026 - ${new Date().getFullYear()} YiXuan - <span class="text-highlighted">MIT License</span>`,
    socials: [
      {
        'icon': 'i-simple-icons-github',
        'to': 'https://github.com/mhaibaraai/movk-sigmajs',
        'target': '_blank',
        'aria-label': 'movk-sigmajs on GitHub'
      },
      {
        'icon': 'i-lucide-mail',
        'to': 'mailto:mhaibaraai@gmail.com',
        'target': '_blank',
        'aria-label': 'YiXuan\'s Gmail'
      }
    ]
  }
})

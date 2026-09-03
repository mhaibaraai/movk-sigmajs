import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'

const SECTIONS = ['components', 'composables', 'utils'] as const
type Section = typeof SECTIONS[number]

const sectionSet = new Set<string>(SECTIONS)

function sectionOf(path: string): string {
  return path.split('/')[2] ?? ''
}

export default defineMcpTool({
  description: 'List @movk/sigma capabilities (components, composables, utils) organized by category. Filter by category or a search term; with no params returns the full catalog grouped by category. Use this first to discover what the library offers.',
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  },
  inputSchema: {
    category: z.enum(SECTIONS).optional().describe('Filter by category: components, composables, utils'),
    search: z.string().optional().describe('Filter items by name, title or description')
  },
  inputExamples: [
    {},
    { category: 'composables' },
    { search: '邻域' },
    { category: 'utils', search: 'diff' }
  ],
  cache: '30m',
  async handler({ category, search }) {
    const event = useEvent()
    const origin = getRequestURL(event).origin

    const pages = await queryCollection(event, 'docs')
      .select('title', 'description', 'path', 'category')
      .all()

    let items = pages
      .filter(page => sectionSet.has(sectionOf(page.path)))
      .filter(page => !(page.path.split('/').pop() ?? '').startsWith('.'))
      .map(page => ({
        name: page.path.split('/').pop() ?? page.path,
        title: page.title,
        description: page.description,
        category: sectionOf(page.path) as Section,
        group: page.category,
        url: `${origin}${page.path}`
      }))

    if (category) {
      items = items.filter(item => item.category === category)
    }

    if (search) {
      const keyword = search.toLowerCase()
      items = items.filter(item =>
        item.name.toLowerCase().includes(keyword)
        || item.title?.toLowerCase().includes(keyword)
        || item.description?.toLowerCase().includes(keyword)
      )
    }

    const groups: Record<string, typeof items> = {}
    for (const item of items) {
      const bucket = groups[item.category] ??= []
      bucket.push(item)
    }
    for (const bucket of Object.values(groups)) {
      bucket.sort((a, b) => a.name.localeCompare(b.name))
    }

    return { groups, total: items.length }
  }
})

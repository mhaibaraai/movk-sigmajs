import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'

const SECTIONS = ['components', 'composables'] as const
const sectionSet = new Set<string>(SECTIONS)

function sectionOf(path: string): string {
  return path.split('/')[2] ?? ''
}

export default defineMcpPrompt({
  description: 'Assemble a declarative @movk/sigma knowledge graph for a described task, using only documented components and following the library conventions.',
  inputSchema: {
    task: z.string().describe('What the graph should do, e.g. "show a large graph with zoom and fullscreen controls, a search box and neighborhood highlight on click"'),
    features: z.string().optional().describe('Extra capabilities to include, e.g. "minimap, legend, export to PNG"')
  },
  async handler({ task, features }) {
    const event = useEvent()
    const origin = getRequestURL(event).origin

    const pages = await queryCollection(event, 'docs')
      .select('title', 'description', 'path', 'category')
      .all()

    const candidates = pages
      .filter(page => sectionSet.has(sectionOf(page.path)))
      .filter(page => !(page.path.split('/').pop() ?? '').startsWith('.'))
      .map(page => ({
        name: page.path.split('/').pop() ?? page.path,
        title: page.title,
        description: page.description,
        category: sectionOf(page.path),
        url: `${origin}${page.path}`
      }))

    const text = [
      `Build a self-contained \`<SigmaGraph>\` single-file component for a Nuxt project (components auto-imported) that accomplishes this task:`,
      ``,
      `"${task}"`,
      ...(features ? [``, `Also include: ${features}`] : []),
      ``,
      `Requirements:`,
      `- Use ONLY components/composables that exist in the candidate list below. Do not invent names.`,
      `- Follow the library conventions in the \`resource://docs/sigma-conventions\` resource (SSR-safe dynamic imports, useSigma() must be called inside a child of SigmaGraph, explicit container height, data vs graph channel, settings passthrough, styles composition).`,
      `- Give the graph container an explicit height (e.g. style="height: 70vh").`,
      `- For exact props, call the \`list-sigma-capabilities\` and \`get-component\` tools; for styles fields call \`get-sigma-styles-schema\`; for custom shapes/layers check \`resource://docs/sigma-primitives\`.`,
      ``,
      `Candidate components/composables (by category):`,
      JSON.stringify(candidates, null, 2)
    ].join('\n')

    return {
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text
        }
      }]
    }
  }
})

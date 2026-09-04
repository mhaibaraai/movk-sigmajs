import { z } from 'zod'

interface StylesSchema {
  builtIn: string[]
  label: string[]
  bindingShape: string
  snippet: string
}

// SigmaStyles passes straight through to sigma's StylesDeclaration. These list only the
// commonly bound fields; for the exhaustive set query sigma's own types (sigma/types).
const SCHEMAS: Record<'nodes' | 'edges', StylesSchema> = {
  nodes: {
    builtIn: ['x', 'y', 'size', 'color', 'shape', 'opacity', 'visibility', 'zIndex', 'cursor'],
    label: ['label', 'labelColor', 'labelSize', 'labelPosition', 'labelVisibility'],
    bindingShape: '{ attribute: string, defaultValue?: T } — a DirectAttributeBinding reads a node attribute; add min/max for a NumericalAttributeBinding, or dict for a CategoricalAttributeBinding',
    snippet: `const styles = {
  nodes: {
    color: { attribute: 'color', defaultValue: '#666' },
    size: { attribute: 'size', min: 4, max: 20 },
    shape: { attribute: 'shape', defaultValue: 'circle' },
    label: { attribute: 'label' }
  }
}

<SigmaGraph :data="data" :styles="styles" />`
  },
  edges: {
    builtIn: ['size', 'color', 'opacity', 'visibility', 'zIndex', 'cursor'],
    label: ['label', 'labelColor', 'labelSize', 'labelPosition'],
    bindingShape: '{ attribute: string, defaultValue?: T } — same AttributeBinding shape as nodes',
    snippet: `const styles = {
  edges: {
    color: { attribute: 'color', defaultValue: '#ccc' },
    size: { attribute: 'weight', min: 1, max: 6 }
  }
}

<SigmaGraph :data="data" :styles="styles" />`
  }
}

const targetEnum = z.enum(['nodes', 'edges'])

export default defineMcpTool({
  description: 'Get the commonly bound style fields and a minimal styles scaffold for SigmaGraph, for either nodes or edges. sigma passes styles straight through to its StylesDeclaration, so use this to avoid guessing field names. Omit `target` to list both.',
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  },
  inputSchema: {
    target: targetEnum.optional().describe('sigma styles target: nodes or edges')
  },
  inputExamples: [
    {},
    { target: 'nodes' },
    { target: 'edges' }
  ],
  cache: '1h',
  async handler({ target }) {
    const note = 'sigma itself reads styles.nodes/styles.edges as a full replacement of its defaults, not a merge. SigmaGraph shields you from this: it automatically composes your `styles` prop on top of a base preset (controlled by `stylesBase`, default \'default\') plus its own library rules, via composeStyles() internally — so passing custom rules through `styles` does NOT drop label binding, isHidden visibility or hover feedback in normal usage. Only reach for composeStyles() yourself when merging multiple style sources before assignment, or when stylesBase is set to \'none\' and you own the full ruleset.'

    if (target) {
      return { target, schema: SCHEMAS[target], note }
    }

    return { schemas: SCHEMAS, note }
  }
})

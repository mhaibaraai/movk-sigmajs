// Rendering primitives available to SigmaGraph's `primitives` prop, and the optional
// peer packages that unlock extra node/edge programs. All of it must be reached
// through defineSigmaPrimitives() when it touches sigma's own factories (see
// resource://docs/sigma-conventions, topic "Rendering primitives").
const builtInShapes = [
  { name: 'sdfCircle', source: 'sigma/rendering', pure: false, description: 'Built-in circle node shape' },
  { name: 'sdfSquare', source: 'sigma/rendering', pure: false, description: 'Built-in square node shape' },
  { name: 'sdfTriangle', source: 'sigma/rendering', pure: false, description: 'Built-in triangle node shape' },
  { name: 'sdfDiamond', source: 'sigma/rendering', pure: false, description: 'Built-in diamond node shape' },
  { name: 'sdfPolygon', source: '@movk/sigma', pure: true, description: 'Regular polygon of N sides, a second encoding channel beyond colour; degrades to a circle when sides < 3' },
  { name: 'sdfStar', source: '@movk/sigma', pure: true, description: 'N-pointed star; degrades to a circle when points < 3' }
]

const builtInLayers = [
  { name: 'layerFill', source: 'sigma/rendering', pure: false, description: 'Solid fill fragment layer, the default node rendering pass' }
]

const optionalPeers = {
  layout: ['graphology-layout', 'graphology-layout-forceatlas2', 'graphology-layout-noverlap'],
  analysis: ['graphology-metrics', 'graphology-communities-louvain'],
  renderPrograms: ['@sigma/node-image', '@sigma/node-border', '@sigma/node-square', '@sigma/node-piechart', '@sigma/edge-curve'],
  imageExport: ['@sigma/export-image']
}

const usage = {
  pureVsFactory: 'sdfPolygon()/sdfStar() return plain data ({ name, glsl, inradiusFactor }) with no reference to sigma\'s runtime values, so they can be called at module top level. sdfCircle()/sdfSquare()/sdfTriangle()/sdfDiamond()/layerFill() come from sigma/rendering, which reads WebGL2RenderingContext at import time — always resolve them inside defineSigmaPrimitives()\'s async loader.',
  wiring: 'primitives.nodes.shapes accepts an array of shape declarations; the shape actually used per-node is picked by styles.nodes.shape (e.g. { attribute: \'category\', dict: { core: \'hexagon\' } }), so the shape name and the styles binding must agree.',
  optionalPeers: 'Calling a composable/util that needs an uninstalled optional peer (layout, analysis, render programs, export) throws an actionable "install X" error rather than silently doing nothing.'
}

export default defineMcpResource({
  uri: 'resource://docs/sigma-primitives',
  description: 'Available rendering primitives for @movk/sigma: built-in sigma node shapes/layers (must load via defineSigmaPrimitives), the library\'s pure-data sdfPolygon/sdfStar shapes, and the optional peer packages for layout, analysis, extra render programs and image export.',
  cache: '1h',
  async handler(uri: URL) {
    return {
      contents: [{
        uri: uri.toString(),
        mimeType: 'application/json',
        text: JSON.stringify({ builtInShapes, builtInLayers, optionalPeers, usage }, null, 2)
      }]
    }
  }
})

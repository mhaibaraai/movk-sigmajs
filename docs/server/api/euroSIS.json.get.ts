import type { SerializedGraph } from 'graphology-types'
import euroSISData from '../../public/data/euroSIS.json'

export default eventHandler(async () => euroSISData as SerializedGraph)

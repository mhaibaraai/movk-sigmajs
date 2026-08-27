import type { WikipediaDataset } from '../../app/utils/wikipedia'
import wikipedia from '../../public/data/wikipedia.json'

/** 原样返回 sigma 官方数据集，转换交给前端，见 app/utils/wikipedia.ts */
export default eventHandler(async () => wikipedia as WikipediaDataset)

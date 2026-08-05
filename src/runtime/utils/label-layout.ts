import { rectsIntersect } from './label-anchor'
import type { SigmaLabelRect } from './label-anchor'

export interface SigmaLabelLayoutOptions {
  /**
   * 空间索引的格子边长（像素）。过小则单个标签跨越太多格子，过大则每格内退化成线性扫
   * @defaultValue 64
   */
  cellSize?: number
  /**
   * 位置记忆的保留帧数，连续这么多帧未出现的 owner 会被淘汰。设为 0 则不淘汰
   * @defaultValue 60
   */
  memoryTtlFrames?: number
}

export interface SigmaLabelLayout {
  /** 与自己之外的已占矩形都不冲突时登记并返回 `true`，冲突则不登记并返回 `false` */
  claim: (owner: string, rect: SigmaLabelRect) => boolean
  /** 无视冲突强行登记，供避无可避但仍必须绘制的标签使用 */
  occupy: (owner: string, rect: SigmaLabelRect) => void
  /** 取上一次实际采用的位置标识 */
  recall: (owner: string) => string | undefined
  /** 记下本次实际采用的位置标识 */
  remember: (owner: string, position: string) => void
  /** 开始新的一帧：清空占位登记，并按 TTL 淘汰长期未出现的位置记忆 */
  resetFrame: () => void
  /** 清空占位与位置记忆，重新布局后调用 */
  clear: () => void
}

const DEFAULT_CELL_SIZE = 64

const DEFAULT_MEMORY_TTL_FRAMES = 60

function isDrawableRect(rect: SigmaLabelRect): boolean {
  return Number.isFinite(rect.x)
    && Number.isFinite(rect.y)
    && Number.isFinite(rect.width)
    && Number.isFinite(rect.height)
}

/**
 * 创建一份标签的占位登记与位置记忆。
 *
 * sigma 逐个调用 `drawLabel` 绘制标签，彼此之间没有布局协作，节点标签画布又固定压在
 * 边标签之上（`render()` 里 `renderLabels()` 先于 `renderEdgeLabels()`，顺序改不了），
 * 遮挡只能由绘制层自己避让：每个标签在落笔前登记占位矩形，后来者据此换位置。
 *
 * 两条不可动摇的语义：
 *
 * - **按 owner 覆盖，而不是追加。** 悬停走的 `scheduleHighlightedNodesRender` 分支只重画
 *   hovers 与边标签、不发 `beforeRender`，追加式登记会让边标签跟自己上一帧的矩形冲突再挪一次。
 * - **位置跨帧记忆。** 每帧独立决策的话，相机一动方位就换，观感是标签乱跳；悬停态同样读这份
 *   记忆才不会跳位。记忆不随 `resetFrame()` 清空，只在 {@link SigmaLabelLayout.clear} 或
 *   TTL 到期时淘汰。
 *
 * 状态全部关在闭包里：一页多个 sigma 实例时各自持有一份，互不干扰。
 *
 * @example
 * ```ts
 * const layout = createLabelLayout()
 * // sigma 的 beforeRender 事件里开新帧
 * sigma.on('beforeRender', () => layout.resetFrame())
 * ```
 */
export function createLabelLayout(options: SigmaLabelLayoutOptions = {}): SigmaLabelLayout {
  const {
    cellSize = DEFAULT_CELL_SIZE,
    memoryTtlFrames = DEFAULT_MEMORY_TTL_FRAMES
  } = options

  const size = cellSize > 0 ? cellSize : DEFAULT_CELL_SIZE

  /** 本帧已登记的占位矩形 */
  const rects = new Map<string, SigmaLabelRect>()
  /** 空间索引：格子 → 落在其中的 owner */
  const cells = new Map<string, Set<string>>()
  /** owner → 其占用的格子，用于按 owner 覆盖时精确摘除 */
  const owned = new Map<string, string[]>()
  /** owner → 上一次实际采用的位置标识 */
  const positions = new Map<string, string>()
  /** owner → 最后一次出现的帧序号 */
  const lastSeen = new Map<string, number>()

  let frame = 0

  function cellKeysOf(rect: SigmaLabelRect): string[] {
    const minX = Math.floor(rect.x / size)
    const maxX = Math.floor((rect.x + rect.width) / size)
    const minY = Math.floor(rect.y / size)
    const maxY = Math.floor((rect.y + rect.height) / size)
    const keys: string[] = []

    for (let cy = minY; cy <= maxY; cy += 1) {
      for (let cx = minX; cx <= maxX; cx += 1) {
        keys.push(`${cx}|${cy}`)
      }
    }

    return keys
  }

  function release(owner: string): void {
    const keys = owned.get(owner)
    if (!keys) {
      return
    }

    for (const key of keys) {
      const bucket = cells.get(key)
      if (!bucket) {
        continue
      }
      bucket.delete(owner)
      if (bucket.size === 0) {
        cells.delete(key)
      }
    }

    owned.delete(owner)
    rects.delete(owner)
  }

  function occupy(owner: string, rect: SigmaLabelRect): void {
    if (!isDrawableRect(rect)) {
      return
    }

    release(owner)

    const keys = cellKeysOf(rect)
    for (const key of keys) {
      const bucket = cells.get(key)
      if (bucket) {
        bucket.add(owner)
      }
      else {
        cells.set(key, new Set([owner]))
      }
    }

    owned.set(owner, keys)
    rects.set(owner, rect)
    lastSeen.set(owner, frame)
  }

  function claim(owner: string, rect: SigmaLabelRect): boolean {
    if (!isDrawableRect(rect)) {
      return false
    }

    for (const key of cellKeysOf(rect)) {
      const bucket = cells.get(key)
      if (!bucket) {
        continue
      }

      for (const other of bucket) {
        const occupied = other !== owner && rects.get(other)
        if (occupied && rectsIntersect(rect, occupied)) {
          return false
        }
      }
    }

    occupy(owner, rect)

    return true
  }

  function evictStaleMemory(): void {
    const deadline = frame - memoryTtlFrames

    for (const [owner, seen] of lastSeen) {
      if (seen < deadline) {
        lastSeen.delete(owner)
        positions.delete(owner)
      }
    }
  }

  function resetFrame(): void {
    rects.clear()
    cells.clear()
    owned.clear()
    frame += 1

    // 每 TTL 帧扫一次即可，逐帧全量扫描的代价与标签数同阶却毫无收益
    if (memoryTtlFrames > 0 && frame % memoryTtlFrames === 0) {
      evictStaleMemory()
    }
  }

  function clear(): void {
    rects.clear()
    cells.clear()
    owned.clear()
    positions.clear()
    lastSeen.clear()
  }

  return {
    claim,
    occupy,
    recall: owner => positions.get(owner),
    remember(owner, position) {
      positions.set(owner, position)
      lastSeen.set(owner, frame)
    },
    resetFrame,
    clear
  }
}

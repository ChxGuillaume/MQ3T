export type LayoutNode = { id: string; width: number; height: number }
export type LayoutEdge = { source: string; target: string; sourceHandle?: string | null }
export type LayoutPosition = { x: number; y: number }

export type LayoutOptions = {
  origin?: LayoutPosition
  columnGap?: number
  rowGap?: number
  grid?: number
}

const HANDLE_ORDER: Record<string, number> = { true: 0, false: 1 }

const handleRank = (handle?: string | null) => (handle ? (HANDLE_ORDER[handle] ?? 2) : 2)

export const layoutChain = (
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  { origin = { x: 30, y: 40 }, columnGap = 60, rowGap = 40, grid = 10 }: LayoutOptions = {}
): Map<string, LayoutPosition> => {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const children = new Map<string, string[]>()
  const hasParent = new Set<string>()

  const sortedEdges = [...edges].sort(
    (a, b) => handleRank(a.sourceHandle) - handleRank(b.sourceHandle)
  )

  for (const edge of sortedEdges) {
    if (!byId.has(edge.source) || !byId.has(edge.target) || hasParent.has(edge.target)) continue

    hasParent.add(edge.target)

    if (!children.has(edge.source)) children.set(edge.source, [])

    children.get(edge.source)!.push(edge.target)
  }

  const roots = [
    ...nodes.filter((node) => node.id === 'start'),
    ...nodes.filter((node) => node.id !== 'start' && !hasParent.has(node.id))
  ]

  const depth = new Map<string, number>()
  const visit = (id: string, level: number) => {
    if (depth.has(id)) return

    depth.set(id, level)

    for (const child of children.get(id) ?? []) visit(child, level + 1)
  }

  const looseLevel = byId.has('start') ? 1 : 0

  for (const root of roots) visit(root.id, root.id === 'start' ? 0 : looseLevel)
  for (const node of nodes) visit(node.id, looseLevel)

  const columnWidths: number[] = []

  for (const node of nodes) {
    const level = depth.get(node.id)!

    columnWidths[level] = Math.max(columnWidths[level] ?? 0, node.width)
  }

  const columnX: number[] = [0]

  for (let level = 1; level < columnWidths.length; level++) {
    columnX[level] = columnX[level - 1] + (columnWidths[level - 1] ?? 0) + columnGap
  }

  const centerY = new Map<string, number>()
  let cursor = 0

  const placing = new Set<string>()

  const place = (id: string): number => {
    if (centerY.has(id)) return centerY.get(id)!

    placing.add(id)

    const node = byId.get(id)!
    const kids = (children.get(id) ?? []).filter((kid) => !placing.has(kid) && !centerY.has(kid))

    if (!kids.length) {
      const center = cursor + node.height / 2

      cursor += node.height + rowGap
      centerY.set(id, center)

      return center
    }

    const centers = kids.map(place)
    const center = (centers[0] + centers[centers.length - 1]) / 2

    centerY.set(id, center)

    return center
  }

  const snap = (value: number) => Math.round(value / grid) * grid

  const startNode = byId.get('start')
  const startCenterOffset = startNode ? startNode.height / 2 : 0

  for (const root of roots) place(root.id)
  for (const node of nodes) place(node.id)

  const startCenter = startNode ? (centerY.get('start') ?? 0) : 0
  const positions = new Map<string, LayoutPosition>()

  for (const node of nodes) {
    const level = depth.get(node.id)!
    const columnLeft = columnX[level]
    const offsetX = node.id === 'start' ? 0 : (columnWidths[level] - node.width) / 2

    positions.set(node.id, {
      x: snap(origin.x + columnLeft + offsetX),
      y: snap(origin.y + startCenterOffset + centerY.get(node.id)! - startCenter - node.height / 2)
    })
  }

  return positions
}

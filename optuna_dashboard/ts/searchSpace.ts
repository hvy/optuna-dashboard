import { useMemo } from "react"

export const mergeUnionSearchSpace = (
  unionSearchSpace: SearchSpaceItem[]
): SearchSpaceItem[] => {
  const knownElements = new Map<string, Distribution>()
  unionSearchSpace.forEach((s) => {
    const d = knownElements.get(s.name)
    if (d === undefined) {
      knownElements.set(s.name, s.distribution)
      return
    }
    if (
      d.type === "CategoricalDistribution" ||
      s.distribution.type === "CategoricalDistribution"
    ) {
      // CategoricalDistribution.choices will never be changed
      return
    }
    d.low = Math.min(d.low, s.distribution.low)
    d.high = Math.max(d.low, s.distribution.high)
    knownElements.set(s.name, d)
  })
  return Array.from(knownElements.keys())
    .sort((a, b) => (a > b ? 1 : a < b ? -1 : 0))
    .map((name) => ({
      name: name,
      distribution: knownElements.get(name) as Distribution,
    }))
}

export const useMergedUnionSearchSpace = (
  unionSearchSpaces?: SearchSpaceItem[]
): SearchSpaceItem[] =>
  useMemo(() => {
    return mergeUnionSearchSpace(unionSearchSpaces || [])
  }, [unionSearchSpaces])

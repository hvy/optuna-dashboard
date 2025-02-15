import { useMemo, useState } from "react"

type TargetKind = "objective" | "user_attr" | "params"

export class Target {
  kind: TargetKind
  key: number | string

  constructor(kind: TargetKind, key: number | string) {
    this.kind = kind
    this.key = key
  }

  validate(): boolean {
    if (this.kind === "objective") {
      if (typeof this.key !== "number") {
        return false
      }
    } else if (this.kind === "user_attr") {
      if (typeof this.key !== "string") {
        return false
      }
    } else if (this.kind === "params") {
      if (typeof this.key !== "string") {
        return false
      }
    }
    return true
  }

  identifier(): string {
    return `${this.kind}:${this.key}`
  }

  toLabel(objectiveNames?: string[]): string {
    if (this.kind === "objective") {
      const objectiveId: number = this.key as number
      if (objectiveNames !== undefined && objectiveNames.length > objectiveId) {
        return objectiveNames[objectiveId]
      }
      return `Objective ${objectiveId}`
    } else if (this.kind === "user_attr") {
      return `User Attribute ${this.key}`
    } else {
      return `Param ${this.key}`
    }
  }

  getObjectiveId(): number | null {
    if (this.kind !== "objective") {
      return null
    }
    return this.key as number
  }

  getTargetValue(trial: Trial): number | null {
    if (!this.validate()) {
      return null
    }
    if (this.kind === "objective") {
      const objectiveId = this.getObjectiveId()
      if (
        objectiveId === null ||
        trial.values === undefined ||
        trial.values.length <= objectiveId
      ) {
        return null
      }
      const value = trial.values[objectiveId]
      if (value === "inf" || value === "-inf") {
        return null
      }
      return value
    } else if (this.kind === "user_attr") {
      const attr = trial.user_attrs.find((attr) => attr.key === this.key)
      if (attr === undefined) {
        return null
      }
      const value = Number(attr.value)
      if (value === undefined) {
        return null
      }
      return value
    } else if (this.kind === "params") {
      const param = trial.params.find((p) => p.name === this.key)
      if (param === undefined) {
        return null
      }
      return param.param_internal_value
    }
    return null
  }
}

export const useFilteredTrials = (
  study: StudyDetail | null,
  targets: Target[],
  filterComplete: boolean,
  filterPruned: boolean
): Trial[] =>
  useMemo<Trial[]>(() => {
    if (study === null) {
      return []
    }
    return study.trials.filter((t) => {
      if (t.state !== "Complete" && t.state !== "Pruned") {
        return false
      }
      if (t.state === "Complete" && filterComplete) {
        return false
      }
      if (t.state === "Pruned" && filterPruned) {
        return false
      }
      return targets.every((target) => target.getTargetValue(t) !== null)
    })
  }, [study?.trials, targets, filterComplete, filterPruned])

export const useObjectiveTargets = (
  study: StudyDetail | null
): [Target[], Target, (ident: string) => void] => {
  const defaultTarget = new Target("objective", 0)
  const [selected, setTargetIdent] = useState<string>(
    defaultTarget.identifier()
  )
  const targetList = useMemo<Target[]>(() => {
    if (study !== null) {
      return study.directions.map((v, i) => new Target("objective", i))
    } else {
      return [defaultTarget]
    }
  }, [study?.directions])
  const selectedTarget = useMemo<Target>(
    () => targetList.find((t) => t.identifier() === selected) || defaultTarget,
    [targetList, selected]
  )
  return [targetList, selectedTarget, setTargetIdent]
}

export const useParamTargets = (
  searchSpace: SearchSpaceItem[]
): [Target[], Target | null, (ident: string) => void] => {
  const [selected, setTargetIdent] = useState<string>("")
  const targetList = useMemo<Target[]>(() => {
    const targets = searchSpace.map((s) => new Target("params", s.name))
    if (selected === "" && targets.length > 0)
      setTargetIdent(targets[0].identifier())
    return targets
  }, [searchSpace])
  const selectedTarget = useMemo<Target | null>(
    () => targetList.find((t) => t.identifier() === selected) || null,
    [targetList, selected]
  )
  return [targetList, selectedTarget, setTargetIdent]
}

export const useObjectiveAndUserAttrTargets = (
  study: StudyDetail | null
): [Target[], Target, (ident: string) => void] => {
  const defaultTarget = new Target("objective", 0)
  const [selected, setTargetIdent] = useState<string>(
    defaultTarget.identifier()
  )
  const targetList = useMemo<Target[]>(() => {
    if (study !== null) {
      return [
        ...study.directions.map((v, i) => new Target("objective", i)),
        ...study.union_user_attrs
          .filter((attr) => attr.sortable)
          .map((attr) => new Target("user_attr", attr.key)),
      ]
    } else {
      return [defaultTarget]
    }
  }, [study?.directions, study?.union_user_attrs])
  const selectedTarget = useMemo<Target>(
    () => targetList.find((t) => t.identifier() === selected) || defaultTarget,
    [targetList, selected]
  )
  return [targetList, selectedTarget, setTargetIdent]
}

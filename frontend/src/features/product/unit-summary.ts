type VariantUnitLike = {
  unitId: string;
  unitName?: string;
  parentUnitId: string;
  factorToParent: number;
  isDefault: boolean;
};

export function summarizeVariantUnits(units: VariantUnitLike[]): string {
  if (!units.length) {
    return "No units configured";
  }

  const byParent = new Map<string, VariantUnitLike[]>();
  const byId = new Map(units.map((unit) => [unit.unitId, unit]));
  for (const unit of units) {
    const parentId = unit.parentUnitId || "__root__";
    const siblings = byParent.get(parentId) ?? [];
    siblings.push(unit);
    byParent.set(parentId, siblings);
  }

  const root = units.find((unit) => !unit.parentUnitId);
  const defaultUnit = units.find((unit) => unit.isDefault);

  if (!root) {
    return defaultUnit?.unitName
      ? `Default: ${defaultUnit.unitName}`
      : "Invalid unit hierarchy";
  }

  const parts = [root.unitName ?? root.unitId];
  const visited = new Set<string>([root.unitId]);
  let current = root;
  while (true) {
    const children = (byParent.get(current.unitId) ?? []).filter(
      (item) => !visited.has(item.unitId),
    );
    if (!children.length) {
      break;
    }

    const next = children.sort(
      (a, b) => a.factorToParent - b.factorToParent,
    )[0];
    visited.add(next.unitId);
    parts.push(`${next.unitName ?? next.unitId} x${next.factorToParent}`);
    current = next;
  }

  if (!defaultUnit) {
    return parts.join(" -> ");
  }

  const defaultLabel =
    defaultUnit.unitName ??
    byId.get(defaultUnit.unitId)?.unitName ??
    defaultUnit.unitId;
  return `Default: ${defaultLabel}. ${parts.join(" -> ")}`;
}

export function validateVariantUnits(
  units: Array<{
    unitId: string;
    parentUnitId: string;
    factorToParent: number;
    isDefault: boolean;
  }>,
): string | null {
  if (!units.length) {
    return "Each variant needs at least one unit.";
  }

  const seen = new Set<string>();
  const unitMap = new Map(units.map((unit) => [unit.unitId, unit]));
  let rootCount = 0;
  let defaultCount = 0;

  for (const unit of units) {
    if (!unit.unitId) {
      return "Every unit row must select a unit.";
    }
    if (seen.has(unit.unitId)) {
      return "A variant cannot use the same unit twice.";
    }
    seen.add(unit.unitId);
    if (unit.factorToParent <= 0) {
      return "Conversion factors must be greater than zero.";
    }
    if (!unit.parentUnitId && unit.factorToParent !== 1) {
      return "The base unit must use a factor of 1.";
    }
    if (!unit.parentUnitId) {
      rootCount += 1;
    }
    if (unit.isDefault) {
      defaultCount += 1;
    }
  }

  if (rootCount !== 1) {
    return "Each variant needs exactly one base unit.";
  }
  if (defaultCount !== 1) {
    return "Each variant needs exactly one default unit.";
  }

  for (const unit of units) {
    if (!unit.parentUnitId) {
      continue;
    }
    if (!unitMap.has(unit.parentUnitId)) {
      return "Each parent unit must exist in the same hierarchy.";
    }
    if (unit.parentUnitId === unit.unitId) {
      return "A unit cannot be its own parent.";
    }

    const visited = new Set<string>([unit.unitId]);
    let currentParent = unit.parentUnitId;
    while (currentParent) {
      if (visited.has(currentParent)) {
        return "The unit hierarchy contains a cycle.";
      }
      visited.add(currentParent);
      currentParent = unitMap.get(currentParent)?.parentUnitId ?? "";
    }
  }

  return null;
}

/**
 * Hazen–Williams and K–P–Q logic from "Hazen Williams Formula and K,P,Q.xlsx" (Sheet1).
 * Units match typical NFPA hydraulic worksheets: Q (GPM), P (psi), K (GPM/√psi),
 * C (Hazen–Williams coefficient), pipe ID d (inches), length (feet).
 */

export const DEFAULT_BASE_DESIGN_AREA = 1500;

export function flowFromKAndP(k: number, p: number): number {
  return k * Math.sqrt(p);
}

export function kFromQAndP(q: number, p: number): number {
  return q / Math.sqrt(p);
}

export function pressureFromQAndK(q: number, k: number): number {
  return (q / k) ** 2;
}

/** Excel D15: =POWER(C15,1.85)*4.52 */
export function hazenNumeratorTerm(q: number): number {
  return q ** 1.85 * 4.52;
}

/** Excel D18: =POWER(C18,1.85) */
export function cTermPow(c: number): number {
  return c ** 1.85;
}

/** Excel D21: =POWER(C21,4.87) */
export function dTermPow(dInches: number): number {
  return dInches ** 4.87;
}

/** Friction loss per foot — Excel E16: =D15/(D18*D21) */
export function frictionLossPerFoot(q: number, c: number, dInches: number): number {
  const d15 = hazenNumeratorTerm(q);
  const d18 = cTermPow(c);
  const d21 = dTermPow(dInches);
  return d15 / (d18 * d21);
}

/** Total friction — Excel E22: =E16*E19 */
export function totalFrictionLoss(
  q: number,
  c: number,
  dInches: number,
  lengthFt: number,
): number {
  return frictionLossPerFoot(q, c, dInches) * lengthFt;
}

/** Excel G5: =-(3*G4)/2 + 55 (design reduction %) */
export function designReductionPercentFromCeiling(ceilingFt: number): number {
  return (-(3 * ceilingFt)) / 2 + 55;
}

/** Excel G6: =(G5/100)*1500 */
export function squareFootReduction(
  designReductionPercent: number,
  baseArea = DEFAULT_BASE_DESIGN_AREA,
): number {
  return (designReductionPercent / 100) * baseArea;
}

/** Excel G7: =1500-G6 */
export function reducedDesignArea(
  ceilingFt: number,
  baseArea = DEFAULT_BASE_DESIGN_AREA,
): {
  ceilingFt: number;
  designReductionPercent: number;
  squareFootReduction: number;
  reducedDesignArea: number;
} {
  const pct = designReductionPercentFromCeiling(ceilingFt);
  const sq = squareFootReduction(pct, baseArea);
  return {
    ceilingFt,
    designReductionPercent: pct,
    squareFootReduction: sq,
    reducedDesignArea: baseArea - sq,
  };
}

/** Excel F26: =C26/D26 */
export function sprinklerHeadCount(areaSqFt: number, coveragePerHead: number): number {
  return areaSqFt / coveragePerHead;
}

/** Excel D30: =SQRT(C30) — side length for a square remote area */
export function squareSideLength(areaSqFt: number): number {
  return Math.sqrt(areaSqFt);
}

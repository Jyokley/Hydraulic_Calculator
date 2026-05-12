/**
 * Life-safety helpers aligned with CBC/CFC-style occupant load factors and
 * simple egress width / exit separation estimates (verify against adopted code).
 */

export type OccupantLoadRow = { name: string; factor: number };

/** CBC/CFC Table 1004.5 style occupant load factors (sq ft per person). */
export const OCCUPANT_LOAD_FACTORS: OccupantLoadRow[] = [
  { name: "Assembly - Concentrated", factor: 7 },
  { name: "Assembly - Standing", factor: 5 },
  { name: "Assembly - Tables and Chairs", factor: 15 },
  { name: "Business Areas", factor: 150 },
  { name: "Classrooms", factor: 20 },
  { name: "Exercise Rooms", factor: 50 },
  { name: "Industrial Areas", factor: 100 },
  { name: "Mercantile", factor: 60 },
  { name: "Commercial Kitchens", factor: 200 },
  { name: "Library Reading Rooms", factor: 50 },
  { name: "Stages and Platforms", factor: 15 },
  { name: "Warehouses", factor: 500 },
  { name: "Parking Garages", factor: 200 },
];

export function occupantLoadFromArea(squareFootage: number, loadFactorSqFtPerPerson: number): number {
  if (!Number.isFinite(squareFootage) || !Number.isFinite(loadFactorSqFtPerPerson)) return 0;
  if (loadFactorSqFtPerPerson <= 0 || squareFootage < 0) return 0;
  return Math.ceil(squareFootage / loadFactorSqFtPerPerson);
}

/** Minimum exit separation with sprinklers: one-third of overall diagonal (ft). */
export function exitSeparationSprinklered(diagonalFt: number): number {
  if (!Number.isFinite(diagonalFt) || diagonalFt < 0) return 0;
  return diagonalFt / 3;
}

/** Minimum exit separation without sprinklers: one-half of overall diagonal (ft). */
export function exitSeparationNonSprinklered(diagonalFt: number): number {
  if (!Number.isFinite(diagonalFt) || diagonalFt < 0) return 0;
  return diagonalFt / 2;
}

/** Required exit width (inches) = occupant load × inches per person. */
export function exitWidthInches(occupantLoad: number, inchesPerPerson: number): number {
  if (!Number.isFinite(occupantLoad) || !Number.isFinite(inchesPerPerson)) return 0;
  if (occupantLoad < 0 || inchesPerPerson < 0) return 0;
  return occupantLoad * inchesPerPerson;
}

export function inchesToFeet(inches: number): number {
  if (!Number.isFinite(inches)) return 0;
  return inches / 12;
}

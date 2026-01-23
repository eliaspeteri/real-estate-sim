import { Property } from "../types";

const PROTECTED_RENOVATION_MULTIPLIER = 1.35;

export const calculateRenovationCost = (property: Property): number => {
  const baseCost = Math.round(property.value * 0.05);
  if (!property.isProtected) return baseCost;

  return Math.round(baseCost * PROTECTED_RENOVATION_MULTIPLIER);
};

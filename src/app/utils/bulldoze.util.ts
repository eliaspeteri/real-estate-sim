import { Property } from "../types";

const BASE_BULLDOZE_COST = 5000;

export const calculateBulldozeCost = (property: Property): number => {
  const sizeCost = Math.round(property.size * 75);
  return Math.max(BASE_BULLDOZE_COST, sizeCost);
};

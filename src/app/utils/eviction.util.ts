import { Property } from "../types";

const BASE_EVICTION_COST = 1000;
const BASE_EVICTION_DAYS = 30;

export const calculateEvictionCost = (property: Property): number => {
  const rentFactor = Math.round(property.rentPrice * 1.5);
  return Math.max(BASE_EVICTION_COST, rentFactor);
};

export const calculateEvictionDurationDays = (property: Property): number => {
  const sizeFactor = Math.round(property.size / 20);
  const duration = BASE_EVICTION_DAYS + sizeFactor;
  return Math.min(120, Math.max(30, duration));
};

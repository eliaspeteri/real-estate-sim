"use client";

import { Property } from "../types";

export const PERMIT_DURATION_DAYS = 30;
export const CONSTRUCTION_DURATION_DAYS = 90;

export const calculatePermitCost = (property: Property): number => {
  return Math.max(5000, Math.round(property.value * 0.02));
};

export const calculateConstructionCost = (property: Property): number => {
  return Math.max(50000, Math.round(property.value * 0.6));
};

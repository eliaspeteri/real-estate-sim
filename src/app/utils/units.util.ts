import { Property, PropertyType } from "../types";

export const deriveUnitCount = (property: Property): number => {
  if (property.units && property.units > 0) {
    return property.units;
  }

  if (
    [PropertyType.APARTMENT, PropertyType.SKYSCRAPER_CONDO].includes(
      property.type
    )
  ) {
    const unitSize = property.type === PropertyType.SKYSCRAPER_CONDO ? 35 : 45;
    return Math.min(50, Math.max(2, Math.floor(property.size / unitSize)));
  }

  if (property.type === PropertyType.MIXED_USE) {
    return Math.min(20, Math.max(2, Math.floor(property.size / 60)));
  }

  return 1;
};

import { Location, PropertyType } from "../types";

// Monthly rent price per square meter by location
export const RENT_PRICE_MULTIPLIER = {
  [Location.DOWNTOWN]: 35, // $35/m² monthly
  [Location.URBAN]: 25, // $25/m² monthly
  [Location.SUBURBAN]: 18, // $18/m² monthly
  [Location.COUNTRY]: 12 // $12/m² monthly
};

export const calculateRent = (
  location: Location,
  size: number,
  conditionMultiplier: number,
  propertyType?: PropertyType,
  propertyValue?: number
): number => {
  let baseRent = RENT_PRICE_MULTIPLIER[location] * size;

  // Apply condition multiplier
  baseRent *= conditionMultiplier;

  // Adjust for property type if provided
  if (propertyType) {
    if ([PropertyType.MANSION, PropertyType.VILLA].includes(propertyType)) {
      baseRent *= 1.3; // Premium for luxury
    } else if (
      [PropertyType.COMMERCIAL, PropertyType.MIXED_USE].includes(propertyType)
    ) {
      baseRent *= 1.4; // Commercial commands higher rent
    } else if (PropertyType.INDUSTRIAL === propertyType) {
      baseRent *= 0.8; // Industrial typically lower per m²
    }
  }

  // If we know the property value, ensure rent provides reasonable yield
  // Typical annual yield is 5-10% of property value
  if (propertyValue) {
    const minMonthlyRent = (propertyValue * 0.005) / 12; // 0.5% monthly (6% annual)
    const maxMonthlyRent = (propertyValue * 0.01) / 12; // 1% monthly (12% annual)

    // Keep rent within reasonable yield range
    if (baseRent < minMonthlyRent) {
      baseRent = minMonthlyRent;
    } else if (baseRent > maxMonthlyRent) {
      baseRent = maxMonthlyRent;
    }
  }

  // Round to nearest whole dollar
  return Math.round(baseRent);
};

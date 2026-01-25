import { Property } from "../types";
import { calculateRent } from "./calculateRent.util";
import { deriveUnitCount } from "./units.util";

export const calculateRentPriceImpact = ({
  property
}: {
  property: Property;
}) => {
  const unitCount = deriveUnitCount(property);
  const marketRent = calculateRent(
    property.location,
    unitCount > 0 ? property.size / unitCount : property.size,
    property.renovationBonusPercentage / 100
  );
  if (!marketRent || marketRent <= 0) {
    return { count: 0, quality: 0, marketRent: 0 };
  }

  const ratio = property.rentPrice / marketRent;
  if (ratio <= 0.5) return { count: 1.0, quality: -0.12, marketRent };
  if (ratio <= 0.7) return { count: 0.6, quality: -0.07, marketRent };
  if (ratio <= 0.9) return { count: 0.25, quality: -0.03, marketRent };
  if (ratio <= 1.1) return { count: 0, quality: 0, marketRent };
  if (ratio <= 1.25) return { count: -0.2, quality: 0.02, marketRent };
  if (ratio <= 1.75) return { count: -0.5, quality: 0.05, marketRent };
  return { count: -0.8, quality: 0.08, marketRent };
};

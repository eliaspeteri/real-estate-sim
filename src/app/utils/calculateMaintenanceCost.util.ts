import { Location, PropertyType } from "../types";

export const calculateMaintenanceCost = (
  location: Location,
  size: number,
  value: number,
  propertyType?: PropertyType
): number => {
  // Annual maintenance costs typically range between 1-4% of property value
  // We'll calculate monthly costs (divide by 12)

  // Base rate is 2% of property value annually
  let annualMaintenanceRate = 0.02;

  // Adjust maintenance rate based on location
  if ([Location.DOWNTOWN, Location.URBAN].includes(location)) {
    // Higher costs in urban areas
    annualMaintenanceRate = 0.025;
  } else if (location === Location.COUNTRY) {
    // Higher costs in rural areas due to more land/exposure
    annualMaintenanceRate = 0.03;
  }

  // Adjust for property type if provided
  if (propertyType) {
    if ([PropertyType.MANSION, PropertyType.VILLA].includes(propertyType)) {
      annualMaintenanceRate += 0.01; // Luxury properties have higher maintenance
    } else if (
      [PropertyType.APARTMENT, PropertyType.CONDO].includes(propertyType)
    ) {
      annualMaintenanceRate -= 0.005; // Apartments typically have lower maintenance
    }
  }

  // Calculate monthly maintenance cost
  const monthlyMaintenanceCost = (value * annualMaintenanceRate) / 12;

  // Make sure it's at least some minimum amount based on size
  const minimumMonthlyCost = size * 0.5; // $0.50 per square meter minimum

  // Return the larger of the calculated cost or minimum cost, rounded to whole dollars
  return Math.round(Math.max(monthlyMaintenanceCost, minimumMonthlyCost));
};

import {
  Location,
  PropertyType,
  Property,
  NeighborhoodQuality,
  ViewQuality,
  RenovationPotential
} from "../types";

export interface MarketConditions {
  demandLevel: number; // 0.5 (very low) to 1.5 (very high)
  interestRate: number; // percentage, e.g., 3.5
}

export const calculateValue = (
  size: number,
  propertyType: PropertyType,
  location: Location,
  propertyAge?: number, // Age in years
  propertyCondition?: number, // 0-100 scale (100 being perfect condition)
  marketConditions?: MarketConditions,
  property?: Partial<Property> // Optional property with additional attributes
): number => {
  // Use realistic price ranges per square meter (in USD)
  let basePricePerSquareMeter = 0;

  // Group property types by price tier
  if ([PropertyType.MANSION, PropertyType.VILLA].includes(propertyType)) {
    // Luxury tier
    basePricePerSquareMeter = 7500; // $7,500/m² base
  } else if (
    [
      PropertyType.HOUSE,
      PropertyType.COLONIAL_HOUSE,
      PropertyType.BUNGALOW,
      PropertyType.CHALET,
      PropertyType.FARMHOUSE
    ].includes(propertyType)
  ) {
    // Higher-end residential
    basePricePerSquareMeter = 3500; // $3,500/m² base
  } else if (
    [
      PropertyType.APARTMENT,
      PropertyType.CONDO,
      PropertyType.TOWNHOUSE,
      PropertyType.DUPLEX,
      PropertyType.SKYSCRAPER_CONDO,
      PropertyType.ROW_HOUSE
    ].includes(propertyType)
  ) {
    // Standard residential
    basePricePerSquareMeter = 2800; // $2,800/m² base
  } else if (
    [
      PropertyType.COTTAGE,
      PropertyType.CABIN,
      PropertyType.TINY_HOME,
      PropertyType.RANCH_HOUSE,
      PropertyType.MOBILE_HOME,
      PropertyType.HOUSEBOAT
    ].includes(propertyType)
  ) {
    // Special residential
    basePricePerSquareMeter = 2200; // $2,200/m² base
  } else if (
    [PropertyType.COMMERCIAL, PropertyType.MIXED_USE].includes(propertyType)
  ) {
    // Commercial properties
    basePricePerSquareMeter = 3800; // $3,800/m² base
  } else if (PropertyType.INDUSTRIAL === propertyType) {
    // Industrial properties
    basePricePerSquareMeter = 2000; // $2,000/m² base
  } else if (PropertyType.LAND === propertyType) {
    // Undeveloped land (lower per m² but typically larger area)
    basePricePerSquareMeter = 800; // $800/m² base
  } else if (PropertyType.VACATION === propertyType) {
    // Vacation properties (premium)
    basePricePerSquareMeter = 4500; // $4,500/m² base
  } else {
    // Default for any other types
    basePricePerSquareMeter = 2500; // $2,500/m² base
  }

  // Apply small specific adjustments for individual property types
  switch (propertyType) {
    case PropertyType.MANSION:
      basePricePerSquareMeter *= 1.3; // Premium for mansions
      break;
    case PropertyType.SKYSCRAPER_CONDO:
      basePricePerSquareMeter *= 1.2; // Premium for height/views
      break;
    case PropertyType.MOBILE_HOME:
      basePricePerSquareMeter *= 0.7; // Discount for mobile homes
      break;
    // ... other specific adjustments as needed
  }

  const baseValue = size * basePricePerSquareMeter;

  // Adjust value based on location
  let locationMultiplier = 1.0;
  switch (location) {
    case Location.DOWNTOWN:
      locationMultiplier = 1.5; // Premium downtown location
      break;
    case Location.URBAN:
      locationMultiplier = 1.2; // Urban premium
      break;
    case Location.SUBURBAN:
      locationMultiplier = 1.0; // Base reference point
      break;
    case Location.COUNTRY:
      locationMultiplier = 0.7; // Rural discount (but larger properties)
      break;
    default:
      throw new Error("Invalid location");
  }

  // Age adjustment - newer properties are worth more
  let ageMultiplier = 1.0;
  if (propertyAge !== undefined) {
    // Decrease value by up to 40% for older properties (max age considered is 100 years)
    // New construction gets premium
    if (propertyAge < 2) {
      ageMultiplier = 1.1; // New construction premium
    } else if (propertyAge < 10) {
      ageMultiplier = 1.05; // Relatively new
    } else {
      ageMultiplier = Math.max(0.6, 1 - (propertyAge / 100) * 0.4);
    }

    // Historic properties (over 70 years) may actually be worth more
    if (propertyAge > 70 && Math.random() > 0.5) {
      ageMultiplier = 1.1; // Historic premium for some old buildings
    }
  }

  // Condition adjustment
  let conditionMultiplier = 1.0;
  if (propertyCondition !== undefined) {
    // Properties in poor condition (0) worth 60% of base value
    // Properties in perfect condition (100) worth 120% of base value
    conditionMultiplier = 0.6 + (propertyCondition / 100) * 0.6;
  }

  // Market conditions adjustment
  let marketMultiplier = 1.0;
  if (marketConditions) {
    // High demand increases value, high interest rates decrease value
    const demandEffect = marketConditions.demandLevel; // 0.5 to 1.5
    const interestEffect = Math.max(
      0.85,
      1.15 - marketConditions.interestRate / 20
    );
    marketMultiplier = demandEffect * interestEffect;
  }

  // Final calculation combining all factors
  let finalValue =
    baseValue *
    locationMultiplier *
    ageMultiplier *
    conditionMultiplier *
    marketMultiplier;

  // Include the additional advanced factors if present
  if (property) {
    // Neighborhood quality adjustment
    if (property.neighborhoodQuality) {
      switch (property.neighborhoodQuality) {
        case NeighborhoodQuality.EXCELLENT:
          finalValue *= 1.25;
          break;
        case NeighborhoodQuality.GOOD:
          finalValue *= 1.15;
          break;
        case NeighborhoodQuality.AVERAGE:
          // No change
          break;
        case NeighborhoodQuality.BELOW_AVERAGE:
          finalValue *= 0.9;
          break;
        case NeighborhoodQuality.POOR:
          finalValue *= 0.8;
          break;
      }
    }

    // Amenities adjustment
    if (property.amenities) {
      const amenityRatings = [
        property.amenities.schools,
        property.amenities.parks,
        property.amenities.shopping,
        property.amenities.transportation,
        property.amenities.healthcare
      ];

      const avgRating =
        amenityRatings.reduce((sum, rating) => sum + rating, 0) /
        amenityRatings.length;

      finalValue *= 0.85 + (avgRating / 5) * 0.3;
    }

    // Special features adjustment
    if (property.specialFeatures) {
      const features = property.specialFeatures;
      let featureBonus = 0;

      if (features.swimmingPool) featureBonus += 0.05;
      if (features.garden) featureBonus += 0.03;
      if (features.rooftopTerrace) featureBonus += 0.04;
      if (features.balcony) featureBonus += 0.02;
      if (features.fireplace) featureBonus += 0.01;
      if (features.homeOffice) featureBonus += 0.02;
      if (features.garage) featureBonus += 0.03;
      if (features.outdoorSpaces) featureBonus += 0.02;
      if (features.smartHome) featureBonus += 0.04;
      if (features.securitySystem) featureBonus += 0.02;

      finalValue *= 1.0 + featureBonus;
    }

    // View quality adjustment
    if (property.viewQuality) {
      switch (property.viewQuality) {
        case ViewQuality.SCENIC:
          finalValue *= 1.12;
          break;
        case ViewQuality.WATER:
          finalValue *= 1.15;
          break;
        case ViewQuality.MOUNTAIN:
          finalValue *= 1.1;
          break;
        case ViewQuality.CITY:
          finalValue *= 1.08;
          break;
        case ViewQuality.GARDEN:
          finalValue *= 1.05;
          break;
      }
    }

    // Lot size adjustment (only for houses)
    if (
      property.lotSize &&
      [
        PropertyType.HOUSE,
        PropertyType.VILLA,
        PropertyType.MANSION,
        PropertyType.FARMHOUSE,
        PropertyType.COLONIAL_HOUSE,
        PropertyType.RANCH_HOUSE
      ].includes(propertyType)
    ) {
      // Base lot size for a property type
      const baseLotSize = size * 2;

      // If lot size is bigger than expected, add premium
      if (property.lotSize > baseLotSize) {
        const lotSizeMultiplier =
          1.0 + ((property.lotSize - baseLotSize) / baseLotSize) * 0.2;
        // Cap at 40% increase
        finalValue *= Math.min(lotSizeMultiplier, 1.4);
      }
    }

    // Economic indicators adjustment
    if (property.economicIndicators) {
      const indicators = property.economicIndicators;

      // Lower unemployment is better (5% is neutral)
      const unemploymentEffect = 1.0 - (indicators.unemploymentRate - 5) / 100;

      // Higher job growth is better
      const jobGrowthEffect = 1.0 + indicators.jobGrowth / 100;

      // Higher median income is better (compared to a baseline)
      const baselineIncome = 50000;
      const incomeEffect = Math.min(
        1.3,
        Math.max(0.8, indicators.medianIncome / baselineIncome)
      );

      const economicMultiplier =
        (unemploymentEffect + jobGrowthEffect + incomeEffect) / 3;
      finalValue *= economicMultiplier;
    }

    // Renovation potential adjustment
    if (property.renovationPotential) {
      let renovationPotentialMultiplier = 1.0;
      switch (property.renovationPotential) {
        case RenovationPotential.HIGH:
          renovationPotentialMultiplier = 1.08;
          break;
        case RenovationPotential.MEDIUM:
          renovationPotentialMultiplier = 1.04;
          break;
        case RenovationPotential.LOW:
          renovationPotentialMultiplier = 1.01;
          break;
        case RenovationPotential.NONE:
          renovationPotentialMultiplier = 1.0;
          break;
      }
      finalValue *= renovationPotentialMultiplier;
    }

    // Market trends adjustment
    if (property.marketTrends) {
      const trends = property.marketTrends;

      // Historical appreciation
      const appreciationEffect = 1.0 + trends.historicalAppreciation / 100;

      // Supply - more supply means lower prices
      const supplyEffect = Math.max(0.9, 1.1 - trends.propertySupply / 100);

      // Days on market - longer time means less desirable
      const avgDaysEffect = Math.max(
        0.9,
        1.1 - trends.averageDaysOnMarket / 200
      );

      // Seasonality effect
      const seasonalityEffect = trends.seasonality;

      const marketTrendsMultiplier =
        ((appreciationEffect + supplyEffect + avgDaysEffect) / 3) *
        seasonalityEffect;

      finalValue *= marketTrendsMultiplier;
    }
  }

  // Return the final value, rounded to nearest whole number
  return Math.round(finalValue);
};

"use client";
import {
  Location,
  PropertyType,
  Property,
  ADJECTIVES,
  NeighborhoodQuality,
  ViewQuality,
  RenovationPotential,
  Amenities,
  SpecialFeatures,
  EconomicIndicators,
  MarketTrends
} from "../types";
import { calculateMaintenanceCost } from "./calculateMaintenanceCost.util";
import { calculateRent } from "./calculateRent.util";
import { calculateValue } from "./calculateValue.util";

const getRandomAdjective = (): string => {
  const randomIndex = Math.floor(Math.random() * ADJECTIVES.length);
  return ADJECTIVES[randomIndex];
};
const getRandomLocation = (): Location => {
  const locations = Object.values(Location);
  const randomIndex = Math.floor(Math.random() * locations.length);
  return locations[randomIndex];
};

// Function get random number of rooms based on location and property type
const getRandomRooms = (
  location: Location,
  propertyType: PropertyType
): number | null => {
  // Land properties don't have rooms
  if (propertyType === PropertyType.LAND) {
    return null;
  }

  let minRooms = 1;
  let maxRooms = 5;

  // Set appropriate room ranges based on property type first
  if (
    [
      PropertyType.MANSION,
      PropertyType.VILLA,
      PropertyType.COLONIAL_HOUSE,
      PropertyType.FARMHOUSE
    ].includes(propertyType)
  ) {
    minRooms = 4;
    maxRooms = 10;
  } else if (
    [
      PropertyType.HOUSE,
      PropertyType.RANCH_HOUSE,
      PropertyType.BUNGALOW,
      PropertyType.DUPLEX
    ].includes(propertyType)
  ) {
    minRooms = 3;
    maxRooms = 6;
  } else if (
    [PropertyType.TINY_HOME, PropertyType.MOBILE_HOME].includes(propertyType)
  ) {
    minRooms = 1;
    maxRooms = 2;
  } else if (
    PropertyType.COMMERCIAL === propertyType ||
    PropertyType.INDUSTRIAL === propertyType ||
    PropertyType.MIXED_USE === propertyType
  ) {
    // For commercial spaces, rooms refer to office/retail units
    minRooms = 1;
    maxRooms = 20;
  }

  // Further adjust based on location if needed
  switch (location) {
    case Location.DOWNTOWN:
      if (propertyType === PropertyType.APARTMENT) {
        minRooms = 1;
        maxRooms = 3;
      } else if (propertyType === PropertyType.CONDO) {
        minRooms = 2;
        maxRooms = 4;
      }
      break;
    case Location.URBAN:
      if (propertyType === PropertyType.TOWNHOUSE) {
        minRooms = 3;
        maxRooms = 6;
      }
      break;
    case Location.COUNTRY:
      // Country properties tend to be larger
      minRooms = Math.max(minRooms, 2);
      maxRooms = Math.max(maxRooms, maxRooms + 2);
      break;
    default:
      break;
  }

  return Math.floor(Math.random() * (maxRooms - minRooms + 1)) + minRooms;
};

// Function get random size based on location and property type
const getRandomSize = (
  location: Location,
  propertyType: PropertyType
): number => {
  let minSize = 10;
  let maxSize = 300;

  // For land type, set much larger sizes
  if (propertyType === PropertyType.LAND) {
    minSize = 1000; // Minimum 1000 sq meters
    maxSize = 10000; // Up to 10,000 sq meters (1 hectare)

    // Even larger for country land
    if (location === Location.COUNTRY) {
      minSize = 5000;
      maxSize = 50000; // Up to 5 hectares
    }

    // Return land size early since it's handled differently
    return Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
  }

  // Normal property types
  switch (location) {
    case Location.DOWNTOWN:
      if (propertyType === PropertyType.APARTMENT) {
        minSize = 30;
        maxSize = 100;
      } else if (propertyType === PropertyType.CONDO) {
        minSize = 50;
        maxSize = 150;
      }
      break;
    case Location.URBAN:
      if (propertyType === PropertyType.TOWNHOUSE) {
        minSize = 70;
        maxSize = 200;
      }
      break;
    case Location.SUBURBAN:
      if (propertyType === PropertyType.HOUSE) {
        minSize = 100;
        maxSize = 300;
      }
      break;
    case Location.COUNTRY:
      if (propertyType === PropertyType.FARMHOUSE) {
        minSize = 150;
        maxSize = 400;
      }
      break;
    default:
      break;
  }

  return Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize; // Random size between min and max
};

// Function to get a random property type based on location
const getRandomPropertyType = (location: Location): PropertyType => {
  let allowedPropertyTypes: PropertyType[] = [];
  switch (location) {
    case Location.DOWNTOWN:
      allowedPropertyTypes = [
        PropertyType.APARTMENT,
        PropertyType.CONDO,
        PropertyType.SKYSCRAPER_CONDO,
        PropertyType.COMMERCIAL,
        PropertyType.MIXED_USE,
        PropertyType.LAND
      ];
      break;
    case Location.URBAN:
      allowedPropertyTypes = [
        PropertyType.APARTMENT,
        PropertyType.CONDO,
        PropertyType.TOWNHOUSE,
        PropertyType.COMMERCIAL,
        PropertyType.INDUSTRIAL,
        PropertyType.LAND,
        PropertyType.MIXED_USE,
        PropertyType.TOWNHOUSE
      ];
      break;
    case Location.SUBURBAN:
      allowedPropertyTypes = [
        PropertyType.HOUSE,
        PropertyType.APARTMENT,
        PropertyType.LAND,
        PropertyType.MOBILE_HOME,
        PropertyType.RANCH_HOUSE,
        PropertyType.COLONIAL_HOUSE,
        PropertyType.DUPLEX,
        PropertyType.ROW_HOUSE,
        PropertyType.VILLA,
        PropertyType.BUNGALOW,
        PropertyType.MANSION,
        PropertyType.TINY_HOME,
        PropertyType.HOUSEBOAT,
        PropertyType.CHALET
      ];
      break;
    case Location.COUNTRY:
      allowedPropertyTypes = [
        PropertyType.HOUSE,
        PropertyType.FARMHOUSE,
        PropertyType.COTTAGE,
        PropertyType.BUNGALOW,
        PropertyType.CHALET,
        PropertyType.LAND,
        PropertyType.VACATION,
        PropertyType.HOUSEBOAT,
        PropertyType.CABIN,
        PropertyType.MANSION,
        PropertyType.TINY_HOME,
        PropertyType.RANCH_HOUSE,
        PropertyType.COLONIAL_HOUSE,
        PropertyType.FARMHOUSE
      ];
      break;
    default:
      allowedPropertyTypes = [
        PropertyType.HOUSE,
        PropertyType.APARTMENT,
        PropertyType.COMMERCIAL,
        PropertyType.LAND,
        PropertyType.VACATION
      ];
      break;
  }
  // If no specific property types are allowed for the location, return a random property type
  if (allowedPropertyTypes.length === 0) {
    return getRandomPropertyType(location);
  }
  // Otherwise, return a random property type from the allowed list
  const randomIndex = Math.floor(Math.random() * allowedPropertyTypes.length);
  return allowedPropertyTypes[randomIndex];
};

// Generate random neighborhood quality biased by location
const getRandomNeighborhoodQuality = (
  location: Location
): NeighborhoodQuality => {
  const qualities = Object.values(NeighborhoodQuality);

  // Bias probabilities based on location
  let probabilities: number[];
  switch (location) {
    case Location.DOWNTOWN:
      probabilities = [0.3, 0.4, 0.2, 0.07, 0.03]; // Higher chance of excellent/good
      break;
    case Location.URBAN:
      probabilities = [0.2, 0.3, 0.3, 0.15, 0.05];
      break;
    case Location.SUBURBAN:
      probabilities = [0.15, 0.35, 0.35, 0.1, 0.05];
      break;
    case Location.COUNTRY:
      probabilities = [0.1, 0.25, 0.4, 0.15, 0.1];
      break;
    default:
      probabilities = [0.2, 0.2, 0.2, 0.2, 0.2]; // Equal distribution
  }

  const random = Math.random();
  let cumulativeProbability = 0;

  for (let i = 0; i < qualities.length; i++) {
    cumulativeProbability += probabilities[i];
    if (random < cumulativeProbability) {
      return qualities[i];
    }
  }

  return NeighborhoodQuality.AVERAGE;
};

// Generate random view quality based on location and property type
const getRandomViewQuality = (
  location: Location,
  propertyType: PropertyType
): ViewQuality => {
  const views = Object.values(ViewQuality);

  // Remove "NONE" from potential options to ensure it's handled separately
  const potentialViews = views.filter((view) => view !== ViewQuality.NONE);

  // Probability of having any view at all (vs NONE)
  let viewProbability = 0.3; // Default

  if (
    [
      PropertyType.MANSION,
      PropertyType.VILLA,
      PropertyType.SKYSCRAPER_CONDO
    ].includes(propertyType)
  ) {
    viewProbability = 0.8; // Luxury properties more likely to have views
  } else if (location === Location.COUNTRY) {
    viewProbability = 0.6; // Country properties more likely to have views
  } else if (location === Location.DOWNTOWN) {
    viewProbability = 0.5; // Downtown properties often have city views
  }

  if (Math.random() > viewProbability) {
    return ViewQuality.NONE;
  }

  // Select a specific view type with higher probabilities for certain combinations
  if (location === Location.COUNTRY) {
    if (Math.random() < 0.7) {
      return Math.random() < 0.6 ? ViewQuality.SCENIC : ViewQuality.MOUNTAIN;
    }
  } else if (location === Location.DOWNTOWN) {
    if (Math.random() < 0.8) {
      return ViewQuality.CITY;
    }
  }

  // Otherwise random
  const randomIndex = Math.floor(Math.random() * potentialViews.length);
  return potentialViews[randomIndex];
};

// Generate random amenities scores based on location
const getRandomAmenities = (location: Location): Amenities => {
  // Base scores for each location type
  const baseScores = {
    [Location.DOWNTOWN]: {
      schools: 3,
      parks: 2,
      shopping: 5,
      transportation: 5,
      healthcare: 4
    },
    [Location.URBAN]: {
      schools: 3.5,
      parks: 3,
      shopping: 4,
      transportation: 4,
      healthcare: 3.5
    },
    [Location.SUBURBAN]: {
      schools: 4,
      parks: 4,
      shopping: 3,
      transportation: 2.5,
      healthcare: 3
    },
    [Location.COUNTRY]: {
      schools: 2,
      parks: 5,
      shopping: 1.5,
      transportation: 1,
      healthcare: 1.5
    }
  };

  // Add random variation to each score (±1)
  const getAdjustedScore = (baseScore: number) => {
    const variation = Math.random() * 2 - 1; // -1 to +1
    return Math.max(0, Math.min(5, baseScore + variation));
  };

  const base = baseScores[location];
  return {
    schools: getAdjustedScore(base.schools),
    parks: getAdjustedScore(base.parks),
    shopping: getAdjustedScore(base.shopping),
    transportation: getAdjustedScore(base.transportation),
    healthcare: getAdjustedScore(base.healthcare)
  };
};

// Generate random special features based on property type and value tier
const getRandomSpecialFeatures = (
  propertyType: PropertyType,
  valueTier: number
): SpecialFeatures => {
  // valueTier from 0-1, representing how high-end the property is

  // Base chances for each feature
  const baseFeatures: SpecialFeatures = {
    swimmingPool: false,
    garden: false,
    rooftopTerrace: false,
    balcony: false,
    fireplace: false,
    homeOffice: false,
    garage: false,
    outdoorSpaces: false,
    smartHome: false,
    securitySystem: false
  };

  // Adjust chances based on property type
  const getChance = (baseChance: number, propertyCompatibility: number) => {
    return baseChance * propertyCompatibility * (0.2 + valueTier * 0.8);
  };

  // These map property types to compatibility with various features (0-1)
  const propertyCompatibility = {
    swimmingPool: {
      [PropertyType.HOUSE]: 0.6,
      [PropertyType.MANSION]: 0.9,
      [PropertyType.VILLA]: 0.8
      // Default is 0.1
    },
    garden: {
      [PropertyType.HOUSE]: 0.8,
      [PropertyType.FARMHOUSE]: 0.9,
      [PropertyType.COTTAGE]: 0.8,
      [PropertyType.VILLA]: 0.9,
      [PropertyType.MANSION]: 0.9
      // Default is 0.2
    }
    // ... and so on for other features
  };

  // Set probabilities for each feature
  baseFeatures.swimmingPool =
    Math.random() <
    getChance(
      0.3,
      propertyCompatibility.swimmingPool[
        propertyType as keyof typeof propertyCompatibility.swimmingPool
      ] || 0.1
    );
  baseFeatures.garden =
    Math.random() <
    getChance(
      0.5,
      propertyCompatibility.garden[
        propertyType as keyof typeof propertyCompatibility.garden
      ] || 0.2
    );
  baseFeatures.rooftopTerrace =
    Math.random() <
    (propertyType === PropertyType.SKYSCRAPER_CONDO ? 0.6 : 0.1) * valueTier;
  baseFeatures.balcony =
    Math.random() <
    ([PropertyType.APARTMENT, PropertyType.CONDO].includes(propertyType)
      ? 0.7
      : 0.3) *
      valueTier;
  baseFeatures.fireplace = Math.random() < 0.4 * valueTier;
  baseFeatures.homeOffice = Math.random() < 0.5 * valueTier;
  baseFeatures.garage =
    Math.random() <
    ([PropertyType.HOUSE, PropertyType.VILLA, PropertyType.MANSION].includes(
      propertyType
    )
      ? 0.8
      : 0.2) *
      valueTier;
  baseFeatures.outdoorSpaces = Math.random() < 0.6 * valueTier;
  baseFeatures.smartHome = Math.random() < 0.3 * valueTier;
  baseFeatures.securitySystem = Math.random() < 0.4 * valueTier;

  return baseFeatures;
};

// Generate random renovation potential based on property age and type
const getRandomRenovationPotential = (
  buildingDate: Date,
  propertyType: PropertyType
): RenovationPotential => {
  // Land doesn't have traditional renovation potential
  if (propertyType === PropertyType.LAND) {
    // For land, "renovation potential" represents development potential
    const developmentPotential = Math.random();
    if (developmentPotential < 0.3) {
      return RenovationPotential.HIGH; // High development potential
    } else if (developmentPotential < 0.6) {
      return RenovationPotential.MEDIUM; // Medium development potential
    } else if (developmentPotential < 0.8) {
      return RenovationPotential.LOW; // Low development potential
    } else {
      return RenovationPotential.NONE; // Protected land or difficult to develop
    }
  }

  const propertyAge = new Date().getFullYear() - buildingDate.getFullYear();

  if (propertyAge < 5) {
    return Math.random() < 0.1
      ? RenovationPotential.LOW
      : RenovationPotential.NONE;
  } else if (propertyAge < 15) {
    return Math.random() < 0.7
      ? RenovationPotential.LOW
      : RenovationPotential.MEDIUM;
  } else if (propertyAge < 30) {
    return Math.random() < 0.6
      ? RenovationPotential.MEDIUM
      : RenovationPotential.HIGH;
  } else {
    return RenovationPotential.HIGH;
  }
};

// Generate economic indicators based on location
const getRandomEconomicIndicators = (
  location: Location
): EconomicIndicators => {
  // Base rates that vary by location
  let baseUnemployment, baseJobGrowth, basePopulation, baseMedianIncome;

  switch (location) {
    case Location.DOWNTOWN:
      baseUnemployment = 4;
      baseJobGrowth = 2.3;
      basePopulation = 500000;
      baseMedianIncome = 75000;
      break;
    case Location.URBAN:
      baseUnemployment = 4.5;
      baseJobGrowth = 1.8;
      basePopulation = 300000;
      baseMedianIncome = 60000;
      break;
    case Location.SUBURBAN:
      baseUnemployment = 3.8;
      baseJobGrowth = 1.5;
      basePopulation = 150000;
      baseMedianIncome = 80000;
      break;
    case Location.COUNTRY:
      baseUnemployment = 5.2;
      baseJobGrowth = 0.8;
      basePopulation = 50000;
      baseMedianIncome = 55000;
      break;
  }

  // Add random variation
  const unemploymentRate = baseUnemployment + (Math.random() * 2 - 1);
  const jobGrowth = baseJobGrowth + (Math.random() * 1 - 0.5);
  const population = Math.round(basePopulation * (0.9 + Math.random() * 0.2));
  const medianIncome = Math.round(
    baseMedianIncome * (0.9 + Math.random() * 0.2)
  );

  return { unemploymentRate, jobGrowth, population, medianIncome };
};

// Generate market trends data
const getRandomMarketTrends = (
  location: Location,
  propertyType: PropertyType,
  existingProperties: Property[] = []
): MarketTrends => {
  // Base appreciation rate by location
  let baseAppreciation;
  switch (location) {
    case Location.DOWNTOWN:
      baseAppreciation = 3.5;
      break;
    case Location.URBAN:
      baseAppreciation = 2.8;
      break;
    case Location.SUBURBAN:
      baseAppreciation = 2.5;
      break;
    case Location.COUNTRY:
      baseAppreciation = 1.8;
      break;
    default:
      baseAppreciation = 2.0;
  }

  // Adjust based on property type
  if (
    [PropertyType.COMMERCIAL, PropertyType.MIXED_USE].includes(propertyType)
  ) {
    baseAppreciation += 0.5;
  } else if (
    [PropertyType.MANSION, PropertyType.VILLA].includes(propertyType)
  ) {
    baseAppreciation += 0.3;
  }

  // Calculate property supply based on actual listings
  const similarListings = existingProperties.filter(
    (p) =>
      p.type === propertyType && p.location === location && p.owner === null
  );

  // Use actual supply count or fall back to random if none exist
  const propertySupply =
    similarListings.length > 0
      ? similarListings.length
      : Math.floor(Math.random() * 25) + 5; // 5-30 properties

  // Calculate average days on market for similar properties
  const relevantProperties = existingProperties.filter(
    (p) => p.type === propertyType && p.location === location
  );

  let averageDaysOnMarket;

  if (relevantProperties.length > 0) {
    const totalDaysOnMarket = relevantProperties.reduce((sum, property) => {
      // Get days on market based on listedDate or timeOnMarket property
      const daysOnMarket =
        property.timeOnMarket ||
        Math.ceil(
          (new Date().getTime() - property.listedDate.getTime()) /
            (24 * 60 * 60 * 1000)
        );
      return sum + daysOnMarket;
    }, 0);

    averageDaysOnMarket = Math.max(
      5, // Minimum days on market
      Math.ceil(totalDaysOnMarket / relevantProperties.length)
    );
  } else {
    // Fall back to random if no relevant properties
    averageDaysOnMarket = Math.floor(Math.random() * 60) + 20; // 20-80 days
  }

  // Seasonal effect (assume current date for seasonality)
  const currentMonth = new Date().getMonth();
  let seasonality = 1.0;

  // Spring & fall are hot seasons, winter is slow
  if (currentMonth >= 2 && currentMonth <= 4) {
    // Spring
    seasonality = 1.1;
  } else if (currentMonth >= 8 && currentMonth <= 10) {
    // Fall
    seasonality = 1.05;
  } else if (currentMonth >= 11 || currentMonth <= 1) {
    // Winter
    seasonality = 0.9;
  }

  return {
    historicalAppreciation: baseAppreciation + (Math.random() * 2 - 1), // ±1% random variation
    propertySupply,
    averageDaysOnMarket,
    seasonality
  };
};

// Function to generate a random lot size based on property type
const getRandomLotSize = (
  propertyType: PropertyType,
  size: number
): number | undefined => {
  if (
    ![
      PropertyType.HOUSE,
      PropertyType.VILLA,
      PropertyType.MANSION,
      PropertyType.FARMHOUSE,
      PropertyType.COLONIAL_HOUSE,
      PropertyType.RANCH_HOUSE
    ].includes(propertyType)
  ) {
    return undefined; // Only certain property types have lot sizes
  }

  // Base multiplier for the building size
  let baseMultiplier = 3;

  switch (propertyType) {
    case PropertyType.MANSION:
      baseMultiplier = 10;
      break;
    case PropertyType.VILLA:
      baseMultiplier = 7;
      break;
    case PropertyType.FARMHOUSE:
      baseMultiplier = 20;
      break;
    case PropertyType.RANCH_HOUSE:
      baseMultiplier = 15;
      break;
    default:
      baseMultiplier = 3;
  }

  // Add random variation
  const variation = 0.5 + Math.random();
  return Math.round(size * baseMultiplier * variation);
};

// Function to generate a random property
export const generateRandomProperty = (
  id: number,
  existingProperties: Property[] = []
): Property => {
  const location = getRandomLocation();
  const adjective = getRandomAdjective();
  const address = `${Math.round(
    Math.random() * 9999
  )} ${adjective} St, ${location}`;
  const type = getRandomPropertyType(location);
  const buildingDate = new Date(
    Date.now() - Math.floor(Math.random() * 100 * 365 * 24 * 60 * 60 * 1000)
  ); // Random date within the last 100 years
  const maintenance = "Needs some repairs";
  const renovationBonusPercentage = Math.min(
    Math.floor(Math.random() * 101),
    100
  );
  const size = getRandomSize(location, type);
  const rooms = getRandomRooms(location, type);

  // Generate new property attributes
  const neighborhoodQuality = getRandomNeighborhoodQuality(location);
  const viewQuality = getRandomViewQuality(location, type);
  const amenities = getRandomAmenities(location);
  const lotSize = getRandomLotSize(type, size);
  const renovationPotential = getRandomRenovationPotential(buildingDate, type);
  const economicIndicators = getRandomEconomicIndicators(location);
  const marketTrends = getRandomMarketTrends(
    location,
    type,
    existingProperties
  );

  // Calculate value based on all factors
  const propertyAge = new Date().getFullYear() - buildingDate.getFullYear();

  // Create partial property to pass to calculation function
  const propertyForCalc = {
    neighborhoodQuality,
    viewQuality,
    amenities,
    lotSize,
    renovationPotential,
    economicIndicators,
    marketTrends
  };

  // Calculate a value tier for special features (0-1, how luxurious the property is)
  const valueTier =
    ((neighborhoodQuality === NeighborhoodQuality.EXCELLENT
      ? 1
      : neighborhoodQuality === NeighborhoodQuality.GOOD
      ? 0.8
      : neighborhoodQuality === NeighborhoodQuality.AVERAGE
      ? 0.6
      : neighborhoodQuality === NeighborhoodQuality.BELOW_AVERAGE
      ? 0.4
      : 0.2) +
      ([PropertyType.MANSION, PropertyType.VILLA].includes(type) ? 0.3 : 0) +
      (location === Location.DOWNTOWN ? 0.2 : 0)) /
    1.5; // Normalize to 0-1 range

  const specialFeatures = getRandomSpecialFeatures(type, valueTier);

  // Calculate final value with all factors
  const value = calculateValue(
    size,
    type,
    location,
    propertyAge,
    renovationBonusPercentage,
    undefined, // market conditions
    { ...propertyForCalc, specialFeatures }
  );

  const marketPrice = Math.floor(value * (0.9 + Math.random() * 0.2)); // ±10% of actual value
  const owner = null;
  const timeOnMarket = Math.floor(Math.random() * (90 - 1 + 1)) + 1;
  const maintenanceCosts = calculateMaintenanceCost(location, size, value);
  const intendedPurpose = Math.random() < 0.5 ? "Housing" : "Business";
  const rentPrice = calculateRent(
    location,
    size,
    renovationBonusPercentage / 100
  );
  const isRented = false; // Start as not rented
  const rentee = null;
  const listedDate = new Date(); // Current date as listing date
  const isNew = true; // Flag as new property

  // Add more enticing descriptions for new properties to catch attention
  const propertyAdjectives = [
    "hot new",
    "just listed",
    "must-see",
    "unbeatable",
    "prime",
    "premium",
    "desirable",
    "rare find"
  ];
  const randomAdjectiveIndex = Math.floor(
    Math.random() * propertyAdjectives.length
  );
  const marketingAdjective = propertyAdjectives[randomAdjectiveIndex];

  // Enhanced description for new properties
  let enhancedDesc;
  if (type === PropertyType.LAND) {
    enhancedDesc = `${marketingAdjective} ${size.toLocaleString()} m² ${type} with ${renovationPotential} development potential in ${location}.`;
  } else {
    enhancedDesc = `${marketingAdjective} ${adjective} ${type} with ${rooms} ${
      rooms === 1 ? "room" : "rooms"
    } located in ${location}.`;
  }

  // Return properly structured property
  return {
    id,
    address,
    value,
    type,
    description: enhancedDesc,
    adjective,
    buildingDate,
    maintenance,
    marketPrice,
    renovationBonusPercentage,
    size,
    rooms,
    location,
    owner,
    timeOnMarket,
    maintenanceCosts,
    intendedPurpose,
    rentPrice,
    isRented,
    rentee,
    neighborhoodQuality,
    amenities,
    specialFeatures,
    viewQuality,
    lotSize,
    renovationPotential,
    economicIndicators,
    marketTrends,
    listedDate,
    isNew,
    tenantHistory: [],
    tenantEvents: [],
    leaseApplications: []
  };
};

export const generateRandomProperties = (numProperties: number): Property[] => {
  const properties: Property[] = [];
  for (let i = 0; i < numProperties; i++) {
    const property = generateRandomProperty(i, properties);
    properties.push(property);
  }
  return properties;
};

import {
  EventImpactType,
  GameEvent,
  LeaseApplication,
  Property,
  Tenant
} from "../types";
import { calculateEventImpact } from "./events.util";
import {
  calculateListingImpact,
  generateLeaseApplications
} from "./generateTenant.util";
import { listingAdCost, propertyListingKeywords } from "./listings.util";
import { calculateRentPriceImpact } from "./rent.util";
import { deriveUnitCount } from "./units.util";

export interface PropertyManager {
  efficiency: number; // Value between 0 and 1 representing the efficiency of the property manager
  fee: number; // Monthly fee charged by the property manager
  hired: boolean; // Whether the property manager is hired or not
  listingFees?: number; // Total listing fees charged
  tenantFees?: number; // Total tenant placement fees charged
}

export const selectBestApplication = (
  applications: LeaseApplication[],
  rentPrice: number
): LeaseApplication | null => {
  if (applications.length === 0) return null;

  return applications.reduce((best, current) => {
    const bestScore =
      best.tenant.creditScore +
      (rentPrice > 0 ? (best.tenant.monthlyIncome / rentPrice) * 100 : 0);
    const currentScore =
      current.tenant.creditScore +
      (rentPrice > 0 ? (current.tenant.monthlyIncome / rentPrice) * 100 : 0);

    return currentScore > bestScore ? current : best;
  }, applications[0]);
};

export const findNewTenantsWithPropertyManager = ({
  events,
  property,
  propertyManager,
  unitTenants,
  ownedCount,
  propertyTax,
  newDate,
  updatedPropertyBase
}: {
  events: GameEvent[];
  property: Property;
  propertyManager: PropertyManager;
  unitTenants: Tenant[];
  ownedCount: number;
  propertyTax: number;
  newDate: Date;
  updatedPropertyBase: Property;
}): Property => {
  const portfolioPenalty = Math.min(0.25, Math.max(0, (ownedCount - 3) * 0.03));
  const tenantQualityImpact = calculateEventImpact(
    events.filter((e) => e.isActive),
    EventImpactType.TENANT_QUALITY,
    property.location,
    property.type
  );
  const areaImpact = calculateEventImpact(
    events.filter((e) => e.isActive),
    EventImpactType.AREA_QUALITY,
    property.location,
    property.type
  );
  const listingKeywords = propertyListingKeywords({ property });
  const listingImpact = calculateListingImpact(listingKeywords);
  const rentPriceImpact = calculateRentPriceImpact({ property });
  const unitCount = deriveUnitCount(property);
  const occupedUnits = unitTenants.length;
  const vacancies = Math.max(0, unitCount - occupedUnits);

  const baseApplicationCount =
    (4 + Math.floor(Math.random() * 5)) * Math.max(1, vacancies);
  const applicantMultiplier =
    1 +
    tenantQualityImpact +
    areaImpact +
    listingImpact.count +
    rentPriceImpact.count -
    portfolioPenalty +
    propertyManager.efficiency * 0.05;
  const rawApplicationCount = Math.max(
    0,
    Math.round(baseApplicationCount * applicantMultiplier)
  );
  const rentRatio =
    rentPriceImpact.marketRent > 0
      ? property.rentPrice / rentPriceImpact.marketRent
      : 1;
  const ratioPenalty = Math.min(0.9, Math.max(0, (rentRatio - 1) * 0.12));
  const applicationProbability = Math.min(
    0.9,
    Math.max(0, 0.65 + applicantMultiplier * 0.2 - ratioPenalty)
  );
  const adjustedApplicationCount =
    Math.random() < applicationProbability ? rawApplicationCount : 0;

  if (adjustedApplicationCount > 0) {
    propertyManager.listingFees !== undefined
      ? (propertyManager.listingFees += listingAdCost({ property, vacancies }))
      : 0;
  }

  const applications = generateLeaseApplications(
    property.rentPrice,
    adjustedApplicationCount,
    tenantQualityImpact +
      areaImpact +
      listingImpact.quality +
      rentPriceImpact.quality,
    listingKeywords
  );
  const bestApplication = selectBestApplication(
    applications,
    property.rentPrice
  );

  if (!bestApplication) {
    return {
      ...updatedPropertyBase,
      propertyTax
    };
  }

  propertyManager.tenantFees !== undefined
    ? (propertyManager.tenantFees += Math.round(property.rentPrice * 0.5))
    : 0;
  propertyManager.listingFees !== undefined
    ? (propertyManager.listingFees += listingAdCost({ property, vacancies }))
    : 0;

  const acceptedTenant = {
    ...bestApplication.tenant,
    leaseStart: new Date(newDate)
  };
  const updatedTenants = [...unitTenants, acceptedTenant].slice(0, unitCount);

  return {
    ...updatedPropertyBase,
    unitTenants: updatedTenants,
    occupiedUnits: updatedTenants.length,
    isRented: updatedTenants.length > 0,
    rentee: updatedTenants[0]?.name ?? null,
    currentTenant: updatedTenants[0],
    leaseStart: new Date(newDate),
    leaseLength: bestApplication.desiredLeaseLength,
    leaseApplications: [],
    propertyTax
  };
};

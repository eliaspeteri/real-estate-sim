import { Property } from "../types";
import { extractListingKeywords } from "./generateTenant.util";

export const listingAdCost = ({
  property,
  vacancies
}: {
  property: Property;
  vacancies: number;
}) => {
  const base = 150;
  const perUnit = Math.round(property.rentPrice * 0.08);
  return Math.max(base, perUnit * Math.max(1, vacancies));
};

export const propertyListingKeywords = ({
  property
}: {
  property: Property;
}) => {
  const copyKeywords = extractListingKeywords(property.listingCopy || "");
  return Array.from(
    new Set([...(property.listingKeywords || []), ...copyKeywords])
  );
};

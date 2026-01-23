import React, { useState, useMemo, useEffect } from "react";
import PropertyCard from "../property-card.component";
import { LeaseApplication, Property, PropertyType } from "../../types";
import { FiFilter } from "react-icons/fi";

interface ListingsProps {
  properties: Property[];
  onBuyOrSell: (propertyId: number) => void;
  onRent: (propertyId: number, options?: { showModal?: boolean }) => void;
  onRenovate: (propertyId: number) => void;
  onRenovateToMax?: (propertyId: number) => void;
  onEvictTenant?: (propertyId: number, tenantId?: string) => void;
  currentDate?: Date;
  playerMoney: number;
  onUpdateListing?: (
    propertyId: number,
    listingKeywords: Property["listingKeywords"]
  ) => void;
  onUpdateListingCopy?: (propertyId: number, listingCopy: string) => void;
  onUpdateRentPrice?: (propertyId: number, rentPrice: number) => void;
  onAcceptOffer?: (propertyId: number, offerId: string) => void;
  onBulldoze?: (propertyId: number) => void;
  getRenovateToMaxCost?: (property: Property) => number;
  onApplyPermit?: (propertyId: number) => void;
  onStartConstruction?: (propertyId: number) => void;
  onRaiseFunds?: (propertyId: number) => void;
  handleAcceptApplication?: (
    property: Property,
    application: LeaseApplication
  ) => void;
  setPaused?: (paused: boolean) => void;
}

// Sorting options type
type SortOption =
  | "newest"
  | "oldest"
  | "price-asc"
  | "price-desc"
  | "size-asc"
  | "size-desc"
  | "default";

type SpecialFeatureKey = keyof Property["specialFeatures"];

const FILTER_STORAGE_KEY = "real-estate-sim.market-filters";

type PricePerSqmBucket = "lt-1000" | "1000-2000" | "2000-3500" | "3500-5000" | "gt-5000";
type RenovationTier = "new" | "some-repairs" | "major-repairs" | "bulldoze";

const FEATURE_OPTIONS: { key: SpecialFeatureKey; label: string }[] = [
  { key: "swimmingPool", label: "Pool" },
  { key: "garden", label: "Garden" },
  { key: "balcony", label: "Balcony" },
  { key: "garage", label: "Garage" },
  { key: "homeOffice", label: "Home Office" },
  { key: "smartHome", label: "Smart Home" },
  { key: "fireplace", label: "Fireplace" },
  { key: "securitySystem", label: "Security System" }
];

const PRICE_PER_SQM_BUCKETS: { value: PricePerSqmBucket; label: string }[] = [
  { value: "lt-1000", label: "Under 1k/m²" },
  { value: "1000-2000", label: "1k-2k/m²" },
  { value: "2000-3500", label: "2k-3.5k/m²" },
  { value: "3500-5000", label: "3.5k-5k/m²" },
  { value: "gt-5000", label: "5k+/m²" }
];

const RENOVATION_TIERS: { value: RenovationTier; label: string }[] = [
  { value: "new", label: "New / Like new" },
  { value: "some-repairs", label: "Needs some repairs" },
  { value: "major-repairs", label: "Needs major repairs" },
  { value: "bulldoze", label: "Bulldoze condition" }
];

export const Listings = ({
  properties,
  onBuyOrSell,
  onRent,
  onRenovate,
  onRenovateToMax,
  onEvictTenant,
  currentDate,
  playerMoney,
  onUpdateListing,
  onUpdateListingCopy,
  onUpdateRentPrice,
  onAcceptOffer,
  onBulldoze,
  getRenovateToMaxCost,
  onApplyPermit,
  onStartConstruction,
  onRaiseFunds,
  handleAcceptApplication,
  setPaused
}: ListingsProps) => {
  // Sorting state
  const [sortOrder, setSortOrder] = useState<SortOption>("newest");

  // Filter panel visibility (kept open)
  const [showFilters, setShowFilters] = useState<boolean>(true);

  // Filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<PropertyType[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<SpecialFeatureKey[]>(
    []
  );
  const [selectedPricePerSqmBuckets, setSelectedPricePerSqmBuckets] = useState<
    PricePerSqmBucket[]
  >([]);
  const [selectedRenovationTier, setSelectedRenovationTier] =
    useState<RenovationTier | "">("");

  // Calculate available filter options from properties
  const filterOptions = useMemo(() => {
    const locations = new Set<string>();
    const types = new Set<PropertyType>();
    let minPrice = Number.MAX_VALUE;
    let maxPrice = 0;

    properties.forEach((property) => {
      if (property.owner === null) {
        locations.add(property.location);
        types.add(property.type);
        minPrice = Math.min(minPrice, property.marketPrice);
        maxPrice = Math.max(maxPrice, property.marketPrice);
      }
    });

    return {
      locations: Array.from(locations).sort(),
      types: Array.from(types).sort((a, b) => a.localeCompare(b)),
      priceRange: [
        minPrice === Number.MAX_VALUE ? 0 : minPrice,
        maxPrice === 0 ? 10000000 : maxPrice
      ] as [number, number]
    };
  }, [properties]);

  // Reset filters to default values
  const resetFilters = () => {
    setPriceRange(filterOptions.priceRange);
    setSelectedLocations([]);
    setSelectedTypes([]);
    setSelectedFeatures([]);
    setSelectedPricePerSqmBuckets([]);
    setSelectedRenovationTier("");
  };

  useEffect(() => {
    const stored = window.localStorage.getItem(FILTER_STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as {
        priceRange?: [number, number];
        selectedLocations?: string[];
        selectedTypes?: PropertyType[];
        selectedFeatures?: SpecialFeatureKey[];
        selectedPricePerSqmBuckets?: PricePerSqmBucket[];
        selectedRenovationTier?: RenovationTier | "";
        sortOrder?: SortOption;
        showFilters?: boolean;
      };
      if (parsed.priceRange) setPriceRange(parsed.priceRange);
      if (parsed.selectedLocations) setSelectedLocations(parsed.selectedLocations);
      if (parsed.selectedTypes) setSelectedTypes(parsed.selectedTypes);
      if (parsed.selectedFeatures) setSelectedFeatures(parsed.selectedFeatures);
      if (parsed.selectedPricePerSqmBuckets)
        setSelectedPricePerSqmBuckets(parsed.selectedPricePerSqmBuckets);
      if (parsed.selectedRenovationTier)
        setSelectedRenovationTier(parsed.selectedRenovationTier);
      if (parsed.sortOrder) setSortOrder(parsed.sortOrder);
      if (parsed.showFilters !== undefined) setShowFilters(parsed.showFilters);
    } catch {
      // Ignore malformed stored filters.
    }
  }, []);

  useEffect(() => {
    const [min, max] = filterOptions.priceRange;
    setPriceRange((prev) => [Math.max(min, prev[0]), Math.min(max, prev[1])]);
  }, [filterOptions.priceRange]);

  useEffect(() => {
    const payload = {
      priceRange,
      selectedLocations,
      selectedTypes,
      selectedFeatures,
      selectedPricePerSqmBuckets,
      selectedRenovationTier,
      sortOrder,
      showFilters
    };
    window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(payload));
  }, [
    priceRange,
    selectedLocations,
    selectedTypes,
    selectedFeatures,
    selectedPricePerSqmBuckets,
    selectedRenovationTier,
    sortOrder,
    showFilters
  ]);

  // Apply filtering and sorting
  const filteredAndSortedProperties = useMemo(() => {
    // First filter properties
    const filtered = properties.filter((property) => {
      // Only show market listings (not owned)
      if (property.owner !== null) return false;

      // Price filter
      if (
        property.marketPrice < priceRange[0] ||
        property.marketPrice > priceRange[1]
      )
        return false;

      // Location filter
      if (
        selectedLocations.length > 0 &&
        !selectedLocations.includes(property.location)
      )
        return false;

      // Property type filter
      if (selectedTypes.length > 0 && !selectedTypes.includes(property.type))
        return false;

      if (selectedFeatures.length > 0) {
        const hasAllFeatures = selectedFeatures.every(
          (feature) => property.specialFeatures[feature]
        );
        if (!hasAllFeatures) return false;
      }

      if (selectedPricePerSqmBuckets.length > 0) {
        const pricePerSqm = property.marketPrice / Math.max(1, property.size);
        const matchesBucket = selectedPricePerSqmBuckets.some((bucket) => {
          switch (bucket) {
            case "lt-1000":
              return pricePerSqm < 1000;
            case "1000-2000":
              return pricePerSqm >= 1000 && pricePerSqm < 2000;
            case "2000-3500":
              return pricePerSqm >= 2000 && pricePerSqm < 3500;
            case "3500-5000":
              return pricePerSqm >= 3500 && pricePerSqm < 5000;
            case "gt-5000":
              return pricePerSqm >= 5000;
            default:
              return true;
          }
        });
        if (!matchesBucket) return false;
      }

      if (selectedRenovationTier) {
        const renovation = property.renovationBonusPercentage;
        const matchesTier =
          (selectedRenovationTier === "new" && renovation >= 90) ||
          (selectedRenovationTier === "some-repairs" &&
            renovation >= 60 &&
            renovation < 90) ||
          (selectedRenovationTier === "major-repairs" &&
            renovation >= 30 &&
            renovation < 60) ||
          (selectedRenovationTier === "bulldoze" && renovation < 30);
        if (!matchesTier) return false;
      }

      return true;
    });

    // Then sort filtered properties
    switch (sortOrder) {
      case "newest":
        return filtered.sort(
          (a, b) => b.listedDate.getTime() - a.listedDate.getTime()
        );
      case "oldest":
        return filtered.sort(
          (a, b) => a.listedDate.getTime() - b.listedDate.getTime()
        );
      case "price-asc":
        return filtered.sort((a, b) => a.marketPrice - b.marketPrice);
      case "price-desc":
        return filtered.sort((a, b) => b.marketPrice - a.marketPrice);
      case "size-asc":
        return filtered.sort((a, b) => a.size - b.size);
      case "size-desc":
        return filtered.sort((a, b) => b.size - a.size);
      default:
        return filtered;
    }
  }, [
    properties,
    sortOrder,
    priceRange,
    selectedLocations,
    selectedTypes,
    selectedFeatures,
    selectedPricePerSqmBuckets,
    selectedRenovationTier
  ]);

  const marketListings = filteredAndSortedProperties;
  const totalListings = properties.filter((p) => p.owner === null).length;

  return (
    <>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-xl font-semibold'>Property Market</h2>
        <div className='flex items-center text-gray-400 text-sm'>
          <FiFilter className='mr-2' />
          Filters
        </div>
      </div>

      <div className='flex flex-col lg:flex-row gap-4'>
        {showFilters && (
          <aside className='bg-gray-800 p-4 rounded-lg shadow-lg lg:w-72 lg:shrink-0'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='font-semibold text-lg'>Filter Properties</h3>
              <button
                className='text-sm text-blue-400 hover:text-blue-300'
                onClick={resetFilters}
              >
                Reset Filters
              </button>
            </div>

            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium mb-1'>
                  Price Range
                </label>
                <div className='flex items-center gap-2'>
                  <input
                    type='number'
                    className='bg-gray-700 text-white p-2 rounded w-full'
                    value={priceRange[0]}
                    onChange={(e) =>
                      setPriceRange([Number(e.target.value), priceRange[1]])
                    }
                    min={filterOptions.priceRange[0]}
                    max={priceRange[1]}
                    placeholder='Min price'
                  />
                  <span>to</span>
                  <input
                    type='number'
                    className='bg-gray-700 text-white p-2 rounded w-full'
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], Number(e.target.value)])
                    }
                    min={priceRange[0]}
                    max={filterOptions.priceRange[1]}
                    placeholder='Max price'
                  />
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium mb-1'>Location</label>
                <select
                  className='bg-gray-700 text-white p-2 rounded w-full'
                  multiple={true}
                  value={selectedLocations}
                  onChange={(e) =>
                    setSelectedLocations(
                      Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      )
                    )
                  }
                  size={4}
                >
                  {filterOptions.locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
                <div className='text-xs text-gray-400 mt-1'>
                  Hold Ctrl to select multiple
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium mb-1'>
                  Property Type
                </label>
                <div className='space-y-1'>
                  {filterOptions.types.map((type) => (
                    <div key={type} className='flex items-center'>
                      <input
                        type='checkbox'
                        id={`type-${type}`}
                        checked={selectedTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTypes([...selectedTypes, type]);
                          } else {
                            setSelectedTypes(
                              selectedTypes.filter((t) => t !== type)
                            );
                          }
                        }}
                        className='mr-2'
                      />
                      <label htmlFor={`type-${type}`}>{type}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium mb-2'>
                  Features
                </label>
                <div className='grid grid-cols-2 gap-2'>
                  {FEATURE_OPTIONS.map((feature) => (
                    <label
                      key={feature.key}
                      className='flex items-center gap-2 text-sm text-gray-300'
                    >
                      <input
                        type='checkbox'
                        className='accent-blue-500'
                        checked={selectedFeatures.includes(feature.key)}
                        onChange={() =>
                          setSelectedFeatures((prev) =>
                            prev.includes(feature.key)
                              ? prev.filter((item) => item !== feature.key)
                              : [...prev, feature.key]
                          )
                        }
                      />
                      {feature.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium mb-2'>
                  Price per m²
                </label>
                <div className='space-y-1'>
                  {PRICE_PER_SQM_BUCKETS.map((bucket) => (
                    <label
                      key={bucket.value}
                      className='flex items-center gap-2 text-sm text-gray-300'
                    >
                      <input
                        type='checkbox'
                        className='accent-blue-500'
                        checked={selectedPricePerSqmBuckets.includes(bucket.value)}
                        onChange={() =>
                          setSelectedPricePerSqmBuckets((prev) =>
                            prev.includes(bucket.value)
                              ? prev.filter((item) => item !== bucket.value)
                              : [...prev, bucket.value]
                          )
                        }
                      />
                      {bucket.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium mb-2'>
                  Renovation Level
                </label>
                <select
                  className='bg-gray-700 text-white p-2 rounded w-full'
                  value={selectedRenovationTier}
                  onChange={(e) =>
                    setSelectedRenovationTier(
                      e.target.value as RenovationTier | ""
                    )
                  }
                >
                  <option value=''>All</option>
                  {RENOVATION_TIERS.map((tier) => (
                    <option key={tier.value} value={tier.value}>
                      {tier.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </aside>
        )}

        <div className='flex-1'>
          <div className='flex justify-between items-center mb-4'>
            <div className='text-sm text-gray-400'>
              Showing {marketListings.length} of {totalListings} properties
            </div>
            <div className='flex items-center'>
              <span className='mr-2'>Sort by:</span>
              <select
                className='border p-1 rounded bg-gray-700 text-white'
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOption)}
              >
                <option value='newest'>Newest First</option>
                <option value='oldest'>Oldest First</option>
                <option value='price-asc'>Price: Low to High</option>
                <option value='price-desc'>Price: High to Low</option>
                <option value='size-asc'>Size: Smallest First</option>
                <option value='size-desc'>Size: Largest First</option>
                <option value='default'>Default</option>
              </select>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {marketListings.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onBuyOrSell={onBuyOrSell}
                onRent={onRent}
                onRenovate={onRenovate}
                onRenovateToMax={onRenovateToMax}
                onEvictTenant={onEvictTenant}
                currentDate={currentDate}
                playerMoney={playerMoney}
                onUpdateListing={onUpdateListing}
                onUpdateListingCopy={onUpdateListingCopy}
                onUpdateRentPrice={onUpdateRentPrice}
                onAcceptOffer={onAcceptOffer}
                onBulldoze={onBulldoze}
                getRenovateToMaxCost={getRenovateToMaxCost}
                onApplyPermit={onApplyPermit}
                onStartConstruction={onStartConstruction}
                onRaiseFunds={onRaiseFunds}
                handleAcceptApplication={handleAcceptApplication}
                setPaused={setPaused}
              />
            ))}
          </div>

          {marketListings.length === 0 && (
            <div className='text-center text-gray-400 py-8'>
              <p>No properties matching your filters are currently available.</p>
              <p>
                Try adjusting your filters or check back soon as new listings
                appear
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

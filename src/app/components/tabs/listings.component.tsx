import React, { useState, useMemo } from "react";
import PropertyCard from "../property-card.component";
import { LeaseApplication, Property, PropertyType } from "../../types";
import { FiFilter, FiChevronDown, FiChevronUp } from "react-icons/fi";

interface ListingsProps {
  properties: Property[];
  onBuyOrSell: (propertyId: number) => void;
  onRent: (propertyId: number) => void;
  onRenovate: (propertyId: number) => void;
  onEvictTenant?: (propertyId: number) => void;
  playerMoney: number;
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

export const Listings = ({
  properties,
  onBuyOrSell,
  onRent,
  onRenovate,
  onEvictTenant,
  playerMoney,
  handleAcceptApplication,
  setPaused
}: ListingsProps) => {
  // Sorting state
  const [sortOrder, setSortOrder] = useState<SortOption>("newest");

  // Filter panel visibility
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<PropertyType[]>([]);
  const [minCondition, setMinCondition] = useState<number>(0);
  const [marketTrendFilter, setMarketTrendFilter] = useState<string>("any");

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
      types: Array.from(types),
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
    setMinCondition(0);
    setMarketTrendFilter("any");
  };

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

      // Condition filter (using renovationPotential as an indicator)
      const condition = property.renovationBonusPercentage || 0;
      if (condition < minCondition) return false;

      // Market trend filter
      if (marketTrendFilter !== "any") {
        if (
          marketTrendFilter === "growing" &&
          property.marketTrends.historicalAppreciation <= 0
        )
          return false;
        if (
          marketTrendFilter === "declining" &&
          property.marketTrends.historicalAppreciation >= 0
        )
          return false;
        if (
          marketTrendFilter === "stable" &&
          Math.abs(property.marketTrends.historicalAppreciation) > 0.01
        )
          return false;
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
    minCondition,
    marketTrendFilter
  ]);

  const marketListings = filteredAndSortedProperties;
  const totalListings = properties.filter((p) => p.owner === null).length;

  return (
    <>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-xl font-semibold'>Property Market</h2>
        <button
          className='flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded'
          onClick={() => setShowFilters(!showFilters)}
        >
          <FiFilter className='mr-2' />
          Filters{" "}
          {showFilters ? (
            <FiChevronUp className='ml-1' />
          ) : (
            <FiChevronDown className='ml-1' />
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className='bg-gray-800 p-4 rounded-lg mb-4 shadow-lg'>
          <div className='flex justify-between items-center mb-4'>
            <h3 className='font-semibold text-lg'>Filter Properties</h3>
            <button
              className='text-sm text-blue-400 hover:text-blue-300'
              onClick={resetFilters}
            >
              Reset Filters
            </button>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {/* Price Range Filter */}
            <div className='mb-3'>
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

            {/* Location Filter */}
            <div className='mb-3'>
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
                size={3}
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

            {/* Property Type Filter */}
            <div className='mb-3'>
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

            {/* Condition Filter */}
            <div className='mb-3'>
              <label className='block text-sm font-medium mb-1'>
                Minimum Condition: {minCondition}%
              </label>
              <input
                type='range'
                min='0'
                max='100'
                value={minCondition}
                onChange={(e) => setMinCondition(Number(e.target.value))}
                className='w-full'
              />
            </div>

            {/* Market Trend Filter */}
            <div className='mb-3'>
              <label className='block text-sm font-medium mb-1'>
                Market Trend
              </label>
              <select
                className='bg-gray-700 text-white p-2 rounded w-full'
                value={marketTrendFilter}
                onChange={(e) => setMarketTrendFilter(e.target.value)}
              >
                <option value='any'>Any</option>
                <option value='growing'>Growing Market</option>
                <option value='stable'>Stable Market</option>
                <option value='declining'>Declining Market</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Sort controls and results summary */}
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
            onEvictTenant={onEvictTenant}
            playerMoney={playerMoney}
            handleAcceptApplication={handleAcceptApplication}
            setPaused={setPaused}
          />
        ))}
      </div>

      {marketListings.length === 0 && (
        <div className='text-center py-10 text-gray-400'>
          <p>No properties matching your filters are currently available.</p>
          <p className='mt-2'>
            Try adjusting your filters or check back soon as new listings appear
            regularly!
          </p>
        </div>
      )}
    </>
  );
};

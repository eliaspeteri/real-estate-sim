import React, { useState } from "react";
import { LeaseApplication, Property, PropertyType } from "../types";
import PropertyDetailsModal from "./modals/property-details-modal.component";
import { useSettings } from "../context/settings.context";

interface PropertyCardProps {
  property: Property;
  onBuyOrSell: (propertyId: number) => void;
  onRent: (propertyId: number, options?: { showModal?: boolean }) => void;
  onRenovate: (propertyId: number) => void;
  onEvictTenant?: (propertyId: number, tenantId?: string) => void;
  currentDate?: Date;
  playerMoney: number;
  isOutsourced?: boolean;
  onToggleOutsource?: (propertyId: number) => void;
  onUpdateListing?: (
    propertyId: number,
    listingKeywords: Property["listingKeywords"]
  ) => void;
  onUpdateListingCopy?: (propertyId: number, listingCopy: string) => void;
  onUpdateRentPrice?: (propertyId: number, rentPrice: number) => void;
  onAcceptOffer?: (propertyId: number, offerId: string) => void;
  onBulldoze?: (propertyId: number) => void;
  onApplyPermit?: (propertyId: number) => void;
  onStartConstruction?: (propertyId: number) => void;
  onRaiseFunds?: (propertyId: number) => void;
  handleAcceptApplication?: (
    property: Property,
    application: LeaseApplication
  ) => void;
  setPaused?: (paused: boolean) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onBuyOrSell,
  onRent,
  onRenovate,
  onEvictTenant,
  currentDate,
  playerMoney,
  isOutsourced = false,
  onToggleOutsource,
  onUpdateListing,
  onUpdateListingCopy,
  onUpdateRentPrice,
  onAcceptOffer,
  onBulldoze,
  onApplyPermit,
  onStartConstruction,
  onRaiseFunds,
  handleAcceptApplication,
  setPaused
}) => {
  const [showPropertyDetails, setShowPropertyDetails] =
    useState<boolean>(false);
  const { formatCurrency } = useSettings();

  const isOwnedByPlayer = property.owner === "Player";
  const isLand = property.type === PropertyType.LAND;
  const isNewListing = property.isNew && !isOwnedByPlayer;
  const unitCount = property.units ?? 1;
  const occupiedUnits = Math.max(
    0,
    property.occupiedUnits ??
      property.unitTenants?.length ??
      (property.currentTenant ? 1 : 0)
  );
  const isMultiUnit = unitCount > 1;
  const amenitiesAverage = Number(
    (
      (property.amenities.schools +
        property.amenities.parks +
        property.amenities.shopping +
        property.amenities.transportation +
        property.amenities.healthcare) /
      5
    ).toFixed(1)
  );

  // Calculate monthly cash flow for owned properties
  const calculateMonthlyCashFlow = () => {
    if (!isOwnedByPlayer) return 0;

    const income = property.isRented ? property.rentPrice * occupiedUnits : 0;
    const expenses = property.maintenanceCosts;
    return income - expenses;
  };

  const monthlyCashFlow = calculateMonthlyCashFlow();

  return (
    <>
      <div
        className={`border p-4 rounded shadow cursor-pointer hover:shadow-lg transition-shadow ${
          isOwnedByPlayer && isOutsourced
            ? "bg-purple-100 border-purple-300 text-gray-900" // Purple for outsourced
            : isOwnedByPlayer
            ? "bg-blue-100 border-blue-300 text-gray-900" // Light blue for owned properties
            : "bg-gray-800 border-gray-600 text-white" // Dark for regular listings
        }`}
        onClick={() => setShowPropertyDetails(true)}
      >
        <div className='flex justify-between items-start'>
          <h2 className={`text-xl font-semibold`}>
            {property.address.split(",")[0]}
          </h2>
          {isNewListing && (
            <span className='bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold'>
              NEW
            </span>
          )}
        </div>

        <div className='grid grid-cols-2 gap-y-1 mt-2'>
          <span className='text-sm opacity-80'>Type:</span>
          <span className='text-sm font-medium'>{property.type}</span>

          <span className='text-sm opacity-80'>Size:</span>
          <span className='text-sm font-medium'>
            {property.size.toLocaleString()} m²
          </span>

          <span className='text-sm opacity-80'>Location:</span>
          <span className='text-sm font-medium'>{property.location}</span>

          <span className='text-sm opacity-80'>Amenities Avg:</span>
          <span className='text-sm font-medium'>
            {amenitiesAverage}/5
          </span>

          {isMultiUnit && (
            <>
              <span className='text-sm opacity-80'>Units:</span>
              <span className='text-sm font-medium'>
                {occupiedUnits}/{unitCount}
              </span>
            </>
          )}
        </div>

        {isOwnedByPlayer ? (
          <div
            className='mt-3 p-2 bg-opacity-20 rounded'
            style={{
              backgroundColor:
                monthlyCashFlow >= 0
                  ? "rgba(34, 197, 94, 0.2)"
                  : "rgba(239, 68, 68, 0.2)"
            }}
          >
            <div className='flex justify-between items-center'>
              <span>Current Value:</span>
              <span className='font-semibold'>
                {formatCurrency(property.value)}
              </span>
            </div>

            {property.isRented && (
              <div className='flex justify-between items-center mt-1'>
                <span>Monthly Cash Flow:</span>
                <span
                  className={`font-semibold ${
                    monthlyCashFlow >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {formatCurrency(monthlyCashFlow)}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className='mt-3 p-2 bg-gray-700 bg-opacity-40 rounded'>
            <div className='flex justify-between'>
              <span>Market Price:</span>
              <span className='font-semibold'>
                {formatCurrency(property.marketPrice)}
              </span>
            </div>
            <div className='flex justify-between text-sm mt-1'>
              <span>Renovation Level:</span>
              <span>{property.renovationBonusPercentage}%</span>
            </div>
          </div>
        )}

        {/* Property status indicators */}
        <div className='mt-3 flex flex-wrap gap-2'>
          {property.forSale && (
            <span className='px-2 py-1 text-xs rounded-full bg-orange-500 text-white'>
              Listed
            </span>
          )}
          {property.isRented && (
            <span className='px-2 py-1 text-xs rounded-full bg-green-500 text-white'>
              Rented
            </span>
          )}
          {property.development && (
            <span className='px-2 py-1 text-xs rounded-full bg-blue-600 text-white'>
              Developing
            </span>
          )}
          {isOutsourced && (
            <span className='px-2 py-1 text-xs rounded-full bg-purple-500 text-white'>
              Outsourced
            </span>
          )}
          {property.renovationBonusPercentage > 50 && (
            <span className='px-2 py-1 text-xs rounded-full bg-yellow-500 text-white'>
              Well-renovated
            </span>
          )}
          {isLand && (
            <span className='px-2 py-1 text-xs rounded-full bg-blue-500 text-white'>
              Land
            </span>
          )}
        </div>

        <div className='mt-3 text-xs opacity-70'>Click for more details</div>
      </div>

      {/* Property details modal */}
      {showPropertyDetails && (
        <PropertyDetailsModal
          property={property}
          isOpen={showPropertyDetails}
          onClose={() => setShowPropertyDetails(false)}
          onBuyOrSell={onBuyOrSell}
          onRent={onRent}
          onRenovate={onRenovate}
          onEvictTenant={onEvictTenant}
          currentDate={currentDate}
          playerMoney={playerMoney}
          isOutsourced={isOutsourced}
          onToggleOutsource={onToggleOutsource}
          onUpdateListing={onUpdateListing}
          onUpdateListingCopy={onUpdateListingCopy}
          onUpdateRentPrice={onUpdateRentPrice}
          onAcceptOffer={onAcceptOffer}
          onBulldoze={onBulldoze}
          onApplyPermit={onApplyPermit}
          onStartConstruction={onStartConstruction}
          onRaiseFunds={onRaiseFunds}
          handleAcceptApplication={handleAcceptApplication}
          setPaused={setPaused}
        />
      )}
    </>
  );
};

export default PropertyCard;

import React, { useState, useEffect } from "react";
import { LeaseApplication, Property, PropertyType } from "../../types";
import TenantDetailsModal from "./tenant-details-modal.component";
import LeaseApplicationModal from "./lease-application-modal.component";

interface PropertyDetailsModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onBuyOrSell?: (propertyId: number) => void;
  onRent?: (propertyId: number) => void;
  onRenovate?: (propertyId: number) => void;
  onEvictTenant?: (propertyId: number) => void;
  playerMoney?: number;
  isOutsourced?: boolean;
  onToggleOutsource?: (propertyId: number) => void;
  handleAcceptApplication?: (
    property: Property,
    application: LeaseApplication
  ) => void;
  setPaused?: (paused: boolean) => void;
}

const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
  property,
  isOpen,
  onClose,
  onBuyOrSell,
  onRent,
  onRenovate,
  onEvictTenant,
  playerMoney = 0,
  isOutsourced = false,
  onToggleOutsource,
  handleAcceptApplication,
  setPaused
}) => {
  const [showTenantDetails, setShowTenantDetails] = useState<boolean>(false);
  const [showLeaseApplications, setShowLeaseApplications] =
    useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [isClosingLeaseModal, setIsClosingLeaseModal] =
    useState<boolean>(false);

  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Pause the game when modal opens
      if (setPaused) setPaused(true);
    }

    // Cleanup function to restore scroll and game state when component unmounts
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, setPaused]);

  // Handle main modal closing with animation
  const handleClose = () => {
    if (isClosing) return;

    // First close any sub-modals if they're open
    if (showLeaseApplications) {
      handleCloseLeaseApplications();
      return;
    }

    if (showTenantDetails) {
      setShowTenantDetails(false);
      return;
    }

    setIsClosing(true);

    // After animation completes, call the actual onClose
    setTimeout(() => {
      if (setPaused) setPaused(false);
      onClose();
      setIsClosing(false);
    }, 300); // 300ms matches the animation duration
  };

  // Handle closing lease applications modal
  const handleCloseLeaseApplications = () => {
    if (isClosingLeaseModal) return;

    setIsClosingLeaseModal(true);

    setTimeout(() => {
      setShowLeaseApplications(false);
      setIsClosingLeaseModal(false);
    }, 300);
  };

  if (!isOpen) return null;

  const isOwnedByPlayer = property.owner === "Player";
  const isLand = property.type === PropertyType.LAND;
  const renovationCost = Math.max(5000, Math.round(property.value * 0.005));

  // Handle rent button click within modal
  const handleRentClick = () => {
    if (onRent) {
      if (!property.isRented) {
        // If finding tenants, show lease application modal
        setShowLeaseApplications(true);
      } else {
        // If ending lease, call onRent directly
        onRent(property.id);
      }
    }
  };

  // Calculate return on investment for owned properties
  const calculateROI = () => {
    if (!isOwnedByPlayer || !property.purchaseDate) return null;

    const valueGain = property.value - property.marketPrice;
    const percentageGain = (valueGain / property.marketPrice) * 100;

    const purchaseDate = new Date(property.purchaseDate);
    const currentDate = new Date();
    const monthsHeld =
      (currentDate.getFullYear() - purchaseDate.getFullYear()) * 12 +
      (currentDate.getMonth() - purchaseDate.getMonth());

    // Annualized ROI formula = ((1 + totalROI)^(1/years) - 1) * 100
    const years = monthsHeld / 12;
    const annualizedROI =
      years > 0
        ? (Math.pow(1 + valueGain / property.marketPrice, 1 / years) - 1) * 100
        : 0;

    return {
      valueGain,
      percentageGain,
      monthsHeld,
      annualizedROI
    };
  };

  const roi = calculateROI();

  return (
    <div
      className='fixed inset-0 flex items-end justify-center z-50 bg-transparent backdrop-blur-sm transition-backdrop-blur'
      onClick={handleClose}
    >
      <div
        className={`bg-gray-800 w-full max-h-[75vh] rounded-t-xl shadow-xl overflow-auto ${
          isClosing ? "animate-slide-down" : "animate-slide-up"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className='sticky top-0 bg-gray-800 z-10 px-6 pt-4 pb-2 flex justify-between items-start border-b border-gray-700'>
          <h2 className='text-2xl font-bold'>{property.address}</h2>
          <button
            onClick={handleClose}
            className='text-gray-400 hover:text-white text-2xl font-bold'
          >
            ×
          </button>
        </div>

        <div className='px-6 py-4'>
          <div className='mb-6 text-gray-300'>
            <p className='italic'>{property.description}</p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
            {/* Property Details */}
            <div className='bg-gray-700 p-4 rounded'>
              <h3 className='text-lg font-medium mb-2 text-blue-400'>
                Property Details
              </h3>
              <div className='grid grid-cols-2 gap-y-2'>
                <span className='text-gray-400'>Type:</span>
                <span>{property.type}</span>

                <span className='text-gray-400'>Size:</span>
                <span>{property.size.toLocaleString()} m²</span>

                {property.rooms !== null && (
                  <>
                    <span className='text-gray-400'>Rooms:</span>
                    <span>{property.rooms}</span>
                  </>
                )}

                <span className='text-gray-400'>Location:</span>
                <span>{property.location}</span>

                <span className='text-gray-400'>Neighborhood:</span>
                <span>{property.neighborhoodQuality}</span>

                <span className='text-gray-400'>View:</span>
                <span>{property.viewQuality}</span>

                {property.lotSize && (
                  <>
                    <span className='text-gray-400'>Lot Size:</span>
                    <span>{property.lotSize.toLocaleString()} m²</span>
                  </>
                )}

                <span className='text-gray-400'>Built:</span>
                <span>{property.buildingDate.toLocaleDateString()}</span>

                <span className='text-gray-400'>Renovation Potential:</span>
                <span>{property.renovationPotential}</span>

                {isOwnedByPlayer && (
                  <>
                    <span className='text-gray-400'>Renovation Level:</span>
                    <span>{property.renovationBonusPercentage}%</span>

                    <span className='text-gray-400'>Monthly Maintenance:</span>
                    <span className='text-red-400'>
                      ${property.maintenanceCosts.toLocaleString()}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Financial Details */}
            <div className='bg-gray-700 p-4 rounded'>
              <h3 className='text-lg font-medium mb-2 text-blue-400'>
                Financial Details
              </h3>
              <div className='grid grid-cols-2 gap-y-2'>
                {isOwnedByPlayer ? (
                  <>
                    <span className='text-gray-400'>Purchase Price:</span>
                    <span>${property.marketPrice.toLocaleString()}</span>

                    <span className='text-gray-400'>Current Value:</span>
                    <span className='text-green-400'>
                      ${property.value.toLocaleString()}
                    </span>

                    {roi && (
                      <>
                        <span className='text-gray-400'>Value Gain:</span>
                        <span
                          className={
                            roi.valueGain >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          ${roi.valueGain.toLocaleString()} (
                          {roi.percentageGain.toFixed(2)}%)
                        </span>

                        <span className='text-gray-400'>Annualized ROI:</span>
                        <span
                          className={
                            roi.annualizedROI >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {roi.annualizedROI.toFixed(2)}%
                        </span>

                        <span className='text-gray-400'>Holding Period:</span>
                        <span>{roi.monthsHeld} months</span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <span className='text-gray-400'>Market Price:</span>
                    <span>${property.marketPrice.toLocaleString()}</span>

                    <span className='text-gray-400'>Price per m²:</span>
                    <span>
                      ${Math.round(property.marketPrice / property.size)}
                    </span>
                  </>
                )}

                {property.isRented && (
                  <>
                    <span className='text-gray-400'>Rental Income:</span>
                    <span className='text-green-400'>
                      ${property.rentPrice.toLocaleString()}/month
                    </span>

                    <span className='text-gray-400'>Tenant:</span>
                    <button
                      className='text-blue-400 hover:underline text-left'
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTenantDetails(true);
                      }}
                    >
                      {property.rentee} (View details)
                    </button>

                    {property.currentTenant && (
                      <>
                        <span className='text-gray-400'>Lease Term:</span>
                        <span>{property.currentTenant.leaseLength} months</span>
                      </>
                    )}
                  </>
                )}

                {isOwnedByPlayer && !property.isRented && !isLand && (
                  <>
                    <span className='text-gray-400'>Potential Rent:</span>
                    <span>${property.rentPrice.toLocaleString()}/month</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Market Trends & Amenities Sections */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
            {/* Market Trends */}
            <div className='bg-gray-700 p-4 rounded'>
              <h3 className='text-lg font-medium mb-2 text-blue-400'>
                Market Trends
              </h3>
              <div className='grid grid-cols-2 gap-y-2'>
                <span className='text-gray-400'>Historical Appreciation:</span>
                <span>
                  {property.marketTrends.historicalAppreciation.toFixed(1)}%
                </span>

                <span className='text-gray-400'>Job Growth:</span>
                <span>{property.economicIndicators.jobGrowth.toFixed(1)}%</span>

                <span className='text-gray-400'>Property Supply:</span>
                <span>{property.marketTrends.propertySupply} listings</span>

                <span className='text-gray-400'>Avg Days on Market:</span>
                <span>{property.marketTrends.averageDaysOnMarket} days</span>

                <span className='text-gray-400'>Local Population:</span>
                <span>
                  {property.economicIndicators.population.toLocaleString()}
                </span>

                <span className='text-gray-400'>Unemployment Rate:</span>
                <span>
                  {property.economicIndicators.unemploymentRate.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Amenities */}
            <div className='bg-gray-700 p-4 rounded'>
              <h3 className='text-lg font-medium mb-2 text-blue-400'>
                Amenities & Features
              </h3>
              <div className='mb-3'>
                <div className='grid grid-cols-2 gap-y-2'>
                  <span className='text-gray-400'>Schools:</span>
                  <div className='flex items-center'></div>
                  <div className='w-24 bg-gray-600 rounded-full h-2.5 mr-2'>
                    <div
                      className='bg-blue-500 h-2.5 rounded-full'
                      style={{ width: `${property.amenities.schools * 20}%` }}
                    ></div>
                  </div>
                  <span>{property.amenities.schools.toFixed(1)}/5</span>
                </div>

                <span className='text-gray-400'>Parks:</span>
                <div className='flex items-center'>
                  <div className='w-24 bg-gray-600 rounded-full h-2.5 mr-2'>
                    <div
                      className='bg-blue-500 h-2.5 rounded-full'
                      style={{ width: `${property.amenities.parks * 20}%` }}
                    ></div>
                  </div>
                  <span>{property.amenities.parks.toFixed(1)}/5</span>
                </div>

                <span className='text-gray-400'>Shopping:</span>
                <div className='flex items-center'>
                  <div className='w-24 bg-gray-600 rounded-full h-2.5 mr-2'>
                    <div
                      className='bg-blue-500 h-2.5 rounded-full'
                      style={{
                        width: `${property.amenities.shopping * 20}%`
                      }}
                    ></div>
                  </div>
                  <span>{property.amenities.shopping.toFixed(1)}/5</span>
                </div>

                <span className='text-gray-400'>Transportation:</span>
                <div className='flex items-center'>
                  <div className='w-24 bg-gray-600 rounded-full h-2.5 mr-2'>
                    <div
                      className='bg-blue-500 h-2.5 rounded-full'
                      style={{
                        width: `${property.amenities.transportation * 20}%`
                      }}
                    ></div>
                  </div>
                  <span>{property.amenities.transportation.toFixed(1)}/5</span>
                </div>

                <span className='text-gray-400'>Healthcare:</span>
                <div className='flex items-center'>
                  <div className='w-24 bg-gray-600 rounded-full h-2.5 mr-2'>
                    <div
                      className='bg-blue-500 h-2.5 rounded-full'
                      style={{
                        width: `${property.amenities.healthcare * 20}%`
                      }}
                    ></div>
                  </div>
                  <span>{property.amenities.healthcare.toFixed(1)}/5</span>
                </div>
              </div>
            </div>

            {/* Special Features */}
            {!isLand && (
              <div className='mt-4'>
                <h4 className='font-medium text-sm text-gray-400 mb-2'>
                  Special Features:
                </h4>
                <div className='grid grid-cols-2 gap-y-1 gap-x-4'>
                  {property.specialFeatures.swimmingPool && (
                    <span>• Swimming pool</span>
                  )}
                  {property.specialFeatures.garden && <span>• Garden</span>}
                  {property.specialFeatures.rooftopTerrace && (
                    <span>• Rooftop terrace</span>
                  )}
                  {property.specialFeatures.balcony && <span>• Balcony</span>}
                  {property.specialFeatures.fireplace && (
                    <span>• Fireplace</span>
                  )}
                  {property.specialFeatures.homeOffice && (
                    <span>• Home office</span>
                  )}
                  {property.specialFeatures.garage && <span>• Garage</span>}
                  {property.specialFeatures.outdoorSpaces && (
                    <span>• Outdoor spaces</span>
                  )}
                  {property.specialFeatures.smartHome && (
                    <span>• Smart home</span>
                  )}
                  {property.specialFeatures.securitySystem && (
                    <span>• Security system</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions Section - Always visible even at bottom of modal */}
        <div className='bg-gray-700 p-4 rounded mb-6'>
          <h3 className='text-lg font-medium mb-3 text-blue-400'>Actions</h3>
          <div className='flex flex-wrap gap-3'>
            {onBuyOrSell && (
              <button
                className={`px-4 py-2 rounded ${
                  isOwnedByPlayer
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onBuyOrSell(property.id);
                  handleClose();
                }}
              >
                {isOwnedByPlayer
                  ? `Sell for $${property.value.toLocaleString()}`
                  : `Buy for $${property.marketPrice.toLocaleString()}`}
              </button>
            )}

            {isOwnedByPlayer && !isLand && onRent && (
              <button
                className={`px-4 py-2 rounded ${
                  property.isRented
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-blue-500 hover:bg-blue-600"
                } text-white`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRentClick();
                }}
              >
                {property.isRented ? "End Lease" : "Find Tenants"}
              </button>
            )}

            {isOwnedByPlayer && onRenovate && (
              <button
                className='px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded disabled:bg-gray-400 disabled:text-gray-200'
                onClick={(e) => {
                  e.stopPropagation();
                  onRenovate(property.id);
                }}
                disabled={
                  property.renovationBonusPercentage >= 100 ||
                  property.isRented ||
                  (playerMoney !== undefined && playerMoney < renovationCost)
                }
              >
                Renovate (${renovationCost.toLocaleString()})
              </button>
            )}

            {isOwnedByPlayer && property.isRented && onEvictTenant && (
              <button
                className='px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded'
                onClick={(e) => {
                  e.stopPropagation();
                  onEvictTenant(property.id);
                  handleClose();
                }}
              >
                Evict Tenant
              </button>
            )}

            {isOwnedByPlayer && !isLand && onToggleOutsource && (
              <button
                className={`px-4 py-2 rounded ${
                  isOutsourced
                    ? "bg-purple-500 hover:bg-purple-600"
                    : "bg-gray-500 hover:bg-gray-600"
                } text-white`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleOutsource(property.id);
                }}
              >
                {isOutsourced ? "Stop Outsourcing" : "Outsource Management"}
              </button>
            )}
          </div>

          {/* Property manager badge */}
          {isOwnedByPlayer && isOutsourced && (
            <div className='mt-3 p-2 bg-purple-900/30 rounded'>
              <p className='text-sm'>🏢 Property management outsourced</p>
            </div>
          )}

          {/* Land development notice */}
          {isLand && isOwnedByPlayer && (
            <div className='mt-3 p-2 bg-blue-900/30 rounded text-sm'>
              <p>
                This is a land property. Development options will be available
                in future updates.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lease applications card deck modal */}
      {showLeaseApplications && property.leaseApplications && (
        <div
          className='fixed inset-0 flex items-end justify-center z-[60]'
          onClick={(e) => {
            e.stopPropagation();
            handleCloseLeaseApplications();
          }}
        >
          <div
            className={`bg-gray-700 w-full max-h-[60vh] rounded-t-xl shadow-xl overflow-auto ${
              isClosingLeaseModal ? "animate-slide-down" : "animate-slide-up"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className='sticky top-0 bg-gray-700 z-10 px-6 pt-4 pb-2 flex justify-between items-start border-b border-gray-600'>
              <h2 className='text-2xl font-bold'>Lease Applications</h2>
              <button
                onClick={handleCloseLeaseApplications}
                className='text-gray-400 hover:text-white text-2xl font-bold'
              >
                ×
              </button>
            </div>

            <div className='p-4'>
              <LeaseApplicationModal
                property={property}
                applications={property.leaseApplications}
                onClose={handleCloseLeaseApplications}
                onAcceptApplication={(property, application) => {
                  if (handleAcceptApplication) {
                    handleAcceptApplication(property, application);
                    handleCloseLeaseApplications();
                  }
                }}
                isCardDeck={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tenant details modal */}
      {showTenantDetails && property.currentTenant && (
        <div
          className='fixed inset-0 flex items-end justify-center z-[60]'
          onClick={(e) => {
            e.stopPropagation();
            setShowTenantDetails(false);
          }}
        >
          <div
            className='bg-gray-700 w-full max-h-[60vh] rounded-t-xl shadow-xl overflow-auto animate-slide-up'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='sticky top-0 bg-gray-700 z-10 px-6 pt-4 pb-2 flex justify-between items-start border-b border-gray-600'>
              <h2 className='text-2xl font-bold'>Tenant Details</h2>
              <button
                onClick={() => setShowTenantDetails(false)}
                className='text-gray-400 hover:text-white text-2xl font-bold'
              >
                ×
              </button>
            </div>

            <div className='p-4'>
              <TenantDetailsModal
                property={property}
                onClose={() => setShowTenantDetails(false)}
                onEvictTenant={onEvictTenant || (() => {})}
                isCardDeck={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetailsModal;

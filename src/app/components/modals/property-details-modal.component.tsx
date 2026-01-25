import React, { useState, useEffect } from "react";
import {
  LeaseApplication,
  ListingKeyword,
  Property,
  PropertyType,
  Tenant
} from "../../types";
import TenantDetailsModal from "./tenant-details-modal.component";
import LeaseApplicationModal from "./lease-application-modal.component";
import { useSettings } from "../../context/settings.context";
import { calculateRent } from "../../utils/calculateRent.util";
import { calculateRenovationCost } from "../../utils/calculateRenovationCost.util";
import { calculateBulldozeCost } from "../../utils/bulldoze.util";
import {
  calculatePermitCost,
  calculateConstructionCost,
  PERMIT_DURATION_DAYS,
  CONSTRUCTION_DURATION_DAYS
} from "../../utils/development.util";

interface PropertyDetailsModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onBuyOrSell?: (propertyId: number) => void;
  onRent?: (propertyId: number, options?: { showModal?: boolean }) => void;
  onRenovate?: (propertyId: number) => void;
  onRenovateToMax?: (propertyId: number) => void;
  renovateToMaxCost?: number;
  onEvictTenant?: (propertyId: number, tenantId?: string) => void;
  currentDate?: Date;
  playerMoney?: number;
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

const TENANT_FIND_PRICE = 150; // Cost to find tenants

const LISTING_KEYWORD_OPTIONS: { value: ListingKeyword; label: string }[] = [
  { value: "luxury", label: "Luxury" },
  { value: "modern", label: "Modern" },
  { value: "quiet", label: "Quiet" },
  { value: "family", label: "Family Friendly" },
  { value: "pet_friendly", label: "Pet Friendly" },
  { value: "transit", label: "Near Transit" },
  { value: "flexible_lease", label: "Flexible Lease" },
  { value: "budget", label: "Budget" }
];

const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
  property,
  isOpen,
  onClose,
  onBuyOrSell,
  onRent,
  onRenovate,
  onRenovateToMax,
  renovateToMaxCost,
  onEvictTenant,
  currentDate,
  playerMoney = 0,
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
  const [showTenantDetails, setShowTenantDetails] = useState<boolean>(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showLeaseApplications, setShowLeaseApplications] =
    useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [isClosingLeaseModal, setIsClosingLeaseModal] =
    useState<boolean>(false);
  const [listingKeywords, setListingKeywords] = useState<ListingKeyword[]>(
    property.listingKeywords || []
  );
  const [listingCopy, setListingCopy] = useState<string>(
    property.listingCopy || ""
  );
  const [rentPriceInput, setRentPriceInput] = useState<number>(
    property.rentPrice
  );
  const { formatCurrency, formatDate, formatPercent } = useSettings();
  const unitCount = property.units ?? 1;
  const occupiedUnits =
    property.occupiedUnits ??
    property.unitTenants?.length ??
    (property.currentTenant ? 1 : 0);
  const hasVacancy = unitCount > occupiedUnits;
  const tenants = property.unitTenants?.length
    ? property.unitTenants
    : property.currentTenant
      ? [property.currentTenant]
      : [];
  const evictionByTenantId = new Map(
    (property.pendingEvictions || []).map((eviction) => [
      eviction.tenantId,
      eviction.daysRemaining
    ])
  );
  const hasActiveEvictions = (property.pendingEvictions || []).length > 0;
  const hasOccupants = tenants.length > 0;

  const getRemainingLeaseMonths = (tenant: Tenant) => {
    if (!tenant.leaseStart || !tenant.leaseLength) return 0;
    const leaseStart = new Date(tenant.leaseStart);
    const leaseEnd = new Date(leaseStart);
    leaseEnd.setMonth(leaseEnd.getMonth() + tenant.leaseLength);
    const today = currentDate ? new Date(currentDate) : new Date();
    const remainingMonths =
      (leaseEnd.getFullYear() - today.getFullYear()) * 12 +
      (leaseEnd.getMonth() - today.getMonth());
    return Math.max(0, remainingMonths);
  };

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

  useEffect(() => {
    setListingKeywords(property.listingKeywords || []);
    setListingCopy(property.listingCopy || "");
    setRentPriceInput(property.rentPrice);
  }, [
    property.id,
    property.listingKeywords,
    property.listingCopy,
    property.rentPrice
  ]);

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
      setSelectedTenant(null);
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
  const renovationCost = calculateRenovationCost(property);
  const permitCost = calculatePermitCost(property);
  const constructionCost = calculateConstructionCost(property);
  const developmentFundingAmount = Math.round(property.value * 0.5);
  const bulldozeCost = calculateBulldozeCost(property);

  // Handle rent button click within modal
  const handleRentClick = () => {
    if (!onRent) return;

    if (!property.isRented || hasVacancy) {
      onRent(property.id, { showModal: false });
      setShowLeaseApplications(true);
      return;
    }

    // If ending lease, call onRent directly
    onRent(property.id);
  };

  const toggleListingKeyword = (keyword: ListingKeyword) => {
    const updatedKeywords = listingKeywords.includes(keyword)
      ? listingKeywords.filter((item) => item !== keyword)
      : [...listingKeywords, keyword];

    setListingKeywords(updatedKeywords);
    if (onUpdateListing) {
      onUpdateListing(property.id, updatedKeywords);
    }
  };

  const handleListingCopyBlur = () => {
    if (!onUpdateListingCopy) return;
    onUpdateListingCopy(property.id, listingCopy.trim());
  };

  const handleRentPriceUpdate = () => {
    if (!onUpdateRentPrice) return;
    const normalized = Math.max(0, Math.round(rentPriceInput));
    setRentPriceInput(normalized);
    onUpdateRentPrice(property.id, normalized);
  };

  const marketRent = calculateRent(
    property.location,
    unitCount > 0 ? property.size / unitCount : property.size,
    property.renovationBonusPercentage / 100
  );
  const rentDeltaPercent =
    marketRent > 0
      ? Math.round(((rentPriceInput - marketRent) / marketRent) * 100)
      : 0;
  const purchasePrice =
    property.purchasePrice !== undefined
      ? property.purchasePrice
      : property.marketPrice;

  // Calculate return on investment for owned properties
  const calculateROI = () => {
    if (!isOwnedByPlayer || !property.purchaseDate) return null;
    if (purchasePrice <= 0) return null;

    const valueGain = property.value - purchasePrice;
    const percentageGain = (valueGain / purchasePrice) * 100;

    const purchaseDate = new Date(property.purchaseDate);
    const monthsHeld =
      (currentDate!.getFullYear() - purchaseDate.getFullYear()) * 12 +
      (currentDate!.getMonth() - purchaseDate.getMonth());

    // Annualized ROI formula = ((1 + totalROI)^(1/years) - 1) * 100
    const years = monthsHeld / 12;
    const annualizedROI =
      years > 0
        ? (Math.pow(1 + valueGain / purchasePrice, 1 / years) - 1) * 100
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

                <span className='text-gray-400'>Purpose:</span>
                <span>{property.intendedPurpose}</span>

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

                {unitCount > 1 && (
                  <>
                    <span className='text-gray-400'>Units:</span>
                    <span>
                      {occupiedUnits}/{unitCount} occupied
                    </span>
                  </>
                )}

                <span className='text-gray-400'>View:</span>
                <span>{property.viewQuality}</span>

                {property.lotSize && (
                  <>
                    <span className='text-gray-400'>Lot Size:</span>
                    <span>{property.lotSize.toLocaleString()} m²</span>
                  </>
                )}

                {property.type !== PropertyType.LAND && (
                  <>
                    <span className='text-gray-400'>Built:</span>
                    <span>{formatDate(property.buildingDate)}</span>

                    <span className='text-gray-400'>Maintenance:</span>
                    <span>{property.maintenance}</span>

                    {property.renovation && (
                      <>
                        <span className='text-gray-400'>Renovation:</span>
                        <span className='text-yellow-300'>
                          {property.renovation.daysRemaining} days remaining
                        </span>
                      </>
                    )}

                    <span className='text-gray-400'>Protected:</span>
                    <span>{property.isProtected ? "Yes" : "No"}</span>

                    {isOwnedByPlayer && (
                      <>
                        <span className='text-gray-400'>Renovation Level:</span>
                        <span>{property.renovationBonusPercentage}%</span>

                        <span className='text-gray-400'>
                          Monthly Maintenance:
                        </span>
                        <span className='text-red-400'>
                          {formatCurrency(property.maintenanceCosts)}
                        </span>
                      </>
                    )}
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
                    <span>{formatCurrency(purchasePrice)}</span>

                    <span className='text-gray-400'>Current Value:</span>
                    <span className='text-green-400'>
                      {formatCurrency(property.value)}
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
                          {formatCurrency(roi.valueGain)} (
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

                        <span className='text-gray-400'>Purchase date:</span>
                        <span>
                          {property.purchaseDate?.toLocaleDateString()}
                        </span>

                        <span className='text-gray-400'>Holding Period:</span>
                        <span>{roi.monthsHeld} months</span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <span className='text-gray-400'>Market Price:</span>
                    <span>{formatCurrency(property.marketPrice)}</span>

                    <span className='text-gray-400'>Price per m²:</span>
                    <span>
                      {formatCurrency(
                        Math.round(property.marketPrice / property.size)
                      )}
                    </span>
                  </>
                )}

                {property.isRented && tenants.length > 0 && (
                  <>
                    <span className='text-gray-400'>Rental Income:</span>
                    <span className='text-green-400'>
                      {formatCurrency(
                        property.rentPrice * Math.max(0, occupiedUnits || 0)
                      )}
                      /month
                    </span>

                    {unitCount > 1 && (
                      <>
                        <span className='text-gray-400'>Occupancy:</span>
                        <span>
                          {occupiedUnits}/{unitCount} units
                        </span>
                      </>
                    )}

                    <span className='text-gray-400'>Tenants:</span>
                    <div className='col-span-2 space-y-2'>
                      {tenants.map((tenant) => (
                        <div
                          key={tenant.id}
                          className='flex flex-wrap items-center justify-between gap-2 bg-gray-800/60 p-2 rounded'
                        >
                          <div className='text-sm'>
                            <span className='font-medium'>{tenant.name}</span>
                            {evictionByTenantId.has(tenant.id) ? (
                              <span className='text-red-300 ml-2'>
                                Eviction ({evictionByTenantId.get(tenant.id)}{" "}
                                days)
                              </span>
                            ) : (
                              <span className='text-gray-400 ml-2'>
                                {getRemainingLeaseMonths(tenant)}{" "}
                                {getRemainingLeaseMonths(tenant) === 1
                                  ? "month"
                                  : "months"}{" "}
                                left
                              </span>
                            )}
                          </div>
                          <button
                            className='text-blue-400 hover:underline text-sm'
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTenant(tenant);
                              setShowTenantDetails(true);
                            }}
                          >
                            View details
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {isOwnedByPlayer && hasVacancy && !isLand && (
                  <>
                    <span className='text-gray-400'>Potential Rent:</span>
                    <span>
                      {formatCurrency(property.rentPrice)}
                      {unitCount > 1 ? "/unit" : ""}/month
                    </span>
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
                  {formatPercent(property.marketTrends.historicalAppreciation)}
                </span>

                <span className='text-gray-400'>Job Growth:</span>
                <span>
                  {formatPercent(property.economicIndicators.jobGrowth)}
                </span>

                <span className='text-gray-400'>Property Supply:</span>
                <span>{property.marketTrends.propertySupply} listings</span>

                <span className='text-gray-400'>Avg Days on Market:</span>
                <span>{property.marketTrends.averageDaysOnMarket} days</span>

                <span className='text-gray-400'>Local Population:</span>
                <span>
                  {property.economicIndicators.population.toLocaleString()}
                </span>

                <span className='text-gray-400'>Median Income:</span>
                <span>
                  {formatCurrency(property.economicIndicators.medianIncome)}
                </span>

                <span className='text-gray-400'>Unemployment Rate:</span>
                <span>
                  {formatPercent(property.economicIndicators.unemploymentRate)}
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
                  ? property.forSale
                    ? "Cancel Listing"
                    : `List for ${formatCurrency(
                        property.salePrice || property.value
                      )}`
                  : `Buy for ${formatCurrency(property.marketPrice)}`}
              </button>
            )}

            {isOwnedByPlayer && !isLand && onRent && (
              <button
                className={`px-4 py-2 rounded ${
                  property.isRented && !hasVacancy
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-blue-500 hover:bg-blue-600"
                } text-white`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRentClick();
                }}
              >
                {property.isRented && !hasVacancy
                  ? "End Leases"
                  : `Find Tenants${hasVacancy ? ` (${occupiedUnits}/${unitCount}) (${formatCurrency(TENANT_FIND_PRICE)})` : ""}`}
              </button>
            )}

            {isOwnedByPlayer && onRenovate && (
              <button
                className='px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded disabled:bg-gray-400 disabled:text-gray-200'
                onClick={(e) => {
                  e.stopPropagation();
                  onRenovate(property.id);
                }}
                disabled={Boolean(
                  property.renovationBonusPercentage >= 100 ||
                  property.isRented ||
                  property.renovation ||
                  (playerMoney !== undefined && playerMoney < renovationCost)
                )}
              >
                Renovate ({formatCurrency(renovationCost)})
              </button>
            )}

            {isOwnedByPlayer && onRenovateToMax && (
              <button
                className='px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded disabled:bg-gray-400 disabled:text-gray-200'
                onClick={(e) => {
                  e.stopPropagation();
                  onRenovateToMax(property.id);
                }}
                disabled={Boolean(
                  property.renovationBonusPercentage >= 100 ||
                  property.isRented ||
                  property.renovation ||
                  !renovateToMaxCost ||
                  (playerMoney !== undefined && playerMoney < renovateToMaxCost)
                )}
              >
                Renovate to 100% ({formatCurrency(renovateToMaxCost || 0)})
              </button>
            )}

            {isOwnedByPlayer && !isLand && onBulldoze && (
              <button
                className='px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded disabled:bg-gray-700 disabled:text-gray-400'
                onClick={(e) => {
                  e.stopPropagation();
                  onBulldoze(property.id);
                }}
                disabled={
                  hasOccupants ||
                  hasActiveEvictions ||
                  property.isProtected ||
                  (playerMoney !== undefined && playerMoney < bulldozeCost)
                }
              >
                Bulldoze ({formatCurrency(bulldozeCost)})
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

          {isOwnedByPlayer && property.forSale && (
            <div className='mt-4 border-t border-gray-600 pt-4'>
              <h4 className='text-sm font-semibold text-gray-200 mb-3'>
                Sale Offers
              </h4>
              {property.saleOffers && property.saleOffers.length > 0 ? (
                <div className='space-y-3'>
                  {property.saleOffers.map((offer) => (
                    <div
                      key={offer.id}
                      className='flex flex-wrap items-center justify-between gap-3 bg-gray-800/60 p-3 rounded'
                    >
                      <div>
                        <div className='font-medium'>
                          {offer.buyerName} offered{" "}
                          {formatCurrency(offer.amount)}
                        </div>
                        <div className='text-xs text-gray-400'>
                          {formatDate(offer.date)}
                        </div>
                      </div>
                      {onAcceptOffer && (
                        <button
                          className='px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded'
                          onClick={(e) => {
                            e.stopPropagation();
                            onAcceptOffer(property.id, offer.id);
                          }}
                        >
                          Accept
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-sm text-gray-400'>
                  No offers yet. Buyers are still evaluating the listing.
                </p>
              )}
            </div>
          )}

          {isOwnedByPlayer && hasVacancy && !isLand && (
            <div className='mt-4 border-t border-gray-600 pt-4'>
              <div className='flex items-center justify-between mb-2'>
                <h4 className='text-sm font-semibold text-gray-200'>
                  Listing Settings
                </h4>
                {listingKeywords.length > 0 && (
                  <span className='text-xs text-gray-400'>
                    {listingKeywords.length} keywords selected
                  </span>
                )}
              </div>

              {onUpdateRentPrice && (
                <div className='mb-4'>
                  <label className='block text-xs text-gray-400 mb-2'>
                    Rent Price {unitCount > 1 ? "(per unit)" : ""}
                  </label>
                  <div className='flex flex-wrap gap-2 items-center'>
                    <input
                      type='number'
                      className='bg-gray-800 text-white p-2 rounded w-32'
                      value={rentPriceInput}
                      onChange={(e) => {
                        const nextValue = Number(e.target.value);
                        setRentPriceInput(
                          Number.isFinite(nextValue) ? nextValue : 0
                        );
                      }}
                      onBlur={handleRentPriceUpdate}
                      min={0}
                    />
                    <button
                      className='px-3 py-2 text-xs rounded bg-gray-600 hover:bg-gray-500 text-white'
                      onClick={(e) => {
                        e.stopPropagation();
                        const normalized = Math.round(marketRent);
                        setRentPriceInput(normalized);
                        if (onUpdateRentPrice) {
                          onUpdateRentPrice(property.id, normalized);
                        }
                      }}
                    >
                      Set to Market
                    </button>
                  </div>
                  <p className='text-xs text-gray-400 mt-2'>
                    {marketRent > 0
                      ? `Market rent: ${formatCurrency(marketRent)}/month`
                      : "Market rent unavailable"}
                    {marketRent > 0 && rentDeltaPercent !== 0 && (
                      <span
                        className={`ml-2 ${
                          rentDeltaPercent > 0
                            ? "text-yellow-300"
                            : "text-green-300"
                        }`}
                      >
                        ({rentDeltaPercent > 0 ? "+" : ""}
                        {rentDeltaPercent}% vs market)
                      </span>
                    )}
                  </p>
                </div>
              )}

              {onUpdateListing && (
                <>
                  <p className='text-xs text-gray-400 mb-3'>
                    Keywords influence how many applications you receive and the
                    kind of tenants who apply.
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    {LISTING_KEYWORD_OPTIONS.map((option) => {
                      const isSelected = listingKeywords.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          className={`px-3 py-1 text-xs rounded-full border ${
                            isSelected
                              ? "bg-blue-600 border-blue-500 text-white"
                              : "bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-400"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleListingKeyword(option.value);
                          }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  {listingKeywords.length === 0 && (
                    <p className='text-xs text-gray-500 mt-2'>
                      No keywords selected yet.
                    </p>
                  )}
                </>
              )}

              {onUpdateListingCopy && (
                <div className='mt-4'>
                  <label className='block text-xs text-gray-400 mb-2'>
                    Listing Copy
                  </label>
                  <textarea
                    className='w-full bg-gray-800 text-white p-2 rounded min-h-[90px]'
                    value={listingCopy}
                    onChange={(e) => setListingCopy(e.target.value)}
                    onBlur={handleListingCopyBlur}
                    placeholder='Highlight amenities, lifestyle, and what makes the property stand out.'
                  />
                </div>
              )}
            </div>
          )}

          {/* Property manager badge */}
          {isOwnedByPlayer && isOutsourced && (
            <div className='mt-3 p-2 bg-purple-900/30 rounded'>
              <p className='text-sm'>🏢 Property management outsourced</p>
            </div>
          )}

          {/* Land development */}
          {isLand && isOwnedByPlayer && (
            <div className='mt-3 p-3 bg-blue-900/30 rounded text-sm'>
              <h4 className='font-semibold mb-2 text-blue-200'>
                Land Development
              </h4>

              {onRaiseFunds && (
                <div className='mb-3'>
                  {property.developmentFunding &&
                  property.developmentFunding > 0 ? (
                    <p className='text-gray-300'>
                      Development funding raised:{" "}
                      {formatCurrency(property.developmentFunding)}
                    </p>
                  ) : (
                    <button
                      className='px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded'
                      onClick={(e) => {
                        e.stopPropagation();
                        onRaiseFunds(property.id);
                      }}
                    >
                      Raise Funds ({formatCurrency(developmentFundingAmount)})
                    </button>
                  )}
                </div>
              )}

              {!property.development && (
                <>
                  <p className='text-gray-300 mb-2'>
                    Apply for a building permit to start development.
                  </p>
                  <button
                    className='px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:bg-gray-600'
                    onClick={(e) => {
                      e.stopPropagation();
                      onApplyPermit?.(property.id);
                    }}
                    disabled={playerMoney < permitCost}
                  >
                    Apply for Permit ({formatCurrency(permitCost)})
                  </button>
                  <p className='text-xs text-gray-400 mt-2'>
                    Typical permit time: {PERMIT_DURATION_DAYS} days
                  </p>
                </>
              )}

              {property.development?.phase === "permitting" && (
                <div className='text-gray-200'>
                  Permit review in progress.{" "}
                  {property.development.daysRemaining} days remaining.
                </div>
              )}

              {property.development?.phase === "permitted" && (
                <>
                  <p className='text-gray-300 mb-2'>
                    Permit approved. Ready to start construction.
                  </p>
                  <button
                    className='px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:bg-gray-600'
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartConstruction?.(property.id);
                    }}
                    disabled={playerMoney < constructionCost}
                  >
                    Start Construction ({formatCurrency(constructionCost)})
                  </button>
                  <p className='text-xs text-gray-400 mt-2'>
                    Estimated build time: {CONSTRUCTION_DURATION_DAYS} days
                  </p>
                </>
              )}

              {property.development?.phase === "construction" && (
                <div className='text-gray-200'>
                  Construction underway. {property.development.daysRemaining}{" "}
                  days remaining.
                </div>
              )}
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
      {showTenantDetails && selectedTenant && (
        <div
          className='fixed inset-0 flex items-end justify-center z-[60] bg-black/40'
          onClick={(e) => {
            e.stopPropagation();
            setShowTenantDetails(false);
            setSelectedTenant(null);
          }}
        >
          <div
            className='bg-gray-800 w-full max-h-[60vh] rounded-t-xl shadow-2xl overflow-auto animate-slide-up'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='sticky top-0 bg-gray-700 z-10 px-6 pt-4 pb-2 flex justify-between items-start border-b border-gray-600'>
              <h2 className='text-2xl font-bold'>Tenant Details</h2>
              <button
                onClick={() => {
                  setShowTenantDetails(false);
                  setSelectedTenant(null);
                }}
                className='text-gray-400 hover:text-white text-2xl font-bold'
              >
                ×
              </button>
            </div>

            <div className='p-4'>
              <TenantDetailsModal
                property={property}
                tenant={selectedTenant}
                onClose={() => setShowTenantDetails(false)}
                onEvictTenant={onEvictTenant || (() => {})}
                isCardDeck={true}
                currentDate={currentDate}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetailsModal;

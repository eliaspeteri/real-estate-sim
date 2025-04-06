import React from "react";
import { Property } from "../../types";

interface TenantDetailsModalProps {
  property: Property;
  onClose: () => void;
  onEvictTenant?: (propertyId: number) => void;
  isCardDeck?: boolean;
}

const TenantDetailsModal: React.FC<TenantDetailsModalProps> = ({
  property,
  onClose,
  onEvictTenant,
  isCardDeck = false
}) => {
  if (!property.currentTenant) return null;
  const tenant = property.currentTenant;

  // Calculate rental history stats
  const calculatePaymentStats = () => {
    if (!property.tenantEvents)
      return { onTime: 0, late: 0, missed: 0, total: 0 };

    const stats = property.tenantEvents.reduce(
      (acc, event) => {
        if (event.type === "RENT_PAID") acc.onTime++;
        else if (event.type === "RENT_LATE") acc.late++;
        else if (event.type === "RENT_MISSED") acc.missed++;
        return acc;
      },
      { onTime: 0, late: 0, missed: 0, total: 0 }
    );

    stats.total = stats.onTime + stats.late + stats.missed;
    return stats;
  };

  const paymentStats = calculatePaymentStats();

  // Calculate income-to-rent ratio
  const incomeToRentRatio = tenant.monthlyIncome / property.rentPrice;

  // Calculate months remaining on lease
  const calculateRemainingLease = () => {
    if (!tenant.leaseStart || !tenant.leaseLength) return 0;

    const leaseStart = new Date(tenant.leaseStart);
    const leaseEnd = new Date(leaseStart);
    leaseEnd.setMonth(leaseEnd.getMonth() + tenant.leaseLength);

    const today = new Date();
    const remainingMonths =
      (leaseEnd.getFullYear() - today.getFullYear()) * 12 +
      (leaseEnd.getMonth() - today.getMonth());

    return Math.max(0, remainingMonths);
  };

  const remainingLeaseMonths = calculateRemainingLease();

  const renderTenantDetails = () => (
    <div className='space-y-6'>
      {/* Tenant Overview */}
      <div className='bg-gray-700 p-4 rounded'>
        <h3 className='text-lg font-semibold mb-3'>Tenant Overview</h3>
        <div className='grid grid-cols-2 gap-y-2'>
          <span className='text-gray-400'>Name:</span>
          <span>{tenant.name}</span>

          <span className='text-gray-400'>Occupation:</span>
          <span>{tenant.occupation}</span>

          <span className='text-gray-400'>Monthly Income:</span>
          <span>${tenant.monthlyIncome.toLocaleString()}</span>

          <span className='text-gray-400'>Income/Rent Ratio:</span>
          <span
            className={
              incomeToRentRatio > 3
                ? "text-green-400"
                : incomeToRentRatio > 2
                ? "text-yellow-400"
                : "text-red-400"
            }
          >
            {incomeToRentRatio.toFixed(1)}x
          </span>

          <span className='text-gray-400'>Credit Score:</span>
          <span
            className={
              tenant.creditScore > 700
                ? "text-green-400"
                : tenant.creditScore > 600
                ? "text-yellow-400"
                : "text-red-400"
            }
          >
            {tenant.creditScore}
          </span>

          <span className='text-gray-400'>Family Size:</span>
          <span>
            {tenant.familySize} {tenant.familySize > 1 ? "people" : "person"}
          </span>

          <span className='text-gray-400'>Has Pets:</span>
          <span>{tenant.pets ? "Yes" : "No"}</span>

          <span className='text-gray-400'>Smoker:</span>
          <span>{tenant.smoker ? "Yes" : "No"}</span>
        </div>
      </div>

      {/* Lease Details */}
      <div className='bg-gray-700 p-4 rounded'>
        <h3 className='text-lg font-semibold mb-3'>Lease Details</h3>
        <div className='grid grid-cols-2 gap-y-2'>
          <span className='text-gray-400'>Lease Term:</span>
          <span>{tenant.leaseLength} months</span>

          <span className='text-gray-400'>Monthly Rent:</span>
          <span className='text-green-400'>
            ${property.rentPrice.toLocaleString()}
          </span>

          <span className='text-gray-400'>Lease Start:</span>
          <span>
            {tenant.leaseStart
              ? new Date(tenant.leaseStart).toLocaleDateString()
              : "N/A"}
          </span>

          <span className='text-gray-400'>Remaining:</span>
          <span>
            {remainingLeaseMonths}{" "}
            {remainingLeaseMonths === 1 ? "month" : "months"}
          </span>
        </div>
      </div>

      {/* Payment History */}
      <div className='bg-gray-700 p-4 rounded'>
        <h3 className='text-lg font-semibold mb-3'>Payment History</h3>
        {paymentStats.total > 0 ? (
          <div>
            <div className='flex items-center mb-2'>
              <div className='flex-1 bg-gray-600 h-4 rounded-full overflow-hidden'>
                <div
                  className='bg-green-500 h-full'
                  style={{
                    width: `${
                      (paymentStats.onTime / paymentStats.total) * 100
                    }%`
                  }}
                ></div>
                <div
                  className='bg-yellow-500 h-full'
                  style={{
                    width: `${(paymentStats.late / paymentStats.total) * 100}%`
                  }}
                ></div>
                <div
                  className='bg-red-500 h-full'
                  style={{
                    width: `${
                      (paymentStats.missed / paymentStats.total) * 100
                    }%`
                  }}
                ></div>
              </div>
            </div>

            <div className='grid grid-cols-3 text-center text-sm'>
              <div>
                <span className='inline-block w-3 h-3 bg-green-500 rounded-full mr-1'></span>
                <span>On-time: {paymentStats.onTime}</span>
              </div>
              <div>
                <span className='inline-block w-3 h-3 bg-yellow-500 rounded-full mr-1'></span>
                <span>Late: {paymentStats.late}</span>
              </div>
              <div>
                <span className='inline-block w-3 h-3 bg-red-500 rounded-full mr-1'></span>
                <span>Missed: {paymentStats.missed}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className='text-gray-400'>No payment history yet.</p>
        )}
      </div>

      {/* Tenant Events */}
      <div className='bg-gray-700 p-4 rounded'>
        <h3 className='text-lg font-semibold mb-3'>Tenant History</h3>
        {property.tenantEvents && property.tenantEvents.length > 0 ? (
          <div className='space-y-2 max-h-[200px] overflow-y-auto'>
            {property.tenantEvents
              .slice()
              .reverse()
              .map((event, index) => (
                <div
                  key={index}
                  className='p-2 border-l-4 text-sm'
                  style={{
                    borderLeftColor:
                      event.type === "RENT_PAID"
                        ? "#10B981" // green
                        : event.type === "DAMAGE"
                        ? "#EF4444" // red
                        : event.type === "RENT_LATE"
                        ? "#F59E0B" // amber
                        : event.type === "RENT_MISSED"
                        ? "#DC2626" // red
                        : event.type === "COMPLAINT"
                        ? "#6366F1" // indigo
                        : "#6B7280" // gray
                  }}
                >
                  <div className='flex justify-between mb-1'>
                    <span className='font-medium'>
                      {event.type === "RENT_PAID"
                        ? "Payment Received"
                        : event.type === "RENT_LATE"
                        ? "Late Payment"
                        : event.type === "RENT_MISSED"
                        ? "Missed Payment"
                        : event.type === "DAMAGE"
                        ? "Property Damage"
                        : event.type === "COMPLAINT"
                        ? "Tenant Issue"
                        : event.type === "LEASE_BREAK"
                        ? "Lease Break"
                        : event.type === "RENEWAL"
                        ? "Lease Renewal"
                        : "Event"}
                    </span>
                    <span className='text-xs text-gray-400'>
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className='text-gray-300'>{event.description}</p>
                  {event.financialImpact !== 0 && (
                    <p
                      className={
                        event.financialImpact > 0
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      Financial Impact: $
                      {Math.abs(event.financialImpact).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <p className='text-gray-400'>No events recorded yet.</p>
        )}
      </div>

      {/* Eviction Action */}
      {onEvictTenant && (
        <div className='mt-6'>
          <button
            className='w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded'
            onClick={() => {
              if (onEvictTenant) {
                onEvictTenant(property.id);
                onClose();
              }
            }}
          >
            Evict Tenant
          </button>
          <p className='text-xs text-gray-400 mt-2'>
            Warning: Eviction costs $1,000 in legal fees and may leave your
            property vacant.
          </p>
        </div>
      )}
    </div>
  );

  if (isCardDeck) {
    // When used in card deck mode, just return the content
    return renderTenantDetails();
  }

  // When used as a standalone modal
  return (
    <div className='fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75'>
      <div className='bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-2xl font-bold'>Tenant Details: {tenant.name}</h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-white text-2xl font-bold'
          >
            ×
          </button>
        </div>

        {renderTenantDetails()}
      </div>
    </div>
  );
};

export default TenantDetailsModal;

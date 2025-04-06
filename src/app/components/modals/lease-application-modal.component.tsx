import React from "react";
import { LeaseApplication, Property } from "../../types";

interface LeaseApplicationModalProps {
  property: Property;
  applications: LeaseApplication[];
  onClose: () => void;
  onAcceptApplication: (
    property: Property,
    application: LeaseApplication
  ) => void;
  isCardDeck?: boolean;
}

const LeaseApplicationModal: React.FC<LeaseApplicationModalProps> = ({
  property,
  applications,
  onClose,
  onAcceptApplication,
  isCardDeck = false
}) => {
  if (applications.length === 0) {
    return (
      <div className='p-4 text-center'>
        <p>No applications received yet. Check back later.</p>
        <button
          className='mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded'
          onClick={onClose}
        >
          Close
        </button>
      </div>
    );
  }

  const renderApplications = () => (
    <div className='space-y-6'>
      <p className='text-blue-400'>
        You have {applications.length} lease applications for this property.
      </p>

      {applications.map((application, index) => {
        const tenant = application.tenant;
        const incomeToRentRatio = tenant.monthlyIncome / property.rentPrice;

        return (
          <div key={index} className='bg-gray-700 p-4 rounded'>
            <div className='flex justify-between items-start mb-3'>
              <h3 className='font-semibold text-lg'>{tenant.name}</h3>
              <div className='flex items-center'>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    tenant.creditScore > 700
                      ? "bg-green-500 text-white"
                      : tenant.creditScore > 600
                      ? "bg-yellow-500 text-black"
                      : "bg-red-500 text-white"
                  }`}
                >
                  Credit: {tenant.creditScore}
                </span>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-2 mb-4'>
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

              <span className='text-gray-400'>Family Size:</span>
              <span>
                {tenant.familySize}{" "}
                {tenant.familySize > 1 ? "people" : "person"}
              </span>

              <span className='text-gray-400'>Has Pets:</span>
              <span>{tenant.pets ? "Yes" : "No"}</span>

              <span className='text-gray-400'>Smoker:</span>
              <span>{tenant.smoker ? "Yes" : "No"}</span>

              <span className='text-gray-400'>Desired Lease:</span>
              <span>{application.desiredLeaseLength} months</span>

              <span className='text-gray-400'>References:</span>
              <span>{tenant.references}</span>

              <span className='text-gray-400'>Previous Evictions:</span>
              <span
                className={
                  tenant.rentalHistory.evictions > 0 ? "text-red-400" : ""
                }
              >
                {tenant.rentalHistory.evictions}
              </span>
            </div>

            <div className='mt-4'>
              <button
                className='px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded w-full'
                onClick={() => onAcceptApplication(property, application)}
              >
                Accept Application
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (isCardDeck) {
    // When used in card deck mode, just return the content
    return renderApplications();
  }

  // When used as a standalone modal, include the outer modal structure
  return (
    <div className='fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75'>
      <div className='bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-2xl font-bold'>Lease Applications</h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-white text-2xl font-bold'
          >
            ×
          </button>
        </div>

        {renderApplications()}
      </div>
    </div>
  );
};

export default LeaseApplicationModal;

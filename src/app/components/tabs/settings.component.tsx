import React, { useState } from "react";
import { Property } from "../../types";

interface SettingsProps {
  tickRate: number;
  setTickRate: (rate: number) => void;
  paused: boolean;
  setPaused: (paused: boolean) => void;
  propertyManager: {
    hired: boolean;
    fee: number;
    efficiency: number;
  };
  togglePropertyManager: () => void;
  outsourcedProperties: Set<number>;
  ownedProperties: Property[];
  toggleOutsourceProperty: (propertyId: number) => void;
}

export const Settings = ({
  tickRate,
  setTickRate,
  paused,
  setPaused,
  propertyManager,
  togglePropertyManager,
  outsourcedProperties,
  ownedProperties,
  toggleOutsourceProperty
}: SettingsProps) => {
  const [showOutsourceSettings, setShowOutsourceSettings] = useState(false);

  return (
    <div className='bg-gray-800 rounded-lg p-6'>
      <h2 className='text-xl font-semibold mb-4'>Game Settings</h2>

      <div className='space-y-6'>
        <div>
          <label className='block text-sm font-medium text-gray-400 mb-2'>
            Game Speed
          </label>
          <div className='flex gap-3'>
            <button
              className={`px-4 py-2 rounded border ${
                tickRate === 5000
                  ? "border-blue-500 bg-blue-900/30"
                  : "border-gray-600"
              }`}
              onClick={() => {
                setPaused(false);
                setTickRate(5000);
              }}
            >
              Slow
            </button>
            <button
              className={`px-4 py-2 rounded border ${
                tickRate === 1000
                  ? "border-blue-500 bg-blue-900/30"
                  : "border-gray-600"
              }`}
              onClick={() => {
                setPaused(false);
                setTickRate(1000);
              }}
            >
              Normal
            </button>
            <button
              className={`px-4 py-2 rounded border ${
                tickRate === 100
                  ? "border-blue-500 bg-blue-900/30"
                  : "border-gray-600"
              }`}
              onClick={() => {
                setPaused(false);
                setTickRate(100);
              }}
            >
              Fast
            </button>
            <button
              className={`px-4 py-2 rounded border ${
                paused ? "border-red-500 bg-red-900/30" : "border-gray-600"
              }`}
              onClick={() => setPaused(!paused)}
            >
              {paused ? "Resume" : "Pause"}
            </button>
          </div>
        </div>

        {/* Property Management Section */}
        <div className='border-t border-gray-700 pt-6'>
          <h3 className='text-lg font-semibold mb-3'>Property Management</h3>

          <div className='bg-gray-700 p-4 rounded mb-4'>
            <div className='flex justify-between items-center'>
              <div>
                <h4 className='font-medium'>Property Manager</h4>
                <p className='text-sm text-gray-400 mt-1'>
                  Hire a property manager to handle tenant issues and find new
                  tenants for outsourced properties. Monthly fee: $
                  {propertyManager.fee.toLocaleString()}
                </p>
              </div>
              <div>
                <label className='inline-flex items-center cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={propertyManager.hired}
                    onChange={togglePropertyManager}
                    className='sr-only peer'
                  />
                  <div className='relative w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600'></div>
                  <span className='ml-3 text-sm font-medium'>
                    {propertyManager.hired ? "Hired" : "Not Hired"}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <button
            className='w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded mb-4'
            onClick={() => setShowOutsourceSettings(!showOutsourceSettings)}
          >
            {showOutsourceSettings
              ? "Hide Property Outsourcing"
              : "Manage Property Outsourcing"}
          </button>

          {showOutsourceSettings && (
            <div className='bg-gray-700 p-4 rounded'>
              <h4 className='font-medium mb-3'>
                Select Properties to Outsource
              </h4>
              {ownedProperties.length === 0 ? (
                <p className='text-gray-400'>
                  You don&apos;t own any properties to outsource.
                </p>
              ) : (
                <div className='max-h-[300px] overflow-y-auto'>
                  {ownedProperties.map((property) => (
                    <div
                      key={property.id}
                      className={`p-2 mb-2 border rounded flex justify-between items-center ${
                        outsourcedProperties.has(property.id)
                          ? "border-purple-500 bg-purple-900/20"
                          : "border-gray-600"
                      }`}
                    >
                      <div>
                        <p className='font-medium'>
                          {property.address.split(",")[0]}
                        </p>
                        <p className='text-sm text-gray-400'>
                          {property.type} - {property.location}
                        </p>
                      </div>
                      <label className='inline-flex items-center cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={outsourcedProperties.has(property.id)}
                          onChange={() => toggleOutsourceProperty(property.id)}
                          className='sr-only peer'
                        />
                        <div className='relative w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600'></div>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              <div className='mt-3 text-sm text-gray-400'>
                <p>
                  Note: Outsourcing property management allows the property
                  manager to find tenants and handle issues. There is a fee for
                  each tenant found (half month&apos;s rent).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Display Settings */}
        <div className='border-t border-gray-700 pt-6'>
          <h3 className='text-lg font-semibold mb-3'>Display Settings</h3>
          <div className='space-y-3'>
            <label className='flex items-center space-x-2'>
              <input
                type='checkbox'
                className='form-checkbox h-5 w-5 text-blue-500'
                defaultChecked
              />
              <span>Show property notifications</span>
            </label>

            <label className='flex items-center space-x-2'>
              <input
                type='checkbox'
                className='form-checkbox h-5 w-5 text-blue-500'
                defaultChecked
              />
              <span>Auto-sort by newest properties</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

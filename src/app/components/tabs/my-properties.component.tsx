import React, { useState } from "react";
import PropertyCard from "../property-card.component";
import { LeaseApplication, Property } from "../../types";

interface MyPropertiesProps {
  properties: Property[];
  onBuyOrSell: (propertyId: number) => void;
  onRent: (propertyId: number) => void;
  onRenovate: (propertyId: number) => void;
  onEvictTenant?: (propertyId: number) => void;
  playerMoney: number;
  outsourcedProperties?: Set<number>;
  onToggleOutsource?: (propertyId: number) => void;
  handleAcceptApplication?: (
    property: Property,
    application: LeaseApplication
  ) => void;
  setPaused?: (paused: boolean) => void;
}

export const MyProperties: React.FC<MyPropertiesProps> = ({
  properties,
  onBuyOrSell,
  onRent,
  onRenovate,
  onEvictTenant,
  playerMoney,
  outsourcedProperties = new Set(),
  onToggleOutsource,
  handleAcceptApplication,
  setPaused
}) => {
  // Filter for properties owned by the player
  const ownedProperties = properties.filter((p) => p.owner === "Player");
  const [sortOrder, setSortOrder] = useState<"value" | "rent" | "default">(
    "default"
  );

  // Sort properties based on selected criteria
  const sortedProperties = React.useMemo(() => {
    if (sortOrder === "value") {
      return [...ownedProperties].sort((a, b) => b.value - a.value);
    } else if (sortOrder === "rent") {
      return [...ownedProperties].sort(
        (a, b) =>
          (b.isRented ? b.rentPrice : 0) - (a.isRented ? a.rentPrice : 0)
      );
    }
    return ownedProperties;
  }, [ownedProperties, sortOrder]);

  return (
    <>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-xl font-semibold'>My Properties</h2>
        <div className='flex items-center'>
          <span className='mr-2'>Sort by:</span>
          <select
            className='border p-1 rounded bg-gray-700 text-white'
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(e.target.value as "value" | "rent" | "default")
            }
          >
            <option value='default'>Default</option>
            <option value='value'>Highest Value</option>
            <option value='rent'>Highest Rent</option>
          </select>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {sortedProperties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            onBuyOrSell={onBuyOrSell}
            onRent={onRent}
            onRenovate={onRenovate}
            onEvictTenant={onEvictTenant}
            playerMoney={playerMoney}
            isOutsourced={outsourcedProperties.has(property.id)}
            onToggleOutsource={onToggleOutsource}
            handleAcceptApplication={handleAcceptApplication}
            setPaused={setPaused}
          />
        ))}
      </div>

      {ownedProperties.length === 0 && (
        <div className='text-center py-10 text-gray-400'>
          <p>You don&apos;t own any properties yet.</p>
          <p className='mt-2'>
            Purchase properties from the market to grow your portfolio!
          </p>
        </div>
      )}
    </>
  );
};

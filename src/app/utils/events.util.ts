import { v4 as uuidv4 } from "uuid";
import {
  GameEvent,
  EventSeverity,
  EventCategory,
  EventImpactType,
  PropertyType,
  Location
} from "../types";

// Predefined events library
export const eventLibrary: GameEvent[] = [
  // Major Economic Events
  {
    id: "economic-boom",
    title: "Economic Boom",
    description:
      "The economy is thriving with low unemployment and high consumer confidence.",
    detailedDescription:
      "A period of robust economic growth has created favorable market conditions for real estate. Property values are increasing rapidly, and banks are more willing to lend money at competitive rates. Tenant quality is also improved as more people have stable incomes.",
    severity: EventSeverity.MAJOR,
    category: EventCategory.ECONOMIC,
    duration: 24, // 24 months
    probability: 0.01, // 1% chance per month
    impacts: [
      { type: EventImpactType.INTEREST_RATE, value: -0.01 }, // Lower interest rates
      { type: EventImpactType.LOAN_APPROVAL, value: 0.2 }, // 20% better loan approval
      { type: EventImpactType.MAX_LOAN_AMOUNT, value: 0.15 }, // 15% higher max loan
      { type: EventImpactType.TENANT_QUALITY, value: 0.1 }, // 10% better tenants
      { type: EventImpactType.PROPERTY_VALUE, value: 0.03 } // 3% monthly property appreciation
    ],
    imageUrl: "/images/events/economic-boom.jpg"
  },
  {
    id: "recession",
    title: "Economic Recession",
    description:
      "The economy has fallen into a recession with rising unemployment and decreasing consumer spending.",
    detailedDescription:
      "Economic indicators are showing a significant downturn. Banks have tightened lending practices, property values are stagnating or decreasing, and finding quality tenants has become more challenging as unemployment rises.",
    severity: EventSeverity.MAJOR,
    category: EventCategory.ECONOMIC,
    duration: 18, // 18 months
    probability: 0.008, // 0.8% chance per month
    impacts: [
      { type: EventImpactType.INTEREST_RATE, value: 0.015 }, // Higher interest rates
      { type: EventImpactType.LOAN_APPROVAL, value: -0.25 }, // 25% worse loan approval
      { type: EventImpactType.MAX_LOAN_AMOUNT, value: -0.2 }, // 20% lower max loan
      { type: EventImpactType.TENANT_QUALITY, value: -0.15 }, // 15% worse tenants
      { type: EventImpactType.PROPERTY_VALUE, value: -0.01 } // 1% monthly property depreciation
    ],
    relatedEvents: ["foreclosure-wave", "tenant-payment-issues"],
    imageUrl: "/images/events/recession.jpg"
  },

  // Environmental Events
  {
    id: "natural-disaster",
    title: "Natural Disaster",
    description: "A significant natural disaster has affected the region.",
    detailedDescription:
      "A natural disaster has hit the area, causing widespread property damage and disruption. Insurance costs are rising, and some areas may see decreased property values due to perceived risk. However, there may be opportunities in renovation and rebuilding.",
    severity: EventSeverity.MAJOR,
    category: EventCategory.ENVIRONMENTAL,
    duration: 6, // 6 months
    probability: 0.005, // 0.5% chance per month
    impacts: [
      { type: EventImpactType.PROPERTY_VALUE, value: -0.1 }, // 10% property value reduction
      { type: EventImpactType.MAINTENANCE_COST, value: 0.25 }, // 25% higher maintenance costs
      { type: EventImpactType.RENOVATION_COST, value: 0.2 } // 20% higher renovation costs
    ],
    choices: [
      {
        id: "invest-recovery",
        description: "Invest in disaster recovery efforts ($50,000)",
        impacts: [
          { type: EventImpactType.PROPERTY_VALUE, value: 0.05 } // Offset some property value loss
        ],
        requiredMoney: 50000
      },
      {
        id: "minimal-response",
        description: "Provide only minimal necessary repairs",
        impacts: [
          { type: EventImpactType.TENANT_QUALITY, value: -0.1 } // Lower tenant quality
        ]
      }
    ],
    imageUrl: "/images/events/natural-disaster.jpg"
  },

  // Minor Events
  {
    id: "local-business-growth",
    title: "Local Business Growth",
    description:
      "New businesses are opening in certain areas, increasing desirability.",
    detailedDescription:
      "Several new businesses have opened in specific neighborhoods, creating jobs and improving the local economy. Properties in these areas may see increased values and tenant demand.",
    severity: EventSeverity.MINOR,
    category: EventCategory.ECONOMIC,
    duration: 12, // 12 months
    probability: 0.03, // 3% chance per month
    impacts: [
      {
        type: EventImpactType.PROPERTY_VALUE,
        value: 0.02,
        affectedAreas: [Location.DOWNTOWN, Location.URBAN]
      },
      {
        type: EventImpactType.TENANT_QUALITY,
        value: 0.05,
        affectedAreas: [Location.DOWNTOWN, Location.URBAN]
      }
    ],
    imageUrl: "/images/events/local-business.jpg"
  },
  {
    id: "infrastructure-improvement",
    title: "Infrastructure Improvement",
    description:
      "The city is investing in infrastructure upgrades in certain areas.",
    detailedDescription:
      "The local government is implementing infrastructure improvements including transportation, utilities, and public spaces. Properties in affected areas will likely see increased values.",
    severity: EventSeverity.MINOR,
    category: EventCategory.POLITICAL,
    duration: 18, // 18 months
    probability: 0.02, // 2% chance per month
    impacts: [
      {
        type: EventImpactType.PROPERTY_VALUE,
        value: 0.015,
        affectedAreas: [Location.SUBURBAN]
      },
      {
        type: EventImpactType.AREA_QUALITY,
        value: 0.1,
        affectedAreas: [Location.SUBURBAN]
      }
    ],
    imageUrl: "/images/events/infrastructure.jpg"
  },
  {
    id: "tenant-payment-issues",
    title: "Widespread Tenant Payment Issues",
    description:
      "Economic conditions are causing tenants to struggle with rent payments.",
    detailedDescription:
      "Due to current economic conditions, tenants across various properties are having difficulty making timely rent payments. This may affect your cash flow and require proactive management.",
    severity: EventSeverity.MINOR,
    category: EventCategory.ECONOMIC,
    duration: 3, // 3 months
    probability: 0.015, // 1.5% chance per month
    impacts: [
      {
        type: EventImpactType.TENANT_QUALITY,
        value: -0.2 // 20% lower tenant quality (payment reliability)
      }
    ],
    imageUrl: "/images/events/tenant-issues.jpg"
  }

  // Additional events can be added here
];

// Function to check if a new event should occur
export const checkForNewEvents = (
  currentEvents: GameEvent[],
  currentDate: Date
): GameEvent[] => {
  const newEvents: GameEvent[] = [];

  // Check each event in library that's not currently active
  eventLibrary.forEach((eventTemplate) => {
    // Skip if an event with this base ID is already active
    if (
      currentEvents.some((e) => e.id.startsWith(eventTemplate.id) && e.isActive)
    ) {
      return;
    }

    // Skip if there are contradicting active events
    if (hasContradictingEvents(eventTemplate.id, currentEvents)) {
      return;
    }

    // Check probability
    if (Math.random() < eventTemplate.probability) {
      // Create a new instance of the event
      const newEvent: GameEvent = {
        ...JSON.parse(JSON.stringify(eventTemplate)), // Deep copy
        id: `${eventTemplate.id}-${uuidv4().slice(0, 8)}`, // Unique ID
        startDate: new Date(currentDate),
        endDate: new Date(
          currentDate.getTime() +
            eventTemplate.duration * 30 * 24 * 60 * 60 * 1000
        ), // Approximate months to ms
        isActive: true
      };

      newEvents.push(newEvent);
    }
  });

  return newEvents;
};

// Helper function to check if there are contradicting events
const hasContradictingEvents = (
  eventId: string,
  currentEvents: GameEvent[]
): boolean => {
  // Define contradicting event pairs
  const contradictions: { [key: string]: string[] } = {
    "economic-boom": ["recession"],
    recession: ["economic-boom"]
  };

  // Get contradictions for this event
  const contradictingTypes = contradictions[eventId] || [];

  // Check if any contradicting events are active
  return currentEvents.some(
    (event) =>
      event.isActive &&
      contradictingTypes.some((contradictingType) =>
        event.id.startsWith(contradictingType)
      )
  );
};

// Calculate impact of events on a specific aspect
export const calculateEventImpact = (
  activeEvents: GameEvent[],
  impactType: EventImpactType,
  area?: Location,
  propertyType?: PropertyType
): number => {
  let impact = 0;

  activeEvents.forEach((event) => {
    if (!event.isActive) return;

    // Find relevant impacts
    event.impacts.forEach((eventImpact) => {
      if (eventImpact.type !== impactType) return;

      // Check if area-specific and matches
      if (
        eventImpact.affectedAreas &&
        area &&
        !eventImpact.affectedAreas.includes(area)
      ) {
        return;
      }

      // Check if property-type-specific and matches
      if (
        eventImpact.affectedPropertyTypes &&
        propertyType &&
        !eventImpact.affectedPropertyTypes.includes(propertyType)
      ) {
        return;
      }

      // Apply impact
      impact += eventImpact.value;
    });

    // If a choice was selected, apply its impacts too
    if (event.selectedChoice && event.choices) {
      const selectedChoice = event.choices.find(
        (c) => c.id === event.selectedChoice
      );
      if (selectedChoice) {
        selectedChoice.impacts.forEach((choiceImpact) => {
          if (choiceImpact.type !== impactType) return;

          // Check if area-specific and matches
          if (
            choiceImpact.affectedAreas &&
            area &&
            !choiceImpact.affectedAreas.includes(area)
          ) {
            return;
          }

          // Check if property-type-specific and matches
          if (
            choiceImpact.affectedPropertyTypes &&
            propertyType &&
            !choiceImpact.affectedPropertyTypes.includes(propertyType)
          ) {
            return;
          }

          // Apply impact
          impact += choiceImpact.value;
        });
      }
    }
  });

  return impact;
};

// Update active events (check for expired events)
export const updateActiveEvents = (
  events: GameEvent[],
  currentDate: Date
): GameEvent[] => {
  return events.map((event) => {
    if (event.isActive && event.endDate && currentDate > event.endDate) {
      return { ...event, isActive: false };
    }
    return event;
  });
};

// Handle event choice selection
export const selectEventChoice = (
  events: GameEvent[],
  eventId: string,
  choiceId: string,
  playerMoney: number
): {
  events: GameEvent[];
  moneyChange: number;
  success: boolean;
  message: string;
} => {
  const eventIndex = events.findIndex((e) => e.id === eventId);
  if (eventIndex === -1) {
    return {
      events,
      moneyChange: 0,
      success: false,
      message: "Event not found."
    };
  }

  const event = events[eventIndex];
  if (!event.choices) {
    return {
      events,
      moneyChange: 0,
      success: false,
      message: "This event has no choices."
    };
  }

  const choice = event.choices.find((c) => c.id === choiceId);
  if (!choice) {
    return {
      events,
      moneyChange: 0,
      success: false,
      message: "Choice not found."
    };
  }

  // Check if choice requires money
  if (choice.requiredMoney && choice.requiredMoney > playerMoney) {
    return {
      events,
      moneyChange: 0,
      success: false,
      message: `Not enough money. This choice requires $${choice.requiredMoney.toLocaleString()}.`
    };
  }

  // Update the event with the selected choice
  const updatedEvents = [...events];
  updatedEvents[eventIndex] = {
    ...event,
    selectedChoice: choiceId
  };

  // Return the money change (negative if requires money)
  const moneyChange = choice.requiredMoney ? -choice.requiredMoney : 0;

  return {
    events: updatedEvents,
    moneyChange,
    success: true,
    message: `You chose: ${choice.description}`
  };
};

// Check for related events that might trigger based on existing events
export const checkForRelatedEvents = (
  activeEvents: GameEvent[],
  currentDate: Date
): GameEvent[] => {
  const relatedEvents: GameEvent[] = [];

  activeEvents.forEach((event) => {
    if (
      !event.isActive ||
      !event.relatedEvents ||
      event.relatedEvents.length === 0
    ) {
      return;
    }

    event.relatedEvents.forEach((relatedEventId) => {
      // Find the related event template
      const relatedEventTemplate = eventLibrary.find(
        (e) => e.id === relatedEventId
      );
      if (!relatedEventTemplate) return;

      // Skip if an event with this base ID is already active
      if (
        activeEvents.some((e) => e.id.startsWith(relatedEventId) && e.isActive)
      ) {
        return;
      }

      // Skip if there are contradicting events
      if (hasContradictingEvents(relatedEventId, activeEvents)) {
        return;
      }

      // 25% chance of related event triggering when checked
      if (Math.random() < 0.25) {
        const newEvent: GameEvent = {
          ...JSON.parse(JSON.stringify(relatedEventTemplate)), // Deep copy
          id: `${relatedEventId}-${uuidv4().slice(0, 8)}`, // Unique ID
          startDate: new Date(currentDate),
          endDate: new Date(
            currentDate.getTime() +
              relatedEventTemplate.duration * 30 * 24 * 60 * 60 * 1000
          ),
          isActive: true
        };

        relatedEvents.push(newEvent);
      }
    });
  });

  return relatedEvents;
};


import React from 'react';
import { GameEvent, EventSeverity } from '../../types';

interface EventsBannerProps {
  activeEvents: GameEvent[];
  onEventClick: (event: GameEvent) => void;
}

const EventsBanner: React.FC<EventsBannerProps> = ({ activeEvents, onEventClick }) => {
  if (!activeEvents || activeEvents.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="flex flex-wrap gap-2">
        {activeEvents.map(event => (
          <button
            key={event.id}
            onClick={() => onEventClick(event)}
            className={`px-3 py-1 rounded-full text-sm font-medium flex items-center 
              ${event.severity === EventSeverity.MAJOR 
                ? 'bg-red-700 hover:bg-red-600 text-white' 
                : 'bg-yellow-600 hover:bg-yellow-500 text-white'}`}
          >
            <span className="mr-1">
              {event.severity === EventSeverity.MAJOR ? '🔴' : '🟡'}
            </span>
            {event.title}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EventsBanner;

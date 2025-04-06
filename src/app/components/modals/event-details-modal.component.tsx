import React, { useState, useEffect } from "react";
import { GameEvent, EventSeverity, EventChoice } from "../../types";

interface EventDetailsModalProps {
  event: GameEvent;
  isOpen: boolean;
  onClose: () => void;
  onMakeChoice: (eventId: string, choiceId: string) => void;
  playerMoney: number;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  isOpen,
  onClose,
  onMakeChoice,
  playerMoney
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  if (!isOpen) return null;

  const canAffordChoice = (choice: EventChoice) => {
    return !choice.requiredMoney || choice.requiredMoney <= playerMoney;
  };

  const endDate = event.endDate ? new Date(event.endDate) : null;
  const daysRemaining = endDate
    ? Math.ceil(
        (endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const formatImpact = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    const percentage = (value * 100).toFixed(1);
    return `${sign}${percentage}%`;
  };

  return (
    <div
      className='fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75 transition-opacity'
      onClick={handleClose}
    >
      <div
        className={`bg-gray-800 w-full max-w-2xl rounded-lg shadow-xl overflow-hidden 
          ${isClosing ? "animate-fade-out" : "animate-fade-in"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`p-6 border-b border-gray-700 ${
            event.severity === EventSeverity.MAJOR
              ? "bg-red-900/30"
              : "bg-yellow-900/30"
          }`}
        >
          <div className='flex justify-between items-start'>
            <div>
              <div className='flex items-center'>
                <span
                  className={`mr-2 text-2xl ${
                    event.severity === EventSeverity.MAJOR ? "🔴" : "🟡"
                  }`}
                >
                  {event.severity === EventSeverity.MAJOR ? "🔴" : "🟡"}
                </span>
                <h2 className='text-xl font-bold'>{event.title}</h2>
              </div>
              <p className='text-sm text-gray-300 mt-1'>
                {event.category} Event
              </p>
            </div>
            <button
              onClick={handleClose}
              className='text-gray-400 hover:text-white text-xl'
            >
              &times;
            </button>
          </div>
        </div>

        <div className='p-6 max-h-[70vh] overflow-y-auto'>
          <div className='mb-4'>
            <p className='text-gray-200'>
              {event.detailedDescription || event.description}
            </p>
          </div>

          {daysRemaining !== null && (
            <div className='mb-4 p-3 bg-gray-700 rounded'>
              <div className='flex justify-between items-center'>
                <span>Time remaining:</span>
                <span className='font-medium'>{daysRemaining} days</span>
              </div>
              <div className='mt-2'>
                <div className='w-full bg-gray-600 rounded-full h-2'>
                  <div
                    className={`h-2 rounded-full ${
                      event.severity === EventSeverity.MAJOR
                        ? "bg-red-600"
                        : "bg-yellow-600"
                    }`}
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          (daysRemaining / (event.duration * 30)) * 100
                        )
                      )}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {event.impacts && event.impacts.length > 0 && (
            <div className='mb-6'>
              <h3 className='text-lg font-medium mb-2'>Impacts</h3>
              <div className='bg-gray-700 rounded p-3'>
                <ul className='space-y-1'>
                  {event.impacts.map((impact, index) => (
                    <li key={index} className='flex justify-between'>
                      <span className='text-gray-300'>{impact.type}</span>
                      <span
                        className={
                          impact.value >= 0 ? "text-green-400" : "text-red-400"
                        }
                      >
                        {formatImpact(impact.value)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {event.choices &&
            event.choices.length > 0 &&
            !event.selectedChoice && (
              <div className='mb-4'>
                <h3 className='text-lg font-medium mb-2'>Your Options</h3>
                <div className='space-y-3'>
                  {event.choices.map((choice) => (
                    <div key={choice.id} className='bg-gray-700 rounded p-4'>
                      <p className='mb-3'>{choice.description}</p>
                      {choice.impacts && choice.impacts.length > 0 && (
                        <div className='mb-3 text-sm'>
                          <p className='text-gray-400 mb-1'>Effects:</p>
                          <ul className='space-y-1 pl-4'>
                            {choice.impacts.map((impact, idx) => (
                              <li key={idx} className='flex justify-between'>
                                <span>{impact.type}</span>
                                <span
                                  className={
                                    impact.value >= 0
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }
                                >
                                  {formatImpact(impact.value)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <button
                        className={`w-full py-2 rounded ${
                          canAffordChoice(choice)
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-gray-600 cursor-not-allowed text-gray-300"
                        }`}
                        onClick={() =>
                          canAffordChoice(choice) &&
                          onMakeChoice(event.id, choice.id)
                        }
                        disabled={!canAffordChoice(choice)}
                      >
                        {choice.requiredMoney
                          ? `Choose ($${choice.requiredMoney.toLocaleString()})`
                          : "Choose"}
                        {!canAffordChoice(choice) && " - Cannot Afford"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {event.selectedChoice && event.choices && (
            <div className='mb-4 p-4 bg-blue-900/30 rounded'>
              <h3 className='text-lg font-medium mb-2'>Your Decision</h3>
              <p>
                {event.choices.find((c) => c.id === event.selectedChoice)
                  ?.description || "You've made a choice for this event."}
              </p>
            </div>
          )}
        </div>

        <div className='p-4 border-t border-gray-700 bg-gray-800 flex justify-end'>
          <button
            className='px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white'
            onClick={handleClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;

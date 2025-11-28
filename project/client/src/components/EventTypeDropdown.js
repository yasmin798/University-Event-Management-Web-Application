import React, { useState } from "react";

const EventTypeDropdown = ({ selected, onChange }) => {
  const types = ["All", "WORKSHOP", "TRIP", "BAZAAR", "BOOTH", "CONFERENCE"];
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative ml-2 w-48">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-2 px-3 border border-[#c8d9e6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#567c8d] bg-white text-[#2f4156] flex justify-between items-center"
      >
        {selected}
        <svg
          className={`w-4 h-4 ml-2 transform transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <ul className="absolute z-50 w-full bg-white border border-[#c8d9e6] rounded-lg mt-1 shadow-lg max-h-60 overflow-auto">
          {types.map((type) => (
            <li
              key={type}
              onClick={() => {
                onChange(type);
                setIsOpen(false);
              }}
              className={`px-3 py-2 hover:bg-[#f5efeb] cursor-pointer ${
                selected === type ? "bg-[#e2e8f0]" : ""
              }`}
            >
              {type}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EventTypeDropdown;

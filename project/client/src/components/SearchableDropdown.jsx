import React, { useState, useRef, useEffect } from "react";
import { Search, X, ChevronDown } from "lucide-react";

const SearchableDropdown = ({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  label,
  icon: Icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get unique options and sort them
  const uniqueOptions = [...new Set(filteredOptions)].sort();

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border border-[#c8d9e6] rounded-lg bg-white hover:bg-[#f5efeb] transition-colors flex items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {Icon && <Icon size={18} className="text-[#567c8d] flex-shrink-0" />}
          <span
            className={`truncate ${
              value ? "text-[#2f4156]" : "text-[#567c8d]"
            }`}
          >
            {value || placeholder}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && (
            <X
              size={16}
              className="text-[#567c8d] hover:text-red-500"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            size={18}
            className={`text-[#567c8d] transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-[#c8d9e6] rounded-lg shadow-xl max-h-80 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-[#c8d9e6] sticky top-0 bg-white">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#567c8d]"
                size={16}
              />
              <input
                type="text"
                placeholder={`Search ${label?.toLowerCase() || ""}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-[#c8d9e6] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#567c8d] focus:border-transparent"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options list */}
          <div className="overflow-y-auto max-h-64">
            {uniqueOptions.length === 0 ? (
              <div className="p-4 text-center text-sm text-[#567c8d]">
                No results found
              </div>
            ) : (
              uniqueOptions.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full px-4 py-2.5 text-left hover:bg-[#f5efeb] transition-colors border-b border-[#c8d9e6] last:border-b-0 ${
                    value === option
                      ? "bg-[#c8d9e6] font-medium text-[#2f4156]"
                      : "text-[#567c8d]"
                  }`}
                >
                  {option}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;

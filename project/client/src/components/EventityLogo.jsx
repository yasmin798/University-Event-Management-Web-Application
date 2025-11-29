import React from "react";

const EventityLogo = ({ size = 45, showText = true }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "2px",
    }}
  >
    {/* Calendar/Pin Icon */}
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Calendar Outline */}
      <rect
        x="10"
        y="10"
        width="30"
        height="30"
        rx="8"
        stroke="white"
        strokeWidth="3.5"
      />
      {/* Top Rings */}
      <path
        d="M18 6V13"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M32 6V13"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Location Pin */}
      <path
        d="M25 18C22.5 18 20.5 20 20.5 22.5C20.5 26.5 25 32 25 32C25 32 29.5 26.5 29.5 22.5C29.5 20 27.5 18 25 18Z"
        fill="#8caabb"
      />
      <circle cx="25" cy="22.5" r="1.5" fill="white" />
    </svg>

    {/* Text */}
    {showText && (
      <span
        style={{
          color: "white",
          fontSize: "0.65rem",
          fontWeight: "700",
          letterSpacing: "0.8px",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        EVENTITY
      </span>
    )}
  </div>
);

export default EventityLogo;

// client/src/pages/EventPaymentSuccess.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import axios from "axios";

export default function EventPaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  const sessionId = searchParams.get("session_id");
  const eventId = searchParams.get("eventId");
  const eventType = searchParams.get("eventType");

  useEffect(() => {
    if (!sessionId || !eventId || !eventType) {
      // If missing params → redirect immediately
      navigate("/events/registered", { replace: true });
      return;
    }

    // Confirm payment with backend
    const confirmPayment = async () => {
      try {
        await axios.post(
  "http://localhost:3001/api/payments/confirm-event-payment-and-email",
  { sessionId, eventId, eventType },
  {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    },
  }
);
        console.log("Payment confirmed & user marked as paid");
      } catch (err) {
        console.error("Confirmation failed (still redirecting):", err);
        // We STILL redirect even if confirm fails — user already paid!
      }
    };

    confirmPayment();
  }, [sessionId, eventId, eventType, navigate]);

  // COUNTDOWN + REDIRECT
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/events/registered", { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
        <CheckCircle className="w-20 h-20 text-emerald-600 mx-auto mb-6 animate-pulse" />
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Payment Successful!
        </h1>
        <p className="text-lg text-gray-700 mb-6">
          Your registration fee has been paid.
        </p>
        <p className="text-gray-600 mb-8">
          You're officially confirmed for the {eventType === "workshop" ? "workshop" : "trip"}!
        </p>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-emerald-800">
            Transaction ID: <span className="font-mono">{sessionId?.slice(-8) || "N/A"}</span>
          </p>
        </div>

        <p className="text-lg font-medium text-gray-700 mb-6">
          Redirecting in <span className="text-emerald-600 font-bold text-2xl">{countdown}</span> seconds...
        </p>

        <button
          onClick={() => navigate("/events/registered", { replace: true })}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-10 rounded-lg transition shadow-lg text-lg"
        >
          Go to My Registered Events Now
        </button>
      </div>
    </div>
  );
}
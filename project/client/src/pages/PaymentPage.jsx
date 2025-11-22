// client/src/pages/PaymentPage.jsx
import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe("pk_test_51NnZTJHCjCkulRTD1Tt3IphjwGjl7GxuJ0WwHHCjb1Y6UAwEnsQpDHLkIaoV4beeuWXVHIChGIHiTp9Qb2hBNsv500L9Pij7PJ");

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const appId = searchParams.get("appId");
  const type = searchParams.get("type");

  useEffect(() => {
    if (!appId || !type) {
      navigate("/my-applications/accepted");
      return;
    }

    const initiatePayment = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/payments/create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicationId: appId, type }),
        });

        const data = await res.json();
        if (data.url) {
          window.location.href = data.url; // Redirect to Stripe
        } else {
          alert("Failed to start payment");
          navigate(-1);
        }
      } catch (err) {
        alert("Payment error");
        navigate(-1);
      }
    };

    initiatePayment();
  }, [appId, type, navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-10 rounded-lg shadow-lg text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-600 mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold">Redirecting to Stripe...</h2>
        <p>Please wait while we prepare your secure payment.</p>
      </div>
    </div>
  );
}
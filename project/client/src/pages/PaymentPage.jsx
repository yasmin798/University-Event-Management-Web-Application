// client/src/pages/PaymentPage.jsx
import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Existing parameters for normal payments
  const appId = searchParams.get("appId");
  const type = searchParams.get("type");

  // New parameters for wallet top-up
  const isTopup = searchParams.get("topup") === "true";
  const amount = searchParams.get("amount");

  useEffect(() => {
    const initiatePayment = async () => {
      try {
        // -----------------------------------------
        // 1️⃣ WALLET TOP-UP FLOW
        // -----------------------------------------
        if (isTopup) {
          if (!amount) {
            alert("Missing top-up amount.");
            return navigate("/wallet");
          }

          const res = await fetch("http://localhost:3001/api/wallet/topup/create-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ amount }),
          });

          const data = await res.json();
          if (data.url) {
            window.location.href = data.url;
          } else {
            alert("Failed to start wallet top-up.");
            return navigate(-1);
          }
          return;
        }

        // -----------------------------------------
        // 2️⃣ NORMAL BOOTH/BAZAAR PAYMENT FLOW
        // -----------------------------------------
        if (!appId || !type) {
          return navigate("/my-applications/accepted");
        }

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
  }, [appId, type, isTopup, amount, navigate]);

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

import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, Loader2, Wallet } from "lucide-react";

export default function WalletSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState("confirming");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setMessage("No payment session found");
      return;
    }

    const confirmTopup = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Session expired. Please log in again.");
          navigate("/login");
          return;
        }

        const res = await fetch("http://localhost:3001/api/wallet/topup/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setStatus("success");
          setMessage(`+${data.transaction?.amount || "?"} EGP added!`);
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to confirm payment");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Network error");
      }
    };

    confirmTopup();
  }, [sessionId, navigate]);

  // Auto redirect after success
  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        window.location.href = "/wallet"; // Full reload to show new balance
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg w-full text-center">

        {status === "confirming" && (
          <>
            <Loader2 className="w-20 h-20 text-emerald-600 mx-auto mb-8 animate-spin" />
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Processing Payment...</h1>
            <p className="text-gray-600">Please wait while we update your wallet</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-24 h-24 text-emerald-600 mx-auto mb-8" />
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Payment Successful!</h1>
            <p className="text-2xl text-emerald-600 font-bold mb-6">{message}</p>
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 mb-8">
              <Wallet className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
              <p className="text-gray-700">Your wallet has been updated</p>
            </div>
            <p className="text-sm text-gray-500">Redirecting in 5 seconds...</p>
            <button
              onClick={() => window.location.href = "/wallet"}
              className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-10 rounded-xl transition"
            >
              Go to Wallet Now
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-6xl">Failed</span>
            </div>
            <h1 className="text-3xl font-bold text-red-600 mb-4">Payment Failed</h1>
            <p className="text-gray-700 mb-6">{message}</p>
            <button
              onClick={() => navigate("/wallet")}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-10 rounded-xl transition"
            >
              Back to Wallet
            </button>
          </>
        )}
      </div>
    </div>
  );
}
// client/src/pages/PaymentSuccess.jsx
import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/my-applications/accepted", { replace: true });
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
        <CheckCircle className="w-20 h-20 text-emerald-600 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          Thank you! Your booth/bazaar application fee has been paid.
        </p>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-emerald-800">
            Session ID: <span className="font-mono">{sessionId?.slice(-8)}</span>
          </p>
        </div>
        <p className="text-sm text-gray-500">
          Redirecting to your applications in <span className="font-bold">5</span> seconds...
        </p>
        <button
          onClick={() => navigate("/my-applications/accepted")}
          className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-8 rounded-lg transition"
        >
          Go Back Now
        </button>
      </div>
    </div>
  );
}
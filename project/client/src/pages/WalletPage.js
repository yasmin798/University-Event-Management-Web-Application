import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, ArrowDownRight, Wallet, History } from "lucide-react";
import StudentSidebar from "../components/StudentSidebar";

export default function WalletPage() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(
        "http://localhost:3001/api/wallet/balance?limit=50",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setBalance(data.walletBalance || 0);
      setTransactions(data.transactions || []);
    } catch (err) {
      alert("Failed to load wallet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();

    // Auto-refresh when page gets focus (after top-up success)
    const handleFocus = () => fetchWallet();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const handleTopUp = () => {
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num < 5) {
      alert("Minimum top-up is 5 EGP");
      return;
    }
    navigate(`/payment?topup=true&amount=${num}`);
  };

  return (
    <div className="flex min-h-screen">
      <StudentSidebar />
      <div
        className="flex-1 bg-gradient-to-br from-emerald-50 to-teal-50 py-8 px-4"
        style={{ marginLeft: "260px" }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-800 flex items-center justify-center gap-3">
              <Wallet className="w-10 h-10 text-emerald-600" />
              My Wallet
            </h1>
            <p className="text-gray-600 mt-2">
              Top up and pay for events instantly
            </p>
          </div>

          {/* Balance Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 text-center transform hover:scale-105 transition-all duration-300">
            <p className="text-gray-500 text-sm uppercase tracking-wider">
              Current Balance
            </p>
            {loading ? (
              <div className="text-6xl font-bold text-emerald-600 animate-pulse">
                ...
              </div>
            ) : (
              <div className="text-6xl font-bold text-emerald-600">
                {balance.toFixed(2)} <span className="text-3xl">EGP</span>
              </div>
            )}
          </div>

          {/* Top-Up Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Add Money
            </h2>
            <div className="flex gap-4 max-w-md mx-auto">
              <input
                type="number"
                min="5"
                step="0.01"
                placeholder="Enter amount (min 5 EGP)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-lg"
              />
              <button
                onClick={handleTopUp}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-xl transition flex items-center gap-2"
              >
                <ArrowUpRight size={20} />
                Top Up
              </button>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
              <History className="text-emerald-600" />
              Recent Transactions
            </h2>

            {transactions.length === 0 ? (
              <p className="text-center text-gray-500 py-10">
                No transactions yet
              </p>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div
                    key={tx._id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center">
                        {tx.type === "topup" || tx.type === "refund" ? (
                          <div className="bg-emerald-100">
                            <ArrowUpRight className="text-emerald-600" />
                          </div>
                        ) : (
                          <div className="bg-red-100">
                            <ArrowDownRight className="text-red-600" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {tx.type === "topup"
                            ? "Wallet Top-Up"
                            : tx.description || "Event Registration"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(tx.createdAt).toLocaleDateString("en-GB")}
                          {tx.description && " • Event Payment"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xl font-bold ${
                        tx.type === "topup" || tx.type === "refund"
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {tx.type === "topup" || tx.type === "refund" ? "+" : "-"}
                      {tx.amount.toFixed(2)} EGP
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

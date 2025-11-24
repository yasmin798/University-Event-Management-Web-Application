// client/src/pages/WalletCancel.jsx
export default function WalletCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-red-600">Payment Cancelled</h1>
        <button onClick={() => window.location.href = "/wallet"} className="mt-6 bg-blue-600 text-white px-6 py-3 rounded">
          Back to Wallet
        </button>
      </div>
    </div>
  );
}
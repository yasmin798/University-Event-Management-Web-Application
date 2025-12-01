import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { BarChart2 } from "lucide-react";

export default function PollResults() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPolls = async () => {
    try {
      const res = await fetch("/api/polls");
      const data = await res.json();
      setPolls(data);
    } catch (err) {
      console.error("Poll fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-[#f8fafc]">
        <Sidebar />
        <main className="flex-1 ml-[260px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2f4156]"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-10 overflow-y-auto">
        <h1 className="text-3xl font-bold text-[#2f4156] mb-6 flex items-center gap-3">
          <BarChart2 size={28} />
          Poll Results
        </h1>

        <div className="space-y-6">
          {polls.map((poll) => {
            // Calculate total votes safely
            const totalVotes = poll.candidates.reduce(
              (sum, c) => sum + (c.votes || 0),
              0
            );

            return (
              <div
                key={poll._id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm p-6"
              >
                {/* Poll Header */}
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[#2f4156]">
                      {poll.title}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Ends on: {new Date(poll.endDate).toLocaleString()}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      poll.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {poll.isActive ? "Active" : "Closed"}
                  </span>
                </div>

                {/* Candidate Results */}
                <div className="space-y-4">
                  {poll.candidates.map((c) => {
                    const percentage =
                      totalVotes === 0
                        ? 0
                        : Math.round(((c.votes || 0) / totalVotes) * 100);

                    return (
                      <div
                        key={c._id}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {c.vendorName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Slot {c.platformSlot} • {c.durationWeeks} weeks • Booth{" "}
                              {c.boothSize}
                            </p>
                          </div>

                          <div className="text-right">
                            <div className="text-2xl font-bold">{c.votes}</div>
                            <div className="text-xs text-gray-500">votes</div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                          <div
                            className="h-2 bg-[#2f4156] rounded-full transition-all duration-300"
                            style={{
                              width: `${percentage}%`,
                            }}
                          ></div>
                        </div>

                        {/* Percentage Label */}
                        <p className="text-xs text-gray-600 mt-1">
                          {percentage}% of votes
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Total votes */}
                <p className="text-sm text-gray-600 mt-4">
                  Total Votes: <strong>{totalVotes}</strong>
                </p>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

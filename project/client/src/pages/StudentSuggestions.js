// client/src/pages/StudentSuggestions.js
import React, { useState, useEffect } from "react";
import StudentSidebar from "../components/StudentSidebar";
import NotificationsDropdown from "../components/NotificationsDropdown";
import { User } from "lucide-react";

import {
  Lightbulb,
  Calendar,
  MapPin,
  Send,
  Users,
  Store,
  Plane,
  Presentation,
  Mic,
} from "lucide-react";

const API_BASE =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://localhost:3001";

const StudentSuggestions = () => {
  const [eventType, setEventType] = useState("WORKSHOP");
  const [studentId, setStudentId] = useState(""); // 🔹 add this
  const [suggestion, setSuggestion] = useState("");
  const [extraDetails, setExtraDetails] = useState("");
  const [preferredTimeframe, setPreferredTimeframe] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("");

  // Get user info from token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserId(payload.id || payload.userId || payload._id || null);
      setUserName(
        payload.name ||
          payload.fullName ||
          payload.username ||
          payload.email ||
          "Student"
      );
    } catch (e) {
      console.error("Invalid token", e);
    }
  }, []);

  const getPromptLabel = () => {
    switch (eventType) {
      case "BOOTH":
      case "BAZAAR":
        return "Brand you’d like to see on campus";
      case "WORKSHOP":
        return "Workshop topic you’d like to learn about";
      case "TRIP":
        return "Place you’d like to go";
      case "CONFERENCE":
        return "Speaker you’d like to learn from";
      default:
        return "Your suggestion";
    }
  };

  const getPromptPlaceholder = () => {
    switch (eventType) {
      case "BOOTH":
      case "BAZAAR":
        return "e.g., IKEA, Nike, a local food brand…";
      case "WORKSHOP":
        return "e.g., Advanced React, Personal Finance, AI in Healthcare…";
      case "TRIP":
        return "e.g., Luxor, Aswan, Alexandria, a specific resort…";
      case "CONFERENCE":
        return "e.g., a professor, industry expert, or public figure…";
      default:
        return "Write your suggestion here…";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!studentId.trim()) {
    setErrorMessage("Please enter your Student ID.");
    return;
  }

    if (!suggestion.trim()) {
      setErrorMessage("Please enter your suggestion.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/api/suggestions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          eventType,
           studentId: studentId.trim(),
          suggestion: suggestion.trim(),
          extraDetails: extraDetails.trim() || null,
          preferredTimeframe: preferredTimeframe.trim() || null,
          createdBy: userId,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save suggestion");
      }

      setSuggestion("");
      setExtraDetails("");
      setPreferredTimeframe("");
      setSuccessMessage("Thank you! Your suggestion has been submitted 💡");
    } catch (err) {
      console.error(err);
      setErrorMessage(
        "Something went wrong while sending your suggestion. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f5efeb]">
      {/* Fixed sidebar */}
      <StudentSidebar />

      {/* Main content */}
      <div className="flex-1 ml-[260px] flex flex-col bg-[#f5efeb]">
        {/* Header */}
        <header className="bg-white border-b border-[#c8d9e6] px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#2f4156] flex items-center gap-2">
              <Lightbulb className="text-[#567c8d]" />
              Student Suggestions
            </h1>
            <p className="text-sm text-[#567c8d] mt-1">
              Tell the Events Office what you’d love to see next on campus.
            </p>
          </div>

          <div className="flex items-center gap-3">
  <div className="hidden md:flex flex-col items-end">
    <span className="text-xs text-[#567c8d]">Logged in as</span>
    <span className="font-semibold text-[#2f4156]">
      {userName || "Student"}
    </span>
  </div>

  <NotificationsDropdown align="right" />

  <div className="w-10 h-10 bg-[#c8d9e6] rounded-full flex items-center justify-center">
    <User size={20} className="text-[#2f4156]" />
  </div>
</div>

        </header>

        {/* Page content */}
        <main className="flex-1 px-4 md:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Explanation / cards */}
            <div className="space-y-4 lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-[#c8d9e6] p-5">
                <h2 className="text-lg font-semibold text-[#2f4156] mb-3 flex items-center gap-2">
                  <Users size={18} className="text-[#567c8d]" />
                  Why your suggestions matter
                </h2>
                <p className="text-sm text-[#567c8d] leading-relaxed">
                  The Events Office reviews these suggestions when planning{" "}
                  <span className="font-semibold">upcoming booths, bazaars, trips, workshops, and conferences</span>.
                  Share what excites you so we can bring it to campus.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-200 flex items-center justify-center mb-2">
                    <Store size={18} className="text-blue-800" />
                  </div>
                  <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide mb-1">
                    Booths & Bazaars
                  </p>
                  <p className="text-sm text-blue-900">
                    Suggest your favorite brands and vendors.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-4">
                  <div className="w-9 h-9 rounded-xl bg-purple-200 flex items-center justify-center mb-2">
                    <Presentation size={18} className="text-purple-800" />
                  </div>
                  <p className="text-xs text-purple-700 font-semibold uppercase tracking-wide mb-1">
                    Workshops
                  </p>
                  <p className="text-sm text-purple-900">
                    Topics that would boost your skills.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-4">
                  <div className="w-9 h-9 rounded-xl bg-green-200 flex items-center justify-center mb-2">
                    <Plane size={18} className="text-green-800" />
                  </div>
                  <p className="text-xs text-green-700 font-semibold uppercase tracking-wide mb-1">
                    Trips
                  </p>
                  <p className="text-sm text-green-900">
                    Places you’d love to visit together.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-4">
                  <div className="w-9 h-9 rounded-xl bg-orange-200 flex items-center justify-center mb-2">
                    <Mic size={18} className="text-orange-800" />
                  </div>
                  <p className="text-xs text-orange-700 font-semibold uppercase tracking-wide mb-1">
                    Conferences
                  </p>
                  <p className="text-sm text-orange-900">
                    Speakers & experts you want to learn from.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-[#c8d9e6] p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-bold text-[#2f4156] mb-6 flex items-center gap-2">
                  <Calendar size={20} className="text-[#567c8d]" />
                  Share a new suggestion
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
    <label className="block text-sm font-semibold text-[#2f4156] mb-2">
      Student ID
    </label>
    <input
      type="text"
      value={studentId}
      onChange={(e) => setStudentId(e.target.value)}
      placeholder="e.g., 20-XXXXX, your university ID"
      className="w-full px-4 py-2.5 rounded-xl border border-[#c8d9e6] text-sm 
                 focus:outline-none focus:ring-2 focus:ring-[#567c8d] focus:border-transparent 
                 bg-[#fdfdfd]"
    />
  </div>
                  {/* Event type */}
                  <div>
                    <label className="block text-sm font-semibold text-[#2f4156] mb-2">
                      Event Type
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {[
                        { value: "WORKSHOP", label: "Workshop" },
                        { value: "TRIP", label: "Trip" },
                        { value: "BAZAAR", label: "Bazaar" },
                        { value: "BOOTH", label: "Booth" },
                        { value: "CONFERENCE", label: "Conference" },
                      ].map((opt) => (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() => setEventType(opt.value)}
                          className={
                            "px-3 py-2 rounded-lg border text-sm font-medium transition-all " +
                            (eventType === opt.value
                              ? "bg-[#567c8d] border-[#567c8d] text-white shadow-sm"
                              : "bg-white border-[#c8d9e6] text-[#2f4156] hover:bg-[#f5efeb]")
                          }
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Main suggestion */}
                  <div>
                    <label className="block text-sm font-semibold text-[#2f4156] mb-2">
                      {getPromptLabel()}
                    </label>
                    <textarea
                      value={suggestion}
                      onChange={(e) => setSuggestion(e.target.value)}
                      placeholder={getPromptPlaceholder()}
                      className="w-full px-4 py-3 rounded-xl border border-[#c8d9e6] text-sm focus:outline-none focus:ring-2 focus:ring-[#567c8d] focus:border-transparent resize-none bg-[#fdfdfd]"
                      rows={4}
                    />
                  </div>

                  {/* Extra details */}
                  <div>
                    <label className="block text-sm font-semibold text-[#2f4156] mb-2">
                      Extra details (optional)
                    </label>
                    <textarea
                      value={extraDetails}
                      onChange={(e) => setExtraDetails(e.target.value)}
                      placeholder="Why do you want this? Any specific brand branch, date range, budget level, or speaker background?"
                      className="w-full px-4 py-3 rounded-xl border border-[#c8d9e6] text-sm focus:outline-none focus:ring-2 focus:ring-[#567c8d] focus:border-transparent resize-none bg-[#fdfdfd]"
                      rows={3}
                    />
                  </div>

                  {/* Preferred timeframe */}
                  <div>
                    <label className="block text-sm font-semibold text-[#2f4156] mb-2">
                      Preferred timeframe (optional)
                    </label>
                    <input
                      type="text"
                      value={preferredTimeframe}
                      onChange={(e) => setPreferredTimeframe(e.target.value)}
                      placeholder="e.g., Next semester, Winter break, Before finals week…"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#c8d9e6] text-sm focus:outline-none focus:ring-2 focus:ring-[#567c8d] focus:border-transparent bg-[#fdfdfd]"
                    />
                  </div>

                  {/* Messages */}
                  {errorMessage && (
                    <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                      {errorMessage}
                    </div>
                  )}
                  {successMessage && (
                    <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">
                      {successMessage}
                    </div>
                  )}

                  {/* Submit */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#567c8d] to-[#45687a] text-white text-sm font-semibold shadow-md hover:shadow-lg hover:from-[#45687a] hover:to-[#567c8d] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    >
                      <Send size={18} />
                      {isSubmitting ? "Sending..." : "Submit Suggestion"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentSuggestions;

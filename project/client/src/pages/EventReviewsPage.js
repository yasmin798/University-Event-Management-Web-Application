// client/src/pages/EventReviewsPage.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Star, ArrowLeft, Trash2 } from "lucide-react"; // Add Trash2 import

export default function EventReviewsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.state?.from === "admin"; // Detect admin mode
  const [event, setEvent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(""); // For success/error toasts

  // Fetch data (event + reviews)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get event title/name
        const eventRes = await fetch(`/api/events/${id}`);
        if (eventRes.ok) {
          const data = await eventRes.json();
          setEvent(data);
        }

        // Get all reviews
        await fetchReviews();
      } catch (err) {
        console.error("Error loading reviews:", err);
        setMessage("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Separate function to refetch reviews (for post-delete refresh)
  const fetchReviews = async () => {
    try {
      const reviewsRes = await fetch(`/api/events/${id}/reviews`);
      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        setReviews(data || []);
        setMessage(""); // Clear any old messages
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setMessage("Failed to fetch reviews.");
    }
  };

  // Delete review (admin only)
  const deleteReview = async (userId) => {
    if (!window.confirm("Delete this review? An email warning will be sent to the user.")) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/events/${id}/reviews/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []); // Update with backend response
        setMessage("Review deleted and warning email sent.");
      } else {
        const err = await res.json();
        setMessage(`Error: ${err.error || "Failed to delete"}`);
      }
    } catch (err) {
      console.error("Delete error:", err);
      setMessage("Failed to delete review.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate average rating
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      : "0.0";

  // Go back to the appropriate events page
  const goToEventsHome = () => {
    const fromAdmin = location.state?.from === "admin";
    if (fromAdmin) {
      navigate("/admin/events");
    } else {
      navigate("/events");
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: "80px",
          textAlign: "center",
          fontSize: "22px",
          color: "#567c8d",
        }}
      >
        Loading reviews...
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* MESSAGE TOAST (for delete feedback) */}
      {message && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: message.includes("Error") ? "#ef4444" : "#10b981",
            color: "white",
            padding: "12px 20px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
            maxWidth: "300px",
          }}
        >
          {message}
        </div>
      )}

      {/* HEADER + BACK TO EVENTS HOME */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <button
          onClick={goToEventsHome}
          style={{
            background: "#f0f7fa",
            border: "none",
            borderRadius: "50%",
            width: "52px",
            height: "52px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#e0f0f5")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#f0f7fa")}
          title="Back to Events"
        >
          <ArrowLeft size={30} color="#567c8d" />
        </button>

        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "34px",
              fontWeight: "900",
              color: "#1e293b",
              lineHeight: "1.2",
            }}
          >
            {event?.title || event?.name || "Event"} Reviews
          </h1>
          <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: "18px" }}>
            {reviews.length} review{reviews.length !== 1 ? "s" : ""}
            {isAdmin && <span style={{ color: "#ef4444", fontSize: "16px" }}> • Admin Mode</span>}
          </p>
        </div>
      </div>

      {/* AVERAGE RATING */}
      {reviews.length > 0 && (
        <div
          style={{
            background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
            padding: "40px",
            borderRadius: "24px",
            textAlign: "center",
            marginBottom: "48px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            border: "1px solid #bae6fd",
          }}
        >
          <div
            style={{ fontSize: "80px", fontWeight: "900", color: "#0ea5e9" }}
          >
            {avgRating}
            <span style={{ fontSize: "60px", marginLeft: "12px" }}>★</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              margin: "24px 0",
            }}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={52}
                fill={star <= Math.round(avgRating) ? "#fbbf24" : "#e2e8f0"}
                color={star <= Math.round(avgRating) ? "#f59e0b" : "#94a3b8"}
                style={{ transition: "all 0.3s" }}
              />
            ))}
          </div>
          <p style={{ fontSize: "20px", color: "#475569", margin: 0 }}>
            Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* ALL REVIEWS */}
      <div style={{ display: "grid", gap: "28px" }}>
        {reviews.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
              background: "#f8fafc",
              borderRadius: "20px",
              border: "2px dashed #cbd5e1",
              color: "#64748b",
              fontSize: "20px",
            }}
          >
            No reviews yet.
            <br />
            <span style={{ fontSize: "18px", color: "#94a3b8" }}>
              {isAdmin ? "Manage reviews as they come in." : "Be the first to share your experience!"}
            </span>
          </div>
        ) : (
          reviews.map((review, index) => (
            <div
              key={index}
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "28px",
                boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
                border: "1px solid #e2e8f0",
                transition: "transform 0.2s, box-shadow 0.2s",
                position: "relative", // For admin delete button positioning
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow =
                  "0 20px 40px rgba(0,0,0,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.08)";
              }}
            >
              {/* ADMIN DELETE BUTTON */}
              {isAdmin && (
                <button
                  onClick={() => deleteReview(review.userId)}
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    background: "#ef4444",
                    border: "none",
                    borderRadius: "50%",
                    width: "36px",
                    height: "36px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    boxShadow: "0 2px 8px rgba(239,68,68,0.3)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#dc2626";
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#ef4444";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  title="Delete Review (Email Warning Sent)"
                  disabled={loading}
                >
                  <Trash2 size={18} />
                </button>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: "700",
                      fontSize: "20px",
                      color: "#1e293b",
                    }}
                  >
                    {review.userName || "Anonymous"}
                  </div>
                  <div
                    style={{
                      color: "#64748b",
                      fontSize: "15px",
                      marginTop: "6px",
                    }}
                  >
                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={26}
                      fill={n <= review.rating ? "#fbbf24" : "none"}
                      color={n <= review.rating ? "#f59e0b" : "#cbd5e1"}
                    />
                  ))}
                </div>
              </div>

              {review.comment ? (
                <p
                  style={{
                    margin: "20px 0 0",
                    fontSize: "17px",
                    lineHeight: "1.7",
                    color: "#334155",
                  }}
                >
                  "{review.comment}"
                </p>
              ) : (
                <p
                  style={{
                    margin: "20px 0 0",
                    color: "#94a3b8",
                    fontStyle: "italic",
                  }}
                >
                  No written comment
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
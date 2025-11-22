// src/components/EventReviews.jsx
import React, { useState, useEffect } from "react";
import { Star, MessageCircle } from "lucide-react";

const EventReviews = ({ eventId, userId, hasAttended }) => {
  const [reviews, setReviews] = useState([]);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch reviews
  useEffect(() => {
    fetch(`/api/events/${eventId}/reviews`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(data || []);
        setLoading(false);

        // Auto-fill if user already reviewed
        if (userId) {
          const myReview = data.find((r) => r.userId === userId);
          if (myReview) {
            setMyRating(myReview.rating || 0);
            setMyComment(myReview.comment || "");
          }
        }
      })
      .catch(() => setLoading(false));
  }, [eventId, userId]);

  const submitReview = async () => {
    if (!hasAttended) {
      alert("You can only review events you attended!");
      return;
    }
    if (myRating === 0) {
      alert("Please give a star rating");
      return;
    }

    const token = localStorage.getItem("token");
    await fetch(`/api/events/${eventId}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        rating: myRating,
        comment: myComment.trim(),
      }),
    });

    // Refresh reviews
    const res = await fetch(`/api/events/${eventId}/reviews`);
    const updated = await res.json();
    setReviews(updated);
  };

  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-xl font-bold text-[#2f4156] mb-4">
        Ratings & Reviews {reviews.length > 0 && `(${reviews.length})`}
      </h3>

      {/* Average Rating */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl font-bold text-[#567c8d]">{avgRating}</span>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={24}
                className={n <= avgRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">out of 5</span>
        </div>
      )}

      {/* Your Review (Only if attended) */}
      {hasAttended && (
        <div className="bg-[#f5efeb] p-4 rounded-xl mb-6">
          <p className="font-medium text-[#2f4156] mb-2">Your Review</p>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setMyRating(n)}>
                <Star
                  size={28}
                  className={
                    n <= myRating
                      ? "fill-yellow-500 text-yellow-500 hover:scale-110"
                      : "text-gray-400 hover:text-yellow-500"
                  }
                />
              </button>
            ))}
          </div>
          <textarea
            placeholder="Share your experience..."
            value={myComment}
            onChange={(e) => setMyComment(e.target.value)}
            className="w-full p-3 border border-[#c8d9e6] rounded-lg resize-none"
            rows={3}
          />
          <button
            onClick={submitReview}
            className="mt-3 px-5 py-2 bg-[#567c8d] hover:bg-[#45687a] text-white rounded-lg text-sm font-medium"
          >
            Submit Review
          </button>
        </div>
      )}

      {/* All Reviews */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-gray-500">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-gray-500 italic">No reviews yet. Be the first!</p>
        ) : (
          reviews.map((r, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-[#c8d9e6]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-[#567c8d] rounded-full flex items-center justify-center text-white font-bold">
                    {r.userName?.[0] || "A"}
                  </div>
                  <div>
                    <p className="font-medium text-[#2f4156]">{r.userName || "Anonymous"}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={18}
                      className={n <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                    />
                  ))}
                </div>
              </div>
              {r.comment && <p className="text-[#567c8d] mt-2">{r.comment}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EventReviews;
import React, { useEffect, useState } from 'react';

const API = '';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifs = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json();
      setItems(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const markRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to mark as read');
      await fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && items.length === 0 && <p>No notifications.</p>}

      <ul className="space-y-3">
        {items.map(n => (
          <li key={n._id} className={`p-4 rounded border ${n.unread ? 'bg-white' : 'bg-gray-50'}`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{n.message}</div>
                <div className="text-sm text-gray-600">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
              <div>
                {n.unread && (
                  <button onClick={() => markRead(n._id)} className="px-3 py-1 bg-blue-600 text-white rounded">Mark read</button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

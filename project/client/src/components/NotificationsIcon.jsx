import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotificationsIcon() {
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let mounted = true;
    const fetchCount = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setUnread(0);
          return;
        }
        const res = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        const count = (data || []).filter(n => n.unread).length;
        setUnread(count);
      } catch (err) {
        // fail silently
      }
    };

    fetchCount();

    // refresh every 30s
    const iv = setInterval(fetchCount, 30000);

    // react to storage changes (other tabs) and token changes in this tab
    const onStorage = (e) => { if (e.key === 'token') fetchCount(); };
    window.addEventListener('storage', onStorage);

    // lightweight polling to detect login in same tab (compare token)
    let tokenRef = localStorage.getItem('token');
    const poll = setInterval(() => {
      const t = localStorage.getItem('token');
      if (t !== tokenRef) { tokenRef = t; fetchCount(); }
    }, 1000);

    return () => { mounted = false; clearInterval(iv); clearInterval(poll); window.removeEventListener('storage', onStorage); };
  }, []);

  return (
    <button
      title="Notifications"
      onClick={() => navigate('/notifications')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'transparent',
        border: 'none',
        color: 'white',
        cursor: 'pointer'
      }}
    >
      <div style={{ position: 'relative' }}>
        <Bell size={18} />
        {unread > 0 && (
          <span style={{
            position: 'absolute',
            right: -6,
            top: -6,
            background: '#ef4444',
            color: 'white',
            borderRadius: 999,
            padding: '2px 6px',
            fontSize: 12,
            fontWeight: 700,
          }}>{unread}</span>
        )}
      </div>
    </button>
  );
}

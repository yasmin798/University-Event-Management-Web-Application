import React, { useEffect, useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotificationsIcon() {
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const tokenRef = useRef(localStorage.getItem('token'));

  useEffect(() => {
    let mounted = true;
    const fetchCount = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          if (mounted) setUnread(0);
          return;
        }
        const res = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (mounted) setUnread(0);
          return;
        }
        const data = await res.json();
        if (!mounted) return;
        const count = (data || []).filter(n => n.unread).length;
        setUnread(count);
      } catch (err) {
        if (mounted) setUnread(0);
      }
    };

    fetchCount();

    // refresh every 30s
    const iv = setInterval(fetchCount, 30000);

    // react to storage changes (other tabs)
    const onStorage = (e) => { if (e.key === 'token') fetchCount(); };
    window.addEventListener('storage', onStorage);
    // react to explicit notifications changes dispatched by other components
    const onNotifsChanged = () => fetchCount();
    window.addEventListener('notifications:changed', onNotifsChanged);

    // lightweight polling to detect login in same tab (compare token)
    const poll = setInterval(() => {
      const t = localStorage.getItem('token');
      if (t !== tokenRef.current) {
        tokenRef.current = t;
        fetchCount();
      }
    }, 1000);

    return () => { mounted = false; clearInterval(iv); clearInterval(poll); window.removeEventListener('storage', onStorage); window.removeEventListener('notifications:changed', onNotifsChanged); };
  }, []);

  // keep the same visual style as the dropdown bell: white rounded button with teal badge
  const badge = unread > 0 ? (unread > 99 ? '99+' : String(unread)) : null;

  return (
    <button
      title="Notifications"
      onClick={() => navigate('/notifications')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        background: 'white',
        color: '#567c8d',
        border: 'none',
        padding: 8,
        borderRadius: 999,
        cursor: 'pointer',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
      }}
    >
      <span style={{ position: 'relative', display: 'inline-block' }} aria-hidden="false">
        <Bell size={18} aria-hidden="true" />
        {badge && (
          <span aria-label={`${badge} unread notifications`} style={{
            position: 'absolute',
            top: -6,
            right: -6,
            minWidth: 18,
            height: 18,
            padding: '0 5px',
            background: 'var(--teal, #567c8d)',
            color: 'white',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            lineHeight: '14px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
          }}>{badge}</span>
        )}
      </span>
    </button>
  );
}

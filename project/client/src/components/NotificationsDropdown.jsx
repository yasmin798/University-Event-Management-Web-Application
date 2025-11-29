import React, { useEffect, useState, useRef } from 'react';
import { Bell } from 'lucide-react';

export default function NotificationsDropdown({ align = 'center' }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);
  const tokenRef = useRef(localStorage.getItem('token'));

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  useEffect(() => {
    if (!open) return;
    const fetchNotifs = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) { setItems([]); return; }
        const res = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setItems([]); return; }
        const data = await res.json();
        // only keep unread notifications in the dropdown so "Clear" hides them
        const unread = (data || []).filter((n) => n.unread);
        setItems(unread);
        // also keep count in sync
        setUnreadCount((data || []).filter((n) => n.unread).length || 0);
      } catch (err) {
        console.error(err);
        setItems([]);
      } finally { setLoading(false); }
    };
    fetchNotifs();
  }, [open]);

  // fetch unread count (used for badge) on mount and when token changes
  useEffect(() => {
    let mounted = true;
    const fetchCount = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { if (mounted) setUnreadCount(0); return; }
        const res = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) { if (mounted) setUnreadCount(0); return; }
        const data = await res.json();
        if (mounted) setUnreadCount((data || []).filter((n) => n.unread).length || 0);
      } catch (err) {
        if (mounted) setUnreadCount(0);
      }
    };

    fetchCount();

    // listen for storage events (other tabs) and poll token changes in this tab
    const onStorage = (e) => { if (e.key === 'token') fetchCount(); };
    window.addEventListener('storage', onStorage);

    const iv = setInterval(() => {
      const t = localStorage.getItem('token');
      if (t !== tokenRef.current) {
        tokenRef.current = t;
        fetchCount();
      }
    }, 1000);

    return () => { mounted = false; window.removeEventListener('storage', onStorage); clearInterval(iv); };
  }, []);

  const markRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        // remove the item from the local list and decrement the badge
        setItems((s) => s.filter(n => n._id !== id));
        setUnreadCount((c) => Math.max(0, (c || 0) - 1));
        // notify other components (bell icon, other tabs) to refresh counts
        try { window.dispatchEvent(new Event('notifications:changed')); } catch (e) { /* ignore */ }
      }
    } catch (err) { console.error(err); }
  };

  const clearAll = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const unread = items.filter((n) => n.unread).map((n) => n._id);
      if (unread.length === 0) {
        setItems([]);
        return;
      }

      // mark all unread as read on server
      await Promise.all(
        unread.map((id) =>
          fetch(`/api/notifications/${id}/read`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );

      // clear local view
      setItems([]);
      // notify other components
      try { window.dispatchEvent(new Event('notifications:changed')); } catch (e) { /* ignore */ }
    } catch (err) {
      console.error('Failed to clear notifications', err);
    }
  };

  // unreadCount state shows number on the badge; fall back to items length
  const badgeCount = unreadCount || items.filter(n => n.unread).length || 0;

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        aria-haspopup="true"
        aria-expanded={open}
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
          {badgeCount > 0 && (
              <span aria-label={`${badgeCount} unread notifications`} style={{
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
              }}>{badgeCount > 99 ? '99+' : badgeCount}</span>
            )}
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          ...(align === 'right'
            ? { right: 0 }
            : align === 'left'
            ? { left: 0 }
            : { left: '50%', transform: 'translateX(-50%)' }),
          marginTop: 8,
          width: 360,
          maxHeight: 360,
          overflow: 'auto',
          background: 'white',
          color: '#111827',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 60,
        }}>
          <div style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Notifications</strong>
            <button onClick={(e) => { e.stopPropagation(); clearAll(); }} disabled={items.length === 0} style={{ background: 'transparent', border: 'none', color: items.length === 0 ? '#c0c0c0' : '#6b7280', cursor: items.length === 0 ? 'default' : 'pointer' }}>Clear</button>
          </div>
          <div style={{ padding: 8 }}>
            {loading && <div>Loading...</div>}
            {!loading && items.length === 0 && <div className="text-sm text-gray-600">No notifications.</div>}
            {!loading && items.map(n => (
              <div key={n._id} style={{ padding: 8, borderRadius: 6, background: '#f8fafc', display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13 }}>{n.message}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                  <button onClick={(e) => { e.stopPropagation(); markRead(n._id); setItems((s) => s.filter(x => x._id !== n._id)); }} style={{ background: 'var(--teal, #567c8d)', color: 'white', border: 'none', padding: '6px 8px', borderRadius: 6 }}>Mark</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

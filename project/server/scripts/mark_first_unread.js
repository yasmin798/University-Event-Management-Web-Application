(async () => {
  try {
    const token = process.env.TOKEN;
    if (!token) {
      console.error('Please set TOKEN env var with the JWT');
      process.exit(2);
    }

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const res = await fetch('http://localhost:3000/api/notifications', { headers });
    if (!res.ok) {
      console.error('Failed to fetch notifications:', res.status, await res.text());
      process.exit(1);
    }
    const data = await res.json();
    console.log('Total notifications fetched:', (data || []).length);
    const unread = (data || []).filter(n => n.unread);
    console.log('Unread before:', unread.length);
    if (unread.length === 0) {
      console.log('No unread notifications to mark.');
      process.exit(0);
    }
    const id = unread[0]._id;
    console.log('Marking as read id:', id);
    const p = await fetch(`http://localhost:3000/api/notifications/${id}/read`, { method: 'PATCH', headers });
    console.log('PATCH status:', p.status);

    const afterRes = await fetch('http://localhost:3000/api/notifications', { headers });
    const after = await afterRes.json();
    console.log('Unread after:', (after || []).filter(n => n.unread).length);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

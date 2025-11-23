import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const WorkshopEditsPage = () => {
  const { id } = useParams(); // Matches :id in route
  const navigate = useNavigate();
  const [edits, setEdits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workshopName, setWorkshopName] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkshopEdits = async () => {
      console.log('=== DEBUG: fetchWorkshopEdits START ===');
      console.log('Step 1: id from params:', id);

      if (!id) {
        console.error('Step 2: No id - cannot fetch');
        setError('Invalid workshop ID');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        console.log('Step 3: Token exists:', !!token);

        // Step 4: Fetch ALL notifications (like in list page)
        console.log('Step 4: Fetching /api/notifications');
        const notifsRes = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        console.log('Step 5: Notifications status:', notifsRes.status);
        console.log('Step 6: Notifications ok?', notifsRes.ok);

        if (!notifsRes.ok) {
          const errorText = await notifsRes.text();
          console.error('Step 7: Notifications failed - body:', errorText);
          throw new Error(`Notifications fetch failed: ${notifsRes.status} - ${errorText}`);
        }

        const notifications = await notifsRes.json();
        console.log('Step 8: All notifications fetched:', notifications.length, 'total');

        // Step 9: Filter for edit_request type AND this workshopId (only this workshop's edits)
        // Safe extraction: Handle ObjectId, string, or populated object in filter
        const editNotifs = notifications.filter(n => {
          if (n.type !== 'edit_request' || !n.workshopId) return false;
          
          let nWsId = null;
          if (typeof n.workshopId === 'object' && n.workshopId._id) {
            // Populated object: e.g., { _id: ObjectId('...'), name: '...' }
            nWsId = n.workshopId._id.toString();
          } else {
            // Direct ObjectId or string
            nWsId = n.workshopId.toString();
          }
          
          return nWsId === id.toString(); // Match against current page's ID
        });
        console.log('Step 9: Filtered edit notifs for ID', id, ':', editNotifs.length, 'items');

        const thisWorkshopEdits = editNotifs.map(n => n.message || 'Edit requested');
        console.log('Step 10: Extracted edits array:', thisWorkshopEdits);
        setEdits(thisWorkshopEdits);

        // Step 11: Fetch workshop name separately (for title)
        const wsRes = await fetch(`/api/workshops/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (wsRes.ok) {
          const wsData = await wsRes.json();
          console.log('Step 11: Workshop name:', wsData.workshopName || wsData.title);
          setWorkshopName(wsData.workshopName || wsData.title || 'Workshop');
        } else {
          console.warn('Step 12: Workshop name fetch failed, using default');
          setWorkshopName('Workshop');
        }

        console.log('=== DEBUG: fetchWorkshopEdits SUCCESS - Edits set to:', thisWorkshopEdits.length, 'items ===');
      } catch (error) {
        console.error('=== DEBUG: fetchWorkshopEdits ERROR ===');
        console.error('Error details:', error.message);
        console.error('Full error object:', error);
        setError('Failed to load edit requests: ' + error.message);
      } finally {
        setLoading(false);
        console.log('=== DEBUG: fetchWorkshopEdits END - Loading set to false ===');
      }
    };

    fetchWorkshopEdits();
  }, [id]);

  console.log('=== DEBUG: Render Cycle - Loading:', loading, 'Edits:', edits, 'Error:', error, 'Length:', edits.length);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5efeb] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#567c8d] mx-auto mb-4"></div>
          <p className="text-[#567c8d]">Loading edit requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5efeb]">
        <div className="bg-white border-b border-[#c8d9e6] px-8 py-4">
          <button
            onClick={() => navigate('/professor/workshops')}
            className="flex items-center gap-2 text-[#567c8d] hover:text-[#2f4156]"
          >
            <ArrowLeft size={20} />
            Back to Workshops
          </button>
        </div>
        <div className="max-w-4xl mx-auto p-8 text-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
          <button
            onClick={() => navigate('/professor/workshops')}
            className="mt-4 px-4 py-2 bg-[#567c8d] text-white rounded-lg hover:bg-[#2f4156]"
          >
            Back to Workshops
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5efeb]">
      <div className="bg-white border-b border-[#c8d9e6] px-8 py-4">
        <button
          onClick={() => navigate('/professor/workshops')}
          className="flex items-center gap-2 text-[#567c8d] hover:text-[#2f4156]"
        >
          <ArrowLeft size={20} />
          Back to Workshops
        </button>
      </div>
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-2xl font-bold text-[#2f4156] mb-6">
          Edit Requests for {workshopName} ({edits.length} total)
        </h1>
        {edits.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-[#c8d9e6]">
            <p className="text-[#567c8d]">No edit requests for this workshop yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {edits.map((editMsg, index) => (
              <div key={index} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm text-[#2f4156]">{editMsg}</p>
              </div>
            ))}
          </div>
        )}
        {edits.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate(`/professor/workshops/edit/${id}`)}
              className="px-6 py-2 bg-[#567c8d] text-white rounded-lg hover:bg-[#2f4156] transition-colors"
            >
              Edit Workshop to Address Feedback
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkshopEditsPage;
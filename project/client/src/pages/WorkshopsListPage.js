import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo for dynamic locations
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Calendar, MapPin, Users, Clock, UserCheck, CheckCircle } from 'lucide-react'; // Added CheckCircle for attendance btn
import { workshopAPI } from '../api/workshopApi';
import ProfessorSidebar from '../components/ProfessorSidebar';

const WorkshopsListPage = () => {
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true); // Added: For fetch spinner
  const [editRequests, setEditRequests] = useState({}); // New: Map of workshopId to edit messages
  const [filter, setFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [facultyFilter, setFacultyFilter] = useState('all');

  const user = JSON.parse(localStorage.getItem("user"));
  const currentProfessorId = user?.id;

  // New: Fetch edit requests for current prof
  const fetchEditRequests = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch('/api/notifications', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const notifications = await res.json();
      const editNotifs = notifications.filter(n => n.type === 'edit_request' && n.workshopId);
      
      const requestsMap = {};
      editNotifs.forEach(n => {
        let wsId = null;
        
        // Safe extraction: Handle ObjectId, string, or populated object
        if (n.workshopId) {
          if (typeof n.workshopId === 'object' && n.workshopId._id) {
            // Populated object: e.g., { _id: ObjectId('...'), name: '...' }
            wsId = n.workshopId._id.toString();
          } else {
            // Direct ObjectId or string
            wsId = n.workshopId.toString();
          }
        }
        
        if (wsId && !requestsMap[wsId]) {
          requestsMap[wsId] = [];
        }
        if (wsId) {
          requestsMap[wsId].push(n.message || 'Edit requested');
        }
      });
      
      console.log('Fetched edit requests:', requestsMap); // Now: { "64f...abc": ["Edit1", "Edit2", ...] }
      setEditRequests(requestsMap);
    } else {
      console.error('Failed to fetch notifications:', res.status);
    }
  } catch (error) {
    console.error('Error fetching edit requests:', error);
  }
};

  useEffect(() => {
    const fetchWorkshops = async () => {
      setLoading(true); // Added: Set loading
      try {
        let data = [];
        if (filter === 'mine') {
          data = await workshopAPI.getMyWorkshops();
        } else if (filter === 'others') {
          data = await workshopAPI.getOtherWorkshops();
        } else {
          data = await workshopAPI.getAllWorkshops();
        }
        setWorkshops(data);
      } catch (error) {
        console.error('Error fetching workshops:', error);
      } finally {
        setLoading(false); // Added: Clear loading
      }
    };
    fetchWorkshops();
    fetchEditRequests(); // New: Fetch edits on load
  }, [filter]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this workshop?')) {
      try {
        await workshopAPI.deleteWorkshop(id);
        setWorkshops(workshops.filter((w) => w._id !== id));
      } catch (error) {
        console.error('Error deleting workshop:', error);
        alert('Failed to delete workshop');
      }
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Dynamic locations (from workshops data, not static)
  const uniqueLocations = useMemo(() => {
    const locations = [...new Set(workshops.map(w => w.location))];
    return ['all', ...locations].sort();
  }, [workshops]);

  const faculties = [
    { value: 'all', label: 'All Faculties' },
    { value: 'MET', label: 'MET - Media Engineering and Technology' },
    { value: 'IET', label: 'IET - Information Engineering and Technology' },
    { value: 'PBT', label: 'PBT - Pharmacy and Biotechnology' },
    { value: 'EMS', label: 'EMS - Engineering and Materials Science' },
    { value: 'MNGT', label: 'MNGT - Management Technology' },
    { value: 'ASA', label: 'ASA - Applied Sciences and Arts' },
    { value: 'DNT', label: 'DNT - Dentistry' },
    { value: 'LAW', label: 'LAW - Law and Legal Studies' },
  ];

  const filteredWorkshops = workshops.filter((w) => {
    const locationMatch = locationFilter === 'all' ? true : w.location === locationFilter;
    const facultyMatch = facultyFilter === 'all' ? true : w.facultyResponsible === facultyFilter;
    return locationMatch && facultyMatch;
  });

  return (
    <div className="flex h-screen bg-[#f5efeb]">
      <ProfessorSidebar />
      
      <div className="flex-1 overflow-auto ml-64">
        <div className="bg-white border-b border-[#c8d9e6] px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/professor/dashboard')}
              className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-[#567c8d]" />
            </button>
            <h1 className="text-2xl font-bold text-[#2f4156]">Workshops</h1>
          </div>
          <button
            onClick={() => navigate('/professor/workshops/create')}
            className="flex items-center gap-2 px-4 py-2 bg-[#567c8d] text-white rounded-lg hover:bg-[#2f4156] transition-colors"
          >
            <Plus size={18} />
            New Workshop
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-[#567c8d] text-white'
                : 'bg-white text-[#567c8d] border border-[#c8d9e6]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('mine')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'mine'
                ? 'bg-[#567c8d] text-white'
                : 'bg-white text-[#567c8d] border border-[#c8d9e6]'
            }`}
          >
            My Workshops
          </button>
          <button
            onClick={() => setFilter('others')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'others'
                ? 'bg-[#567c8d] text-white'
                : 'bg-white text-[#567c8d] border border-[#c8d9e6]'
            }`}
          >
            Other Professors
          </button>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-4 py-2 border border-[#c8d9e6] rounded-lg text-[#2f4156] bg-white"
          >
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc === 'all' ? 'All Locations' : loc}
              </option>
            ))}
          </select>

          <select
            value={facultyFilter}
            onChange={(e) => setFacultyFilter(e.target.value)}
            className="px-4 py-2 border border-[#c8d9e6] rounded-lg text-[#2f4156] bg-white"
          >
            {faculties.map((fac) => (
              <option key={fac.value} value={fac.value}>
                {fac.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#567c8d]"></div>
          </div>
        ) : filteredWorkshops.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-[#c8d9e6]">
            <div className="w-16 h-16 bg-[#c8d9e6] rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={32} className="text-[#567c8d]" />
            </div>
            <h3 className="text-lg font-semibold text-[#2f4156] mb-2">No workshops found</h3>
            <p className="text-[#567c8d] mb-4">
              Try adjusting your filters or create a new workshop
            </p>
            <button
              onClick={() => navigate('/professor/workshops/create')}
              className="px-6 py-3 bg-[#567c8d] text-white rounded-lg hover:bg-[#2f4156] transition-colors"
            >
              Create Workshop
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredWorkshops.map((workshop) => {
              const registeredCount = workshop.registeredUsers?.length || 0; // Added: For spots calc
              const attendedCount = workshop.attendedUsers?.length || 0; // NEW: Attended count
              const remainingSpots = (workshop.capacity || 0) - registeredCount;
              const isMyWorkshop = workshop.createdBy === currentProfessorId; // Renamed for clarity
              const wsId = workshop._id.toString();
              const hasEdits = editRequests[wsId] && editRequests[wsId].length > 0; // New: Check for edits

              // NEW: Date computations for attendance eligibility
              const currentDate = new Date();
              const startDate = new Date(workshop.startDateTime);
              const endDate = new Date(workshop.endDateTime);
              const isPast = currentDate > endDate;
              const isOngoing = currentDate >= startDate && currentDate < endDate;

              return (
                <div
                  key={workshop._id}
                  className="bg-white rounded-xl p-6 border border-[#c8d9e6] hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-[#2f4156]">
                        {workshop.workshopName}
                      </h3>
                      <p className="text-[#567c8d] mb-4">{workshop.shortDescription}</p>
                    </div>
                    {/* ADDED: Participants button for published workshops (any prof can view) */}
                    <div className="flex gap-2">
                      {workshop.status === "published" && (
                        <button
                          onClick={() => navigate(`/professor/workshops/participants/${workshop._id}`)}
                          className="p-2 bg-[#567c8d] hover:bg-[#45687a] text-white rounded-lg transition-colors"
                          title={`View ${registeredCount} registered students`}
                        >
                          <UserCheck size={18} />
                        </button>
                      )}
                      {/* NEW: Attendance/Certificate button - only for my past/ongoing published workshops */}
                      {isMyWorkshop && workshop.status === "published" && (isPast || isOngoing) && (
                        <button
                          onClick={() => navigate(`/professor/workshops/attendance/${workshop._id}`)}
                          className={`p-2 rounded-lg transition-colors text-xs flex items-center gap-1 ${
                            isPast && attendedCount === 0 ? 'bg-yellow-500 hover:bg-yellow-600 text-white' :
                            isPast && attendedCount > 0 ? 'bg-green-500 hover:bg-green-600 text-white' :
                            isOngoing ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                          }`}
                          title={
                            isPast && attendedCount === 0 ? "Mark attendance & send certificates" :
                            isPast && attendedCount > 0 ? `View ${attendedCount} certificates sent` :
                            isOngoing ? "Edit attendance list" : "Not available yet"
                          }
                        >
                          <CheckCircle size={16} />
                          {isPast && attendedCount > 0 && <span className="text-xs">{attendedCount}</span>}
                        </button>
                      )}
                      {/* UPDATED: Edits button for EVERY workshop tab/card (my workshops only; always visible, with conditional styling) */}
                      {isMyWorkshop && (
                        <button
                          onClick={() => navigate(`/professor/workshops/edits/${workshop._id}`)}
                          className={`p-2 rounded-lg transition-colors text-xs ${
                            hasEdits
                              ? 'bg-blue-500 hover:bg-blue-600 text-white'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                          }`}
                          title={hasEdits ? "View edit requests" : "No edits pending"}
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      {/* Edit/Delete only for my workshops */}
                      {isMyWorkshop && (
                        <>
                          <button
                            onClick={() => navigate(`/professor/workshops/edit/${workshop._id}`)}
                            className="p-2 hover:bg-[#c8d9e6] rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} className="text-[#567c8d]" />
                          </button>
                          <button
                            onClick={() => handleDelete(workshop._id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} className="text-red-500" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-[#567c8d]">
                      <MapPin size={16} />
                      <span>{workshop.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#567c8d]">
                      <Calendar size={16} />
                      <span>{formatDate(workshop.startDateTime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#567c8d]">
                      <Clock size={16} />
                      <span>{formatTime(workshop.startDateTime)} - {formatTime(workshop.endDateTime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium"> {/* Updated: Dynamic spots with attended */}
                      <Users size={16} className={remainingSpots <= 5 ? "text-red-500" : "text-[#567c8d]"} />
                      <span className={remainingSpots <= 5 ? "text-red-600" : "text-[#567c8d]"}>
                        {registeredCount}/{workshop.capacity} registered 
                        {attendedCount > 0 && ` | ${attendedCount} attended`}
                        ({remainingSpots} left)
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t border-[#c8d9e6]">
                    <span className="px-3 py-1 bg-[#c8d9e6] text-[#2f4156] rounded-full text-xs">
                      {workshop.facultyResponsible}
                    </span>
                    <span className="px-3 py-1 bg-[#c8d9e6] text-[#2f4156] rounded-full text-xs">
                      Budget: {workshop.requiredBudget} EGP
                    </span>
                    <span className="px-3 py-1 bg-[#c8d9e6] text-[#2f4156] rounded-full text-xs">
                      {workshop.fundingSource}
                    </span>
                    {/* Added: Status badge */}
                    {workshop.status && (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        workshop.status === "published" ? "bg-green-100 text-green-700" :
                        workshop.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {workshop.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default WorkshopsListPage;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Calendar, MapPin, Users, Clock } from 'lucide-react';
import { workshopAPI } from '../api/workshopApi';

const WorkshopsListPage = () => {
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState([]);
  const [filter, setFilter] = useState('all');

  const currentProfessor = "Professor A"; // 🔹 Replace this with actual logged-in professor name later

  useEffect(() => {
    loadWorkshops();
  }, []);

  const loadWorkshops = () => {
    const stored = localStorage.getItem('workshops');
    if (stored) {
      setWorkshops(JSON.parse(stored));
    }
  };

useEffect(() => {
  const fetchWorkshops = async () => {
    try {
      const data = await workshopAPI.getAllWorkshops();
      setWorkshops(data);
    } catch (error) {
      console.error('Error fetching workshops:', error);
    }
  };
  
  fetchWorkshops();
}, []);




  const handleDelete = async (id) => {
  if (window.confirm('Are you sure you want to delete this workshop?')) {
    try {
      await workshopAPI.deleteWorkshop(id);
      // Refresh the list
      const updated = workshops.filter(w => w._id !== id);
      setWorkshops(updated);
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

  // 🔹 Filtering logic
  const filteredWorkshops =
    filter === 'all'
      ? workshops
      : filter === 'mine'
      ? workshops.filter((w) => w.createdBy === currentProfessor)
      : workshops.filter((w) => w.createdBy !== currentProfessor);

  return (
    <div className="min-h-screen bg-[#f5efeb]">
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
        {/* 🔹 New filter buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-[#567c8d] text-white'
                : 'bg-white text-[#567c8d] border border-[#c8d9e6]'
            }`}
          >
            All ({workshops.length})
          </button>

          <button
            onClick={() => setFilter('mine')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'mine'
                ? 'bg-[#567c8d] text-white'
                : 'bg-white text-[#567c8d] border border-[#c8d9e6]'
            }`}
          >
            My Workshops ({workshops.filter((w) => w.createdBy === currentProfessor).length})
          </button>

          <button
            onClick={() => setFilter('others')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'others'
                ? 'bg-[#567c8d] text-white'
                : 'bg-white text-[#567c8d] border border-[#c8d9e6]'
            }`}
          >
            Other Professors ({workshops.filter((w) => w.createdBy !== currentProfessor).length})
          </button>
        </div>

        {filteredWorkshops.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-[#c8d9e6]">
            <div className="w-16 h-16 bg-[#c8d9e6] rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={32} className="text-[#567c8d]" />
            </div>
            <h3 className="text-lg font-semibold text-[#2f4156] mb-2">No workshops found</h3>
            <p className="text-[#567c8d] mb-4">Create your first workshop to get started</p>
            <button
              onClick={() => navigate('/professor/workshops/create')}
              className="px-6 py-3 bg-[#567c8d] text-white rounded-lg hover:bg-[#2f4156] transition-colors"
            >
              Create Workshop
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredWorkshops.map((workshop) => (
  <div
    key={workshop._id} // Changed from workshop.id
    className="bg-white rounded-xl p-6 border border-[#c8d9e6] hover:shadow-lg transition-shadow"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <h3 className="text-xl font-bold text-[#2f4156]">{workshop.workshopName}</h3>
        <p className="text-[#567c8d] mb-4">{workshop.shortDescription}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/professor/workshops/edit/${workshop._id}`)} // Changed from workshop.id
          className="p-2 hover:bg-[#c8d9e6] rounded-lg transition-colors"
          title="Edit"
        >
          <Edit size={18} className="text-[#567c8d]" />
        </button>
        <button
          onClick={() => handleDelete(workshop._id)} // Changed from workshop.id
          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
          title="Delete"
        >
          <Trash2 size={18} className="text-red-500" />
        </button>
      </div>
    </div>
    
    
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-[#567c8d]">
                    <MapPin size={16} />
                    <span>{workshop.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#567c8d]">
                    <Calendar size={16} />
                    <span>{formatDate(workshop.startDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#567c8d]">
                    <Clock size={16} />
                    <span>{workshop.startTime} - {workshop.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#567c8d]">
                    <Users size={16} />
                    <span>{workshop.capacity} participants</span>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkshopsListPage;

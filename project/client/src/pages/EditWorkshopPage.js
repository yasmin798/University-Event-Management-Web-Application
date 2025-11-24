import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import { workshopAPI } from '../api/workshopApi';


const EditWorkshopPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({
    workshopName: '',
    location: '',
    startDateTime: '',
    endDateTime: '',
    shortDescription: '',
    fullAgenda: '',
    facultyResponsible: '',
    professorsParticipating: '',
    requiredBudget: '',
    fundingSource: '',
    extraResources: '',
    capacity: '',
    registrationDeadline: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkshop = async () => {
      if (id) {
        try {
          console.log('🔍 Fetching workshop with ID:', id);
          const workshop = await workshopAPI.getWorkshopById(id);
          console.log('✅ Workshop data received:', workshop);
          
          // Format datetime fields for datetime-local input (YYYY-MM-DDTHH:mm)
          const formattedWorkshop = {
            workshopName: workshop.workshopName || '',
            location: workshop.location || '',
            startDateTime: workshop.startDateTime 
              ? new Date(workshop.startDateTime).toISOString().slice(0, 16) 
              : '',
            endDateTime: workshop.endDateTime 
              ? new Date(workshop.endDateTime).toISOString().slice(0, 16) 
              : '',
            shortDescription: workshop.shortDescription || '',
            fullAgenda: workshop.fullAgenda || '',
            facultyResponsible: workshop.facultyResponsible || '',
            professorsParticipating: workshop.professorsParticipating || '',
            requiredBudget: workshop.requiredBudget || '',
            fundingSource: workshop.fundingSource || '',
            extraResources: workshop.extraResources || '',
            capacity: workshop.capacity || '',
            registrationDeadline: workshop.registrationDeadline 
              ? new Date(workshop.registrationDeadline).toISOString().split('T')[0] 
              : '',
          };
          
          console.log('📝 Formatted data for form:', formattedWorkshop);
          setFormData(formattedWorkshop);
          setLoading(false);
        } catch (error) {
          console.error('❌ Error fetching workshop:', error);
          alert('Failed to load workshop');
          navigate('/professor/workshops');
        }
      }
    };
    
    fetchWorkshop();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.workshopName.trim()) newErrors.workshopName = 'Workshop name is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.startDateTime) newErrors.startDateTime = 'Start date and time is required';
    if (!formData.endDateTime) newErrors.endDateTime = 'End date and time is required';
    if (!formData.shortDescription.trim()) newErrors.shortDescription = 'Short description is required';
    if (!formData.fullAgenda.trim()) newErrors.fullAgenda = 'Full agenda is required';
    if (!formData.facultyResponsible) newErrors.facultyResponsible = 'Faculty is required';
    if (!formData.professorsParticipating.trim()) newErrors.professorsParticipating = 'Professors are required';
    if (!formData.requiredBudget) newErrors.requiredBudget = 'Budget is required';
    if (!formData.fundingSource) newErrors.fundingSource = 'Funding source is required';
    if (!formData.capacity) newErrors.capacity = 'Capacity is required';
    if (!formData.registrationDeadline) newErrors.registrationDeadline = 'Registration deadline is required';

    if (formData.startDateTime && formData.endDateTime) {
      const start = new Date(formData.startDateTime);
      const end = new Date(formData.endDateTime);
      if (end <= start) {
        newErrors.endDateTime = 'End date/time must be after start date/time';
      }
    }

    if (formData.registrationDeadline && formData.startDateTime) {
      const deadline = new Date(formData.registrationDeadline);
      const start = new Date(formData.startDateTime);
      if (deadline >= start) {
        newErrors.registrationDeadline = 'Registration deadline must be before start date/time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        console.log('📤 Updating workshop with data:', formData);
        const updatedWorkshop = await workshopAPI.updateWorkshop(id, formData);
        
        console.log('✅ Workshop updated:', updatedWorkshop);
        alert('Workshop updated successfully!');
        navigate('/professor/workshops');
      } catch (error) {
        console.error('❌ Error updating workshop:', error);
        alert('Failed to update workshop. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5efeb] flex items-center justify-center">
        <div className="text-[#567c8d] text-xl">Loading workshop...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5efeb]">
      <div className="bg-white border-b border-[#c8d9e6] px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/professor/workshops')}
              className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-[#567c8d]" />
            </button>
            <h1 className="text-2xl font-bold text-[#2f4156]">Edit Workshop</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-xl p-8 border border-[#c8d9e6]">
          <div className="mb-6">
            <label className="block text-[#2f4156] font-semibold mb-2">
              Workshop Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="workshopName"
              value={formData.workshopName}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#567c8d] ${
                errors.workshopName ? 'border-red-500' : 'border-[#c8d9e6]'
              }`}
              placeholder="Enter workshop name"
            />
            {errors.workshopName && <p className="text-red-500 text-sm mt-1">{errors.workshopName}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-[#2f4156] font-semibold mb-2">
              Location <span className="text-red-500">*</span>
            </label>
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#567c8d] ${
                errors.location ? 'border-red-500' : 'border-[#c8d9e6]'
              }`}
            >
              <option value="">Select location</option>
              <option value="GUC Cairo">GUC Cairo</option>
              <option value="GUC Berlin">GUC Berlin</option>
            </select>
            {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-[#2f4156] font-semibold mb-2">
                Start Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="startDateTime"
                value={formData.startDateTime}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#567c8d] ${
                  errors.startDateTime ? 'border-red-500' : 'border-[#c8d9e6]'
                }`}
              />
              {errors.startDateTime && <p className="text-red-500 text-sm mt-1">{errors.startDateTime}</p>}
            </div>
            <div>
              <label className="block text-[#2f4156] font-semibold mb-2">
                End Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="endDateTime"
                value={formData.endDateTime}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#567c8d] ${
                  errors.endDateTime ? 'border-red-500' : 'border-[#c8d9e6]'
                }`}
              />
              {errors.endDateTime && <p className="text-red-500 text-sm mt-1">{errors.endDateTime}</p>}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-[#2f4156] font-semibold mb-2">
              Short Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              rows="3"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#567c8d] ${
                errors.shortDescription ? 'border-red-500' : 'border-[#c8d9e6]'
              }`}
              placeholder="Brief overview of the workshop"
            />
            {errors.shortDescription && <p className="text-red-500 text-sm mt-1">{errors.shortDescription}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-[#2f4156] font-semibold mb-2">
              Full Agenda <span className="text-red-500">*</span>
            </label>
            <textarea
              name="fullAgenda"
              value={formData.fullAgenda}
              onChange={handleChange}
              rows="6"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#567c8d] ${
                errors.fullAgenda ? 'border-red-500' : 'border-[#c8d9e6]'
              }`}
              placeholder="Detailed agenda with schedule and topics"
            />
            {errors.fullAgenda && <p className="text-red-500 text-sm mt-1">{errors.fullAgenda}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-[#2f4156] font-semibold mb-2">
              Faculty Responsible <span className="text-red-500">*</span>
            </label>
            <select
              name="facultyResponsible"
              value={formData.facultyResponsible}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#567c8d] ${
                errors.facultyResponsible ? 'border-red-500' : 'border-[#c8d9e6]'
              }`}
            >
              <option value="">Select faculty</option>
              <option value="MET">MET - Media Engineering and Technology</option>
              <option value="IET">IET - Information Engineering and Technology</option>
              <option value="PBT">PBT - Pharmacy and Biotechnology</option>
              <option value="EMS">EMS - Engineering and Materials Science</option>
              <option value="MNGT">MNGT - Management Technology</option>
              <option value="ASA">ASA - Applied Sciences and Arts</option>
              <option value="DNT">DNT - Dentistry</option>
              <option value="LAW">LAW - Law and Legal Studies</option>
            </select>
            {errors.facultyResponsible && <p className="text-red-500 text-sm mt-1">{errors.facultyResponsible}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-[#2f4156] font-semibold mb-2">
              Professor(s) Participating <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="professorsParticipating"
              value={formData.professorsParticipating}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#567c8d] ${
                errors.professorsParticipating ? 'border-red-500' : 'border-[#c8d9e6]'
              }`}
              placeholder="Enter professor names (comma-separated)"
            />
            {errors.professorsParticipating && <p className="text-red-500 text-sm mt-1">{errors.professorsParticipating}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-[#2f4156] font-semibold mb-2">
              Required Budget (EGP) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="requiredBudget"
              value={formData.requiredBudget}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#567c8d] ${
                errors.requiredBudget ? 'border-red-500' : 'border-[#c8d9e6]'
              }`}
              placeholder="Enter budget amount"
              min="0"
            />
            {errors.requiredBudget && <p className="text-red-500 text-sm mt-1">{errors.requiredBudget}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-[#2f4156] font-semibold mb-2">
              Funding Source <span className="text-red-500">*</span>
            </label>
            <select
              name="fundingSource"
              value={formData.fundingSource}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#567c8d] ${
                errors.fundingSource ? 'border-red-500' : 'border-[#c8d9e6]'
              }`}
            >
              <option value="">Select funding source</option>
              <option value="GUC">GUC</option>
              <option value="External">External</option>
            </select>
            {errors.fundingSource && <p className="text-red-500 text-sm mt-1">{errors.fundingSource}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-[#2f4156] font-semibold mb-2">
              Extra Required Resources
            </label>
            <textarea
              name="extraResources"
              value={formData.extraResources}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-[#c8d9e6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#567c8d]"
              placeholder="List any additional resources needed (optional)"
            />
          </div>

          <div className="mb-6">
            <label className="block text-[#2f4156] font-semibold mb-2">
              Capacity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#567c8d] ${
                errors.capacity ? 'border-red-500' : 'border-[#c8d9e6]'
              }`}
              placeholder="Maximum number of participants"
              min="1"
            />
            {errors.capacity && <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-[#2f4156] font-semibold mb-2">
              Registration Deadline <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="registrationDeadline"
              value={formData.registrationDeadline}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#567c8d] ${
                errors.registrationDeadline ? 'border-red-500' : 'border-[#c8d9e6]'
              }`}
            />
            {errors.registrationDeadline && <p className="text-red-500 text-sm mt-1">{errors.registrationDeadline}</p>}
          </div>

          <div className="flex gap-4 justify-end pt-4 border-t border-[#c8d9e6]">'
            <button
              type="button"
              onClick={() => navigate('/professor/workshops')}
              className="flex items-center gap-2 px-6 py-3 border border-[#c8d9e6] text-[#567c8d] rounded-lg hover:bg-[#f5efeb] transition-colors"
            >
              <X size={18} />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-3 bg-[#567c8d] text-white rounded-lg hover:bg-[#2f4156] transition-colors"
            >
              <Save size={18} />
              Update Workshop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditWorkshopPage;
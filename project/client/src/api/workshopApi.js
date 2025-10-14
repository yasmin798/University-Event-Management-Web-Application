import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Workshop API calls
export const workshopAPI = {
  // Create a new workshop
  createWorkshop: async (workshopData) => {
    const response = await api.post('/workshops', workshopData);
    return response.data;
  },

  // Get all workshops
  getAllWorkshops: async () => {
    const response = await api.get('/workshops');
    return response.data;
  },

  // Get a single workshop by ID
  getWorkshopById: async (id) => {
    const response = await api.get(`/workshops/${id}`);
    return response.data;
  },

  // Update a workshop
  updateWorkshop: async (id, workshopData) => {
    const response = await api.put(`/workshops/${id}`, workshopData);
    return response.data;
  },

  // Delete a workshop
  deleteWorkshop: async (id) => {
    const response = await api.delete(`/workshops/${id}`);
    return response.data;
  },

  // Get workshops by professor
  getMyWorkshops: async (professorId) => {
    const response = await api.get(`/workshops/mine/${professorId}`);
    return response.data;
  },
};

export default api;
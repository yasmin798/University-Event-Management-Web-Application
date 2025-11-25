import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
// Get workshops created by the logged-in professor
getMine: async () => {
  const response = await api.get('/workshops/mine');
  return response.data;
},

// Get workshops NOT created by the logged-in professor
getOthers: async () => {
  const response = await api.get('/workshops/others');
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

  // Get workshops created by the current professor
  getMyWorkshops: async () => {
     const token = localStorage.getItem('token');
    const res = await fetch('/api/workshops/mine', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch workshops');
    return res.json();
  },

  // Get workshops NOT created by this professor
  getOtherWorkshops: async () => {
     const token = localStorage.getItem('token');
    const res = await fetch('/api/workshops/others', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch workshops');
    return res.json();
  },
};

export default api;

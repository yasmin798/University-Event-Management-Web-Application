import api from './api';

export const boothAPI = {
  getAllBooths: async () => {
    const response = await api.get('/booth-applications');
    // Only return accepted booths
    return response.data.filter(b => b.status === 'accepted');
  },
  getBoothsByBazaar: async (bazaarId) => {
    const response = await api.get(`/booth-applications/bazaar/${bazaarId}`);
    return response.data.filter(b => b.status === 'accepted');
  },
};

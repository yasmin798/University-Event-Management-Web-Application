import api from './api';

export const notificationAPI = {
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.post('/notifications/mark-read');
    return response.data;
  },

  createNotification: async (notificationData) => {
    const response = await api.post('/notifications', notificationData);
    return response.data;
  },
};

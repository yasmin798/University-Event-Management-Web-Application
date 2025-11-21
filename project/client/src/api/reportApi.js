import api from "./api";

// params: { eventType, eventName, startDate, endDate }
const getAttendeesReport = async (params = {}) => {
  const token = localStorage.getItem("token");
  const res = await api.get("/reports/attendees", {
    params,
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const reportAPI = { getAttendeesReport };

export default api;

const getSalesReport = async (params = {}) => {
  const token = localStorage.getItem("token");
  const res = await api.get("/reports/sales", {
    params,
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const salesAPI = { getSalesReport };

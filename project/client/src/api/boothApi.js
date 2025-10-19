// boothApi.js
import axios from "axios";

export const boothAPI = {
  getAllBooths: async () => {
    const res = await axios.get("/api/booth-applications");
    return res.data;
  },
  getBoothById: async (id) => {
    const res = await axios.get(`/api/booth-applications/${id}`);
    return res.data;
  },
};

import axios from "axios";

// Make sure the URL matches your backend port
const API_URL = "http://localhost:3000/api/auth"; 

export const loginUser = async (email, password) => {
  const res = await axios.post(`${API_URL}/login`, { email, password });
  return res.data;
};

export const signupUser = async (userData) => {
  const res = await axios.post(`${API_URL}/signup`, userData);
  return res.data;
};

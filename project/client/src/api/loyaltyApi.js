import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "/api";

export const getLoyaltyVendors = async (status = "accepted") => {
  const params = status ? { params: { status } } : undefined;
  const { data } = await axios.get(`${API_BASE}/loyalty/approved`, params);
  return data;
};

export default { getLoyaltyVendors };

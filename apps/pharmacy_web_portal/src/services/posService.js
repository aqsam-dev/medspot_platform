import axios from "axios";

const API = "http://localhost:5000/api/pos";

const posService = {
  getStatus: async (pharmacyId) => {
    const res = await axios.get(`${API}/status/${pharmacyId}`);
    return res.data;
  },

  syncInventory: async (pharmacyId) => {
    const res = await axios.post(`${API}/sync`, {
      pharmacy_id: pharmacyId,
    });

    return res.data;
  },

  testConnection: async (pharmacyId) => {
    const res = await axios.post(`${API}/test`, {
      pharmacy_id: pharmacyId,
    });

    return res.data;
  },

  getHistory: async (pharmacyId) => {
    const res = await axios.get(`${API}/history/${pharmacyId}`);
    return res.data;
  },

  saveConnection: async (data) => {
    const res = await fetch(`${API}/connection`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return res.json();
  },
};

export default posService;
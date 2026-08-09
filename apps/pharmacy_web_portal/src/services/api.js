const API_BASE_URL = 'http://localhost:5000/api';

const apiCall = async (
  endpoint,
  method = "GET",
  data = null
) => {
  const url =
    `${API_BASE_URL}${endpoint}`;

  const token =
    localStorage.getItem("token");

  const config = {
    method,
    headers: {},
  };

  // Send token for protected backend routes
  if (token) {
    config.headers.Authorization =
      `Bearer ${token}`;
  }

  // Do not manually set Content-Type for FormData
  if (!(data instanceof FormData)) {
    config.headers["Content-Type"] =
      "application/json";
  }

  if (
    data &&
    method !== "GET"
  ) {
    config.body =
      data instanceof FormData
        ? data
        : JSON.stringify(data);
  }

  const response =
    await fetch(url, config);

  let result = {};

  try {
    result = await response.json();
  } catch {
    result = {};
  }

  if (!response.ok) {
    throw new Error(
      result.message ||
      `Request failed: ${response.status}`
    );
  }

  return result;
};

// -------------------------
// PHARMACY API
// -------------------------
export const pharmacyAPI = {
  register: (formData) => apiCall('/pharmacy/register', 'POST', formData), // supports FormData
  login: (data) => apiCall('/pharmacy/login', 'POST', data),
};

// -------------------------
// ADMIN API
// -------------------------
export const adminAPI = {
  getPendingPharmacies: () => apiCall('/admin/pending-pharmacies'),
  updateStatus: (data) => apiCall('/admin/update-status', 'POST', data),
};

// -------------------------
// AUTH API
// -------------------------
export const authAPI = {
  forgotPassword: (data) => apiCall('/pharmacy/forgot-password', 'POST', data),
  verifyOtp: (data) => apiCall('/pharmacy/verify-otp', 'POST', data),
  resetPassword: (data) => apiCall('/pharmacy/reset-password', 'POST', data),
};

// -------------------------
// GENERIC FILE UPLOAD API
// -------------------------
export const uploadFile = async (endpoint, file) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  return response.json();
};

// -------------------------
// PRESCRIPTION API
// -------------------------
export const prescriptionAPI = {
  // Get all prescriptions (for queue)
  getAll: () => apiCall('/pharmacy/prescriptions'),

  // Get single prescription
  getById: (id) => apiCall(`/pharmacy/prescriptions/${id}`),
};


// -------------------------
// RESPONSE API (PHARMACY SIDE)
// -------------------------
export const responseAPI = {
  send: (data) => apiCall('/pharmacy/prescriptions', 'POST', data),

  // Get responses for a prescription (patient side later)
  getByPrescription: (id) => apiCall(`/pharmacy/responses/${id}`),
};


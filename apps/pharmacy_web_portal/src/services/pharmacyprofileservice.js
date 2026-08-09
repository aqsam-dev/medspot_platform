const API_URL = "http://localhost:5000/api/pharmacy-profile";

async function handleResponse(response) {
  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message || "Request failed"
    );
  }

  return data;
}

const pharmacyProfileService = {
  getProfile: async (pharmacyId) => {
    const response = await fetch(
      `${API_URL}/profile/${pharmacyId}`
    );

    const data = await handleResponse(response);

    return data.pharmacy;
  },

  updateBasicInfo: async (
    pharmacyId,
    formData
  ) => {
    const response = await fetch(
      `${API_URL}/basic-info/${pharmacyId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }
    );

    return handleResponse(response);
  },

  updateAddress: async (
    pharmacyId,
    formData
  ) => {
    const response = await fetch(
      `${API_URL}/address/${pharmacyId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }
    );

    return handleResponse(response);
  },

  updateOperatingHours: async (
    pharmacyId,
    operatingHours
  ) => {
    const response = await fetch(
      `${API_URL}/operating-hours/${pharmacyId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operating_hours: operatingHours,
        }),
      }
    );

    return handleResponse(response);
  },

  updatePharmacistInfo: async (
    pharmacyId,
    formData
  ) => {
    const response = await fetch(
      `${API_URL}/pharmacist/${pharmacyId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }
    );

    return handleResponse(response);
  },

  changeUsername: async ({
    pharmacyId,
    currentPassword,
    newUsername,
  }) => {
    const response = await fetch(
      `${API_URL}/change-username`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pharmacy_id: pharmacyId,
          currentPassword,
          newUsername,
        }),
      }
    );

    return handleResponse(response);
  },

  changePassword: async ({
    pharmacyId,
    currentPassword,
    newPassword,
  }) => {
    const response = await fetch(
      `${API_URL}/change-password`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pharmacy_id: pharmacyId,
          currentPassword,
          newPassword,
        }),
      }
    );

    return handleResponse(response);
  },
};

export default pharmacyProfileService;
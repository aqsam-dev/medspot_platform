import axios from 'axios';

class RegistrationService {
  constructor() {

    this.pharmacyData = this.getStoredPharmacyData();
    this.pharmacistData = this.getStoredPharmacistData();
    this.isInternalNavigation = false; // Tracks internal navigation state
    this.cloudinaryConfig = {
      cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dmh8lgoype',
      uploadPreset: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'pharmacy_uploads',
      apiUrl: `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dmh8lgoyp'}/upload`
    };
  }


async checkEmailAvailability(email) {
  try {
    const BACKEND_URL = "http://localhost:5000/api/pharmacy"; 
    const response = await axios.get(`${BACKEND_URL}/check-email`, {
      params: { email: email.toLowerCase() }
    });
    return response.data.available;
  } catch (error) {
    console.error("Availability check failed:", error);
    return true; 
  }
}

async checkCNICAvailability(cnic) {
  try {
    const BACKEND_URL = "http://localhost:5000/api/pharmacy";
    const response = await axios.get(`${BACKEND_URL}/check-cnic`, {
      params: { cnic }
    });
    return response.data.available;
  } catch (error) {
    console.error("CNIC availability check failed:", error);
    return true;
  }
}

async checkUsernameAvailability(username) {
  try {
    const response = await axios.get("http://localhost:5000/api/pharmacy/check-username", {
      params: { username: username.toLowerCase() }
    });
    return response.data.available;
  } catch (error) {
    console.error("Username availability check failed:", error);
    return true; 
  }
}


  setInternalNav(value) {
    this.isInternalNavigation = value;
  }

  getInternalNav() {
    return this.isInternalNavigation;
  }

  getStoredPharmacyData() {
    return JSON.parse(localStorage.getItem('pharmacyData')) || {};
  }

  getData() {
    return this.pharmacyData;
  }

  updateData(newData = {}) {
    this.pharmacyData = { ...this.pharmacyData, ...newData };
    const storageSafe = { ...this.pharmacyData };
    if (storageSafe.license instanceof File) delete storageSafe.license;
    if (storageSafe.licenseUrl) storageSafe.license = storageSafe.licenseUrl; // Store URL if uploaded
    localStorage.setItem('pharmacyData', JSON.stringify(storageSafe));
  }

  setPharmacyFile(file) {
    this.pharmacyData = { ...this.pharmacyData, license: file };
  }

  clearPharmacyData() {
    this.pharmacyData = {};
    localStorage.removeItem('pharmacyData');
  }

  getStoredPharmacistData() {
    return JSON.parse(localStorage.getItem('pharmacistData')) || {};
  }

  getPharmacistData() {
    return this.pharmacistData;
  }

  updatePharmacistData(newData = {}) {
    this.pharmacistData = { ...this.pharmacistData, ...newData };
    const storageSafe = { ...this.pharmacistData };
    if (storageSafe.license instanceof File) delete storageSafe.license;
    if (storageSafe.licenseUrl) storageSafe.license = storageSafe.licenseUrl; // Store URL if uploaded
    localStorage.setItem('pharmacistData', JSON.stringify(storageSafe));
  }

  setPharmacistFile(file) {
    this.pharmacistData = { ...this.pharmacistData, license: file };
  }

  clearPharmacistData() {
    this.pharmacistData = {};
    localStorage.removeItem('pharmacistData');
  }

  async uploadFileToCloudinary(file, folder = 'pharmacy_registration') {
    try {
      if (!file || !(file instanceof File)) {
        throw new Error('Invalid file');
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error(`File size exceeds 5MB limit: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only JPG, PNG, or PDF files are allowed');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.cloudinaryConfig.uploadPreset);
      formData.append('folder', folder);
      formData.append('resource_type', 'auto');

      const response = await axios.post(this.cloudinaryConfig.apiUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      });
      //       console.log("========== CLOUDINARY RESPONSE ==========");
      // console.log(response.data);
      // console.log("Resource Type:", response.data.resource_type);
      // console.log("Secure URL:", response.data.secure_url);
      // console.log("Type:", response.data.type);
      // console.log("=========================================");


      return {
        success: true,
        url: response.data.secure_url,
        publicId: response.data.public_id,
        format: response.data.format,
        bytes: response.data.bytes,
        originalFilename: file.name
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }


  async uploadLicensesToCloudinary() {
    const results = {
      pharmacyLicense: null,
      pharmacistLicense: null
    };

    // Upload pharmacy license
    if (this.pharmacyData.license instanceof File) {
      console.log('Uploading pharmacy license to Cloudinary...');
      const pharmacyResult = await this.uploadFileToCloudinary(
        this.pharmacyData.license, 
        'pharmacy_licenses'
      );
      
      if (pharmacyResult.success) {
        this.pharmacyData.licenseUrl = pharmacyResult.url;
        results.pharmacyLicense = pharmacyResult;
        console.log('Pharmacy license uploaded:', pharmacyResult.url);
      } else {
        throw new Error(`Pharmacy license upload failed: ${pharmacyResult.error}`);
      }
    }

    // Upload pharmacist license
    if (this.pharmacistData.license instanceof File) {
      console.log('Uploading pharmacist license to Cloudinary...');
      const pharmacistResult = await this.uploadFileToCloudinary(
        this.pharmacistData.license, 
        'pharmacist_licenses'
      );
      
      if (pharmacistResult.success) {
        this.pharmacistData.licenseUrl = pharmacistResult.url;
        results.pharmacistLicense = pharmacistResult;
        console.log('Pharmacist license uploaded:', pharmacistResult.url);
      } else {
        throw new Error(`Pharmacist license upload failed: ${pharmacistResult.error}`);
      }
    }

    return results;
  }


  getAllData() {
    return {
      pharmacy: this.getData(),
      pharmacist: this.getPharmacistData()
    };
  }


  async formatForBackend() {
    try {
      const uploadResults = await this.uploadLicensesToCloudinary();
      const formData = new FormData();
          const pharmacy = {
      ...this.getStoredPharmacyData(),
      ...this.getData(),
    };

      formData.append("owner_name", pharmacy.ownerName || "");
      formData.append("owner_email", pharmacy.ownerEmail || "");
      formData.append("owner_phone", pharmacy.ownerPhone || "");
      formData.append("owner_cnic", pharmacy.ownerCNIC || "");
      formData.append("pharmacy_name", pharmacy.pharmacyName || "");
      if (pharmacy.licenseUrl) {
        formData.append("license_url", pharmacy.licenseUrl);
        console.log('Using Cloudinary URL for pharmacy license:', pharmacy.licenseUrl);
      } else if (pharmacy.license instanceof File) {
        formData.append("license_url", pharmacy.license, pharmacy.license.name);
        console.log('Using direct file upload for pharmacy license');
      } else {
        formData.append("license_url", "");
      } 
      formData.append("years_in_operation", pharmacy.yearsOperation || 0);
      formData.append("province", pharmacy.province || "");
      formData.append("city", pharmacy.city || "");
      formData.append("area", pharmacy.area || "");
      formData.append("shop_no", pharmacy.shopNo || "");
      formData.append("street_no", pharmacy.streetNo || "");
      formData.append("block_no", pharmacy.blockNo || "");
      formData.append("map_lat", pharmacy.location?.lat || "");
      formData.append("map_lng", pharmacy.location?.lng || "");
      formData.append("operating_hours", JSON.stringify(pharmacy.operatingHours || {}));
      formData.append("username", pharmacy.username || "");
      formData.append("password", pharmacy.password || "");

      // Pharmacist
          const pharmacist = {
      ...this.getStoredPharmacistData(),
      ...this.getPharmacistData(),
    };
      formData.append("pharmacist_full_name", pharmacist.fullName || "");
      formData.append("pharmacist_qualification", pharmacist.qualification || "");
      formData.append("pharmacist_cnic", pharmacist.cnic || "");
      formData.append("pharmacist_email", pharmacist.email || "");
    
      if (pharmacist.licenseUrl) {
        formData.append("pharmacist_license_url", pharmacist.licenseUrl);
        console.log('Using Cloudinary URL for pharmacist license:', pharmacist.licenseUrl);
      } else if (pharmacist.license instanceof File) {
        formData.append("pharmacist_license_url", pharmacist.license, pharmacist.license.name);
        console.log('Using direct file upload for pharmacist license');
      } else {
        formData.append("pharmacist_license_url", "");
      }

      if (uploadResults.pharmacyLicense) {
        formData.append("pharmacy_license_public_id", uploadResults.pharmacyLicense.publicId || "");
        formData.append("pharmacy_license_format", uploadResults.pharmacyLicense.format || "");
      }
      
      if (uploadResults.pharmacistLicense) {
        formData.append("pharmacist_license_public_id", uploadResults.pharmacistLicense.publicId || "");
        formData.append("pharmacist_license_format", uploadResults.pharmacistLicense.format || "");
      }

      console.log('Form data prepared with Cloudinary URLs');
      return formData;

    } catch (error) {
      console.error('Error preparing form data with Cloudinary:', error);
      throw error;
    }
  }

  // Alternative: Format without Cloudinary (for backward compatibility)
  formatForBackendWithoutCloudinary() {
    const formData = new FormData();

    // Pharmacy
    const pharmacy = this.getData() || {};
    formData.append("owner_name", pharmacy.ownerName || "");
    formData.append("owner_email", pharmacy.ownerEmail || "");
    formData.append("owner_phone", pharmacy.ownerPhone || "");
    formData.append("owner_cnic", pharmacy.ownerCNIC || "");
    formData.append("pharmacy_name", pharmacy.pharmacyName || "");
    if (pharmacy.license instanceof File) {
      formData.append("license_url", pharmacy.license, pharmacy.license.name);
    } else {
      formData.append("license_url", pharmacy.license || "");
    }
    formData.append("years_in_operation", pharmacy.yearsOperation || 0);
    formData.append("province", pharmacy.province || "");
    formData.append("city", pharmacy.city || "");
    formData.append("area", pharmacy.area || "");
    formData.append("shop_no", pharmacy.shopNo || "");
    formData.append("street_no", pharmacy.streetNo || "");
    formData.append("block_no", pharmacy.blockNo || "");
    formData.append("map_lat", pharmacy.location?.lat || "");
    formData.append("map_lng", pharmacy.location?.lng || "");
    formData.append("operating_hours", JSON.stringify(pharmacy.operatingHours || {}));
    formData.append("username", pharmacy.username || "");
    formData.append("password", pharmacy.password || "");

    // Pharmacist
    const pharmacist = this.getPharmacistData() || {};
    formData.append("pharmacist_full_name", pharmacist.fullName || "");
    formData.append("pharmacist_qualification", pharmacist.qualification || "");
    formData.append("pharmacist_cnic", pharmacist.cnic || "");
    formData.append("pharmacist_email", pharmacist.email || "");
    if (pharmacist.license instanceof File) {
      formData.append("pharmacist_license_url", pharmacist.license, pharmacist.license.name);
    } else {
      formData.append("pharmacist_license_url", pharmacist.license || "");
    }

    return formData;
  }

  clearAll() {
    this.clearPharmacyData();
    this.clearPharmacistData();
    this.isInternalNavigation = false;
  }

  setCurrentStep(step) {
    localStorage.setItem('currentStep', step);
  }

  getCurrentStep() {
    return parseInt(localStorage.getItem('currentStep')) || 1;
  }

  clearCurrentStep() {
    localStorage.removeItem('currentStep');
  }

  canNavigateToStep(targetStep, currentStep, validateCallback) {
    if (targetStep < currentStep) {
      // Always allow going back
      return { allowed: true, reason: 'backward' };
    } else if (targetStep > currentStep) {
      // Validate before going forward
      const errors = validateCallback();
      if (Object.keys(errors).length > 0) {
        return { 
          allowed: false, 
          reason: 'validation', 
          errors 
        };
      }
      return { allowed: true, reason: 'forward' };
    }
    return { allowed: true, reason: 'same' };
  }

  validateFile(file) {
    const errors = [];
    
    if (!file) {
      errors.push('No file selected');
      return errors;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      errors.push(`File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds 5MB limit`);
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      errors.push('File must be JPG, PNG, or PDF');
    }

    return errors;
  }
}


const registrationService = new RegistrationService();
export default registrationService;
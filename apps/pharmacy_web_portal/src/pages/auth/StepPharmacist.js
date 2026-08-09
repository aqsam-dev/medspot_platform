import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import registrationService from "../../services/registrationService";
import './StepPharmacist.css';

const emailDomains = ["gmail.com", "yahoo.com", "hotmail.com", "icloud.com"];

// STEP NAVIGATION COMPONENT (Same as StepPharmacy)
const StepNavigation = ({ currentStep = 1, steps = 3, onStepClick }) => {
  const stepLabels = ['Pharmacy Details', 'Pharmacist Info', 'Account Setup'];
  
  return (
    <div className="step-navigation">
      {Array.from({ length: steps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="step-item">
          <div 
            className={`step-circle ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
            onClick={() => onStepClick?.(step)}
            style={{ cursor: currentStep > step ? 'pointer' : 'default' }}
          >
            {step}
          </div>
          <div className="step-label">{stepLabels[step - 1] || `Step ${step}`}</div>
          {step < steps && <div className={`step-line ${currentStep > step ? 'completed' : ''}`} />}
        </div>
      ))}
    </div>
  );
};

const StepPharmacist = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    qualification: '',
    cnic: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [emailLocal, setEmailLocal] = useState("");

  // -------------------------
  // INTERNAL NAVIGATION LOGIC - UPDATED
  // -------------------------
useEffect(() => {
  const internal = registrationService.getInternalNav();

  // Clear ALL data ONLY when it's a fresh start (not internal navigation)
  if (!internal) {
    registrationService.clearAll();
  }

  // DEBUG: Check what's in localStorage
  const rawData = localStorage.getItem('pharmacistData');
  console.log("Step 2 - Raw localStorage data:", rawData);
  
  // Load saved pharmacist data
  const saved = registrationService.getPharmacistData() || {};
  console.log("Step 2 - Loaded pharmacist data:", saved);
  
  // Set form data with ALL possible field name variations
  const newFormData = {
    fullName: saved.fullName || saved.pharmacist_name || '',
    qualification: saved.qualification || saved.pharmacist_qualification || '',
    cnic: saved.cnic || saved.pharmacist_cnic || '',
    email: saved.email || saved.pharmacist_email || ''
  };
  
  console.log("Step 2 - Mapped form data:", newFormData);
  setFormData(newFormData);

  // Handle email - check ALL possible email fields
  const emailToUse = saved.email || saved.pharmacist_email || '';
  if (emailToUse) {
    if (emailToUse.includes("@")) {
      setEmailLocal(emailToUse.split("@")[0]);
    } else {
      setEmailLocal(emailToUse);
    }
  } else {
    setEmailLocal("");
  }

  registrationService.setInternalNav(false);
}, []);

  // -------------------------
  // Form handlers
  // -------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'cnic') {
      let digits = value.replace(/\D/g, '').slice(0, 13);
      let formatted = digits;
      if (digits.length > 5) formatted = digits.slice(0, 5) + "-" + digits.slice(5);
      if (digits.length > 12) formatted = digits.slice(0, 5) + "-" + digits.slice(5, 12) + "-" + digits.slice(12);
      setFormData(prev => ({ ...prev, cnic: formatted }));
      return;
    }

    if (name === 'fullName') {
      // ✅ CHANGED: Allow letters and spaces only
      const cleaned = value.replace(/[^A-Za-z ]/g, "");
      // ✅ CHANGED: Limit to 20 characters (was 30)
      const truncated = cleaned.slice(0, 20);
      setFormData(prev => ({ ...prev, fullName: truncated }));
      return;
    }

    if (name === "email") {
      const local = value.replace(/\s/g, "").slice(0, 64);
      setEmailLocal(local);
      setFormData(prev => ({ ...prev, email: local }));
      setShowEmailDropdown(local.length > 0);
      setErrors(prev => ({ ...prev, email: "" }));
      return;
    }

    if (name === 'qualification') setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const pickEmailDomain = (domain) => {
    const full = `${emailLocal}@${domain}`;
    setFormData(prev => ({ ...prev, email: full }));
    setShowEmailDropdown(false);
    setHighlightedIndex(-1);
  };

  const handleEmailKeyDown = (e) => {
    if (!showEmailDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(i => (i + 1) % emailDomains.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(i => (i - 1 + emailDomains.length) % emailDomains.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0) pickEmailDomain(emailDomains[highlightedIndex]);
    } else if (e.key === "Escape") {
      setShowEmailDropdown(false);
      setHighlightedIndex(-1);
    }
  };

  // -------------------------
  // Navigation - UPDATED
  // -------------------------
  const handleNext = (e) => {
    e.preventDefault();
    const newErrors = {};
    
    // ✅ CHANGED: Added validation for 3-20 letters and spaces only
    if (!formData.fullName) {
      newErrors.fullName = "Full name required";
    } else if (formData.fullName.length < 3) {
      newErrors.fullName = "Full name must be at least 3 characters";
    } else if (!/^[A-Za-z ]+$/.test(formData.fullName)) {
      newErrors.fullName = "Full name can only contain letters and spaces";
    }
    
    if (!formData.qualification) newErrors.qualification = "Qualification required";
    if (!formData.cnic || !/^\d{5}-\d{7}-\d{1}$/.test(formData.cnic)) newErrors.cnic = "Invalid CNIC";
    if (!formData.email || !/^.+@(gmail|yahoo|hotmail|icloud)\.com$/.test(formData.email)) 
      newErrors.email = "pick allowed domain";

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      registrationService.updatePharmacistData({
        fullName : formData.fullName,
        qualification: formData.qualification,
        cnic: formData.cnic,
        email: formData.email.includes("@") ? formData.email : (emailLocal || formData.email)
      });

      registrationService.setInternalNav(true);
      navigate("/loginc");
    }
  };

  const handleBack = () => {
    // Save current data before going back - ADDED
    registrationService.updatePharmacistData({
      fullName : formData.fullName,
      qualification: formData.qualification,
      cnic: formData.cnic,
      email: formData.email.includes("@") ? formData.email : (emailLocal || formData.email)
    });
    
    registrationService.setInternalNav(true);
    navigate("/pharmacy");
  };

  const handleStepClick = (step) => {
    if (step === 2) return; // already here
    
    // Save current data before ANY navigation - ADDED
    registrationService.updatePharmacistData({
      fullName: formData.fullName,
      qualification: formData.qualification,
      cnic: formData.cnic,
      email: formData.email.includes("@") ? formData.email : (emailLocal || formData.email)
    });

    registrationService.setInternalNav(true);
    if (step === 1) navigate("/pharmacy");
    if (step === 3) navigate("/loginc");
  };

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="main-container">
      <div className="card">
        <div className="form-header">
          <h1>Pharmacist Details</h1>
          <p>Enter your personal information</p>
        </div>

        <div style={{ padding: '0 10px 20px 10px' }}>
          <StepNavigation 
            currentStep={2} 
            steps={3}
            onStepClick={handleStepClick}
          />
        </div>

        <form onSubmit={handleNext} style={{ padding: '0 10px 30px 10px' }}>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`form-input ${errors.fullName ? 'error-input' : ''}`}
                placeholder="Enter full name (3-20 letters and spaces only)"
              />
              {errors.fullName && <span className="error-text">{errors.fullName}</span>}
            </div>

            <div className="form-group">
              <label>Qualification</label>
              <select
                name="qualification"
                value={formData.qualification}
                onChange={handleChange}
                className={`form-input adjustable-dropdown ${errors.qualification ? 'error-input' : ''}`}
              >
                <option value="">Select Qualification</option>
                <option value="bpharm">B-Pharm</option>
                <option value="mpharm">M-Pharm</option>
              </select>
              {errors.qualification && <span className="error-text">{errors.qualification}</span>}
            </div>

            <div className="form-group">
              <label>CNIC</label>
              <input
                name="cnic"
                value={formData.cnic}
                onChange={handleChange}
                placeholder="12345-1234567-1"
                className={`form-input ${errors.cnic ? 'error-input' : ''}`}
              />
              {errors.cnic && <span className="error-text">{errors.cnic}</span>}
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label>Email</label>
              <input
                className={`form-input ${errors.email ? 'error-input' : ''}`}
                name="email"
                value={formData.email.includes("@") ? formData.email : emailLocal}
                onChange={handleChange}
                onKeyDown={handleEmailKeyDown}
                placeholder="type local part then pick domain (e.g. aqsam123)"
                autoComplete="off"
              />
              {showEmailDropdown && emailLocal && (
                <div className="email-dropdown" style={{ position: 'absolute', zIndex: 80, width: '100%', marginTop: 6 }}>
                  {emailDomains.map((dom, i) => (
                    <div
                      key={dom}
                      className={`email-option ${i === highlightedIndex ? 'highlighted' : ''}`}
                      onMouseEnter={() => setHighlightedIndex(i)}
                      onClick={() => pickEmailDomain(dom)}
                      style={{ padding: '8px 12px', cursor: 'pointer' }}
                    >
                      {`${emailLocal}@${dom}`}
                    </div>
                  ))}
                </div>
              )}
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
          </div>

          <div className="navigation-buttons" style={{ marginTop: 28 }}>
            <button type="button" className="btn-secondary" onClick={handleBack}>Back</button>
            <button type="submit" className="btn-primary">Next</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StepPharmacist;
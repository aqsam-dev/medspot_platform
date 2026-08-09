import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import registrationService from "../../services/registrationService";
import './StepLoginFiles.css';
import toast from "react-hot-toast";

const EyeOpenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeClosedIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <path d="M1 1l22 22"/>
  </svg>
);

const StepNavigation = ({ currentStep = 3, steps = 3, onStepClick }) => {
  const stepLabels = ['Pharmacy Details', 'Pharmacist Info', 'Account Setup'];
  return (
    <div className="step-navigation" aria-hidden>
      {Array.from({ length: steps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="step-item">
          <div 
            className={`step-circle ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
            onClick={() => currentStep > step && onStepClick?.(step)}
            style={{ cursor: currentStep > step ? 'pointer' : 'default' }}
          >
            {step}
          </div>
          <div className="step-label">{stepLabels[step - 1]}</div>
          {step < steps && <div className={`step-line ${currentStep > step ? 'completed' : ''}`} />}
        </div>
      ))}
    </div>
  );
};

const StepLoginFiles = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pharmacyLicense: null,
    pharmacistLicense: null,
    username: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ color: '#ef4444', width: '0%' });
  const [uploading, setUploading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null); // 'available' | 'taken'

  useEffect(() => {
    const pharmacy = registrationService.getData() || {};
    const pharmacist = registrationService.getPharmacistData() || {};

    setFormData({
      pharmacyLicense: pharmacy.license || null,
      pharmacistLicense: pharmacist.license || null,
      username: pharmacy.username || '',
      password: pharmacy.password || '',
      confirmPassword: pharmacy.password || ''
    });

    evaluatePasswordStrength(pharmacy.password || '');
    registrationService.setInternalNav(false);
  }, []);


  useEffect(() => {
    if (!formData.username || formData.username.length < 3) {
      setUsernameStatus(null);
      setIsCheckingUsername(false);
      return;
    }

    const checkUsername = async () => {
      setIsCheckingUsername(true);
      setUsernameStatus(null); 

      try {
        const isAvailable = await registrationService.checkUsernameAvailability(formData.username);
        setUsernameStatus(isAvailable ? 'available' : 'taken');
      } catch (err) {
        console.error("Check failed", err);
        setUsernameStatus(null);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const timeoutId = setTimeout(checkUsername, 500); 
    return () => clearTimeout(timeoutId);
  }, [formData.username]);

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (!files?.length) return;
    const file = files[0];
    setFormData(prev => ({ ...prev, [name]: file }));

    if (name === 'pharmacyLicense') registrationService.setPharmacyFile(file);
    if (name === 'pharmacistLicense') registrationService.setPharmacistFile(file);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'username') {
      const cleaned = value.replace(/[^A-Za-z]/g, '').slice(0, 20);
      setUsernameStatus(null);
      if (cleaned.length >= 3) setIsCheckingUsername(true);
      setFormData(prev => ({ ...prev, username: cleaned }));
      registrationService.updateData({ username: cleaned });
    } else if (name === 'password') {
      if (value.length > 30) return;
      setFormData(prev => ({ ...prev, password: value }));
      evaluatePasswordStrength(value);
      registrationService.updateData({ password: value });
    } else if (name === 'confirmPassword') {
      if (value.length > 30) return;
      setFormData(prev => ({ ...prev, confirmPassword: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const evaluatePasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength += 20;
    if (/[A-Z]/.test(pwd)) strength += 20;
    if (/[a-z]/.test(pwd)) strength += 20;
    if (/\d/.test(pwd)) strength += 20;
    if (/[!@#$%^&*]/.test(pwd)) strength += 20;

    let color = '#ef4444';
    if (strength >= 80) color = '#16a34a';
    else if (strength >= 40) color = '#f59e0b';

    setPasswordStrength({ color, width: `${Math.min(100, strength)}%` });
  };

  const handleStepClick = (step) => {
    registrationService.updateData({ username: formData.username, password: formData.password });
    registrationService.setInternalNav(true);
    if (step === 1) navigate('/pharmacy');
    if (step === 2) navigate('/pharmacist');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.pharmacyLicense) newErrors.pharmacyLicense = "Pharmacy license required";
    if (!formData.pharmacistLicense) newErrors.pharmacistLicense = "Pharmacist license required";
    
    // Final Validation
    if (!formData.username || formData.username.length < 10) {
      newErrors.username = "Username 10-20 chars, letters only";
    } else if (usernameStatus === 'taken') {
      newErrors.username = "Username already exists";
    }

    if (!formData.password || !/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}/.test(formData.password))
      newErrors.password = "Must meet 8-char complexity requirements";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setUploading(true);

try {
  const payload =
    await registrationService.formatForBackend();

  const res = await fetch(
    "http://localhost:5000/api/pharmacy/register",
    {
      method: "POST",
      body: payload,
    }
  );

  const json = await res.json();

  if (!res.ok) {
    toast.error(
      json?.message ||
        "Registration failed."
    );

    setUploading(false);
    return;
  }

  registrationService.clearAll();

  toast.success(
    "Registration successful! Please sign in."
  );

  navigate("/");
} catch (err) {
  console.error(
    "Network error:",
    err
  );

  toast.error(
    "Network error: Could not reach server."
  );
} finally {
  setUploading(false);
}
  };

  return (
    <div className="main-container">
      <div className="card">
        <div className="form-header">
          <h1>Account Setup & File Uploads</h1>
          <p>Complete your registration</p>
        </div>

        <div style={{ padding: '0 10px 20px 10px' }}>
          <StepNavigation currentStep={3} steps={3} onStepClick={handleStepClick} />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Pharmacy License</label>
              <input type="file" name="pharmacyLicense" onChange={handleFileChange} className={`form-input ${errors.pharmacyLicense ? 'error-input' : ''}`} accept=".jpg,.jpeg,.png,.pdf" disabled={uploading} />
              {errors.pharmacyLicense && <span className="error-text">{errors.pharmacyLicense}</span>}
            </div>

            <div className="form-group">
              <label>Pharmacist License</label>
              <input type="file" name="pharmacistLicense" onChange={handleFileChange} className={`form-input ${errors.pharmacistLicense ? 'error-input' : ''}`} accept=".jpg,.jpeg,.png,.pdf" disabled={uploading} />
              {errors.pharmacistLicense && <span className="error-text">{errors.pharmacistLicense}</span>}
            </div>

            {/* 🎯 USERNAME FIELD - RE-DESIGNED TO MATCH EMAIL STYLE */}
            <div className="form-group">
              <label>Username</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`form-input ${errors.username || usernameStatus === 'taken' ? 'error-input' : ''}`}
                  disabled={uploading}
                  style={{ paddingRight: '100px' }} 
                />
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                  {isCheckingUsername && (
                    <span style={{ color: '#666', fontSize: '12px' }}>Checking...</span>
                  )}
                  {!isCheckingUsername && usernameStatus === 'available' && (
                    <span style={{ color: '#16a34a', fontSize: '12px', fontWeight: '600' }}>
                       ✔ Available
                    </span>
                  )}
                </div>
              </div>
              {/* Error below the box */}
              {usernameStatus === 'taken' && <span className="error-text">Username already exists</span>}
              {errors.username && !usernameStatus && <span className="error-text">{errors.username}</span>}
            </div>

            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input ${errors.password ? 'error-input' : ''}`}
                  style={{ paddingRight: '44px' }}
                  disabled={uploading}
                  maxLength="30"
                />
                <button type="button" onClick={() => setShowPassword(prev => !prev)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#666' }} disabled={uploading}>
                  {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                </button>
              </div>
              <div aria-hidden style={{ height: 4, background: '#e6eefc', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: passwordStrength.width, background: passwordStrength.color, transition: 'width 0.25s ease' }} />
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`form-input ${errors.confirmPassword ? 'error-input' : ''}`}
                  style={{ paddingRight: '44px' }}
                  disabled={uploading}
                  maxLength="30"
                />
                <button type="button" onClick={() => setShowConfirmPassword(prev => !prev)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#666' }} disabled={uploading}>
                  {showConfirmPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                </button>
              </div>
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>
          </div>

          <div className="navigation-buttons">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => { 
                registrationService.updateData({ username: formData.username, password: formData.password });
                registrationService.setInternalNav(true); 
                navigate('/pharmacist'); 
              }}
              disabled={uploading}
            >
              Back
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={uploading || isCheckingUsername || usernameStatus === 'taken'}
            >
              {uploading ? 'Uploading...' : 'Submit'}
            </button>
          </div>

          {uploading && (
            <div style={{ textAlign: 'center', marginTop: 16, color: '#666' }}>
              <p>Uploading files and finishing registration...</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default StepLoginFiles;
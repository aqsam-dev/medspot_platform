import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { authAPI } from "../../services/api";
import "./Newpass.css"; 
import toast from 'react-hot-toast';

// ✅ EYE ICONS (unchanged)
const EyeOpenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeClosedIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const Newpass = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ✅ Get email from navigation state
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      // Try localStorage as fallback
      const storedEmail = localStorage.getItem('resetEmail');
      if (storedEmail) {
        setEmail(storedEmail);
      } else {
        // No email found, redirect
        setErrors({ general: "Session expired. Please restart password reset." });
      }
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // ✅ ADDED: Limit input to maximum 30 characters
    if (value.length > 30) return;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
  };

  // ✅ TOGGLE FUNCTIONS (unchanged)
  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) { // ✅ CHANGED: 6 to 8
      newErrors.newPassword = "Password must be at least 8 characters";
    } else if (formData.newPassword.length > 30) { // ✅ ADDED: Maximum 30 characters
      newErrors.newPassword = "Password cannot exceed 30 characters";
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    return newErrors;
  };

  // ✅ FIXED: Now uses resetToken from localStorage
  const handleSave = async (e) => {
    e.preventDefault();
    
    // Get resetToken from localStorage
    const resetToken = localStorage.getItem('resetToken');
    
    if (!resetToken) {
      setErrors({ general: "Reset token not found. Please restart the password reset process." });
      return;
    }
    
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Resetting password with token:', resetToken);
      
      // ✅ Send resetToken + newPassword (NOT email + passwords)
      await authAPI.resetPassword({
        resetToken: resetToken,
        newPassword: formData.newPassword
      });
      
      // ✅ Clear ALL stored data
      localStorage.removeItem('resetEmail');
      localStorage.removeItem('resetToken');
      
      toast.success(  "Password changed successfully! You can now login with your new password.");
navigate("/");
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to reset password';
      
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
      
      console.error('Password reset error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Password strength indicator
  const getPasswordStrength = () => {
    const password = formData.newPassword;
    if (!password) return { score: 0, text: '' };
    
    let score = 0;
    if (password.length >= 8) score++; // ✅ CHANGED: 6 to 8
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*]/.test(password)) score++;
    
    const strengthText = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][score] || '';
    return { score, text: strengthText };
  };

  const { score, text } = getPasswordStrength();

  return(
    <div className="main-container">
      <div className="card">
        <div className="form-container">
          <div className="form-header">
            <h1>Set New Password</h1>
            <p>Create a new password for your account</p>
            {email && (
              <p style={{fontSize: '14px', color: '#666', marginTop: '5px'}}>
                Setting password for: <strong>{email}</strong>
              </p>
            )}
          </div>
          
          <form onSubmit={handleSave}>
            <div className="form-grid">
              <div className="form-group password-group">
                <label>New Password</label>
                <div className="password-input-container">
                  <input 
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className={`form-input ${errors.newPassword ? 'error-input' : ''}`}
                    placeholder="Enter new password (8-30 characters)" // ✅ CHANGED: Updated placeholder
                    maxLength="30" // ✅ ADDED: Maximum length attribute
                  />
                  <button 
                    type="button"
                    className="password-toggle"
                    onClick={toggleNewPasswordVisibility}
                    tabIndex="-1"
                  >
                    {showNewPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                  </button>
                </div>
                
                {/* Password strength indicator */}
                {formData.newPassword && (
                  <div className="password-strength">
                    <div className="strength-bars">
                      {[1, 2, 3, 4, 5].map((index) => (
                        <div 
                          key={index}
                          className={`strength-bar ${index <= score ? 'active' : ''}`}
                          style={{backgroundColor: index <= score ? 
                            score >= 4 ? '#28a745' : 
                            score >= 3 ? '#ffc107' : 
                            '#dc3545' : '#e9ecef'}}
                        />
                      ))}
                    </div>
                    {text && (
                      <span className="strength-text">
                        Strength: <strong>{text}</strong>
                      </span>
                    )}
                  </div>
                )}
                
                {errors.newPassword && (
                  <span className="error-text">{errors.newPassword}</span>
                )}
              </div>
              
              <div className="form-group password-group">
                <label>Confirm Password</label>
                <div className="password-input-container">
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`form-input ${errors.confirmPassword ? 'error-input' : ''}`}
                    placeholder="Confirm new password"
                    maxLength="30" // ✅ ADDED: Maximum length attribute
                  />
                  <button 
                    type="button"
                    className="password-toggle"
                    onClick={toggleConfirmPasswordVisibility}
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="error-text">{errors.confirmPassword}</span>
                )}
                
                {/* Password match indicator */}
                {formData.confirmPassword && formData.newPassword && (
                  <div className="match-indicator">
                    {formData.newPassword === formData.confirmPassword ? (
                      <span style={{color: '#28a745', fontSize: '14px'}}>
                        ✓ Passwords match
                      </span>
                    ) : (
                      <span style={{color: '#dc3545', fontSize: '14px'}}>
                        ✗ Passwords don't match
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Password requirements */}
            <div className="password-requirements">
              <p style={{fontSize: '14px', marginBottom: '5px', color: '#666'}}>
                <strong>Password must contain:</strong>
              </p>
              <ul style={{fontSize: '12px', color: '#666', paddingLeft: '20px', margin: '0'}}>
                <li className={formData.newPassword.length >= 8 ? 'requirement-met' : ''}> {/* ✅ CHANGED: 6 to 8 */}
                  At least 8 characters
                </li>
                <li className={/[a-z]/.test(formData.newPassword) ? 'requirement-met' : ''}>
                  One lowercase letter
                </li>
                <li className={/[A-Z]/.test(formData.newPassword) ? 'requirement-met' : ''}>
                  One uppercase letter
                </li>
                <li className={/\d/.test(formData.newPassword) ? 'requirement-met' : ''}>
                  One number
                </li>
                <li className={/[!@#$%^&*]/.test(formData.newPassword) ? 'requirement-met' : ''}>
                  One special character (!@#$%^&*)
                </li>
              </ul>
            </div>
            
            {errors.general && (
              <div className="error-general">{errors.general}</div>
            )}
            
            <button 
              type="submit" 
              className="btn-primary"
              style={{width: '100%', marginTop: '20px'}}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span> Saving...
                </>
              ) : 'Save Password'}
            </button>
          </form>
          
          <div style={{textAlign: 'center', marginTop: '20px'}}>
            <p style={{color: '#666'}}>
              Remember password?{' '}
              <span 
                className="clickable-text" 
                onClick={() => navigate('/')}
                style={{cursor: 'pointer', color: '#2a4eca'}}
              >
                Login
              </span>
            </p>
            <p style={{fontSize: '12px', color: '#888', marginTop: '10px'}}>
              Need help? Contact Medspot
            </p>
          </div>
        </div>
      </div>
      
      {/* Removed the style tag with all CSS */}
    </div>
  );
}

export default Newpass;
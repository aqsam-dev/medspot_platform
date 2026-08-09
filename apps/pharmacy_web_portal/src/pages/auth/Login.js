import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { pharmacyAPI } from "../../services/api";
import Lottie from "lottie-react"; // ✅ Import Lottie
import animationData from "../../assets/doctorwelcome.json"; 
import toast from 'react-hot-toast';


// Eye Icons
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

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'username') {
      const lettersOnly = value.replace(/[^a-zA-Z]/g, '');
      const truncated = lettersOnly.slice(0, 20);
      setFormData(prev => ({
        ...prev,
        [name]: truncated
      }));
    } else if (name === 'password') {
      if (value.length > 30) return;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 10) {
      newErrors.username = "Username must be at least 10 characters";
    }
    
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (formData.password.length > 30) {
      newErrors.password = "Password cannot exceed 30 characters";
    } else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])/.test(formData.password)) {
      newErrors.password = "Password must include uppercase, lowercase, number & special character";
    }
    
    return newErrors;
  };

  const isLoginEnabled = () => {
    const usernameValid = formData.username.length >= 10 && /^[a-zA-Z]+$/.test(formData.username);
    const passwordValid = formData.password.length >= 8 && 
                         formData.password.length <= 30 &&
                         /(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])/.test(formData.password);
    
    return usernameValid && passwordValid;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await pharmacyAPI.login(formData);

      localStorage.setItem('token', response.token);
      localStorage.setItem('pharmacyData', JSON.stringify(response.pharmacy));

      toast.success("Login successful!");
      setTimeout(() => navigate('/dashboard'), 1000);

    } catch (error) {
      setErrors({ general: error.message || "Login Failed "});
      toast.error(error.message || "Login Failed ")
    } finally {
      setIsLoading(false);
    }
  };

  return(
    <div className="main-container">
      <div className="card">
        <div className="login-layout">
          {/* Form Side */}
          <div className="login-form-side">
            <div className="form-container">

              <div className="form-header">
                <h1>Account Login</h1>
                <p>Login using your username and password</p>
              </div>

              <form onSubmit={handleLogin}>
                
                {/* USERNAME */}
                <div className="form-group">
                  <label>Username</label>
                  <input 
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`form-input ${errors.username ? 'error-input' : ''}`}
                    placeholder="Enter username (letters only, 10-20 chars)"
                  />
                  {errors.username && <span className="error-text">{errors.username}</span>}
                </div>

                {/* PASSWORD */}
                <div className="form-group password-group">
                  <label>Password</label>
                  <div className="password-input-container">
                    <input 
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`form-input ${errors.password ? 'error-input' : ''}`}
                      placeholder="Enter password (8-30 chars with special requirements)"
                      maxLength="30"
                    />
                    <button 
                      type="button"
                      className="password-toggle"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                    </button>
                  </div>
                  {errors.password && <span className="error-text">{errors.password}</span>}
                </div>

                {/* LOGIN BUTTON */}
                <button 
                  type="submit"
                  className="btn-primary"
                  style={{width: '100%', marginTop: '15px'}}
                  disabled={isLoading || !isLoginEnabled()}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <div style={{textAlign: 'center', marginTop: '20px'}}>
                <p>
                  <span className="clickable-text" onClick={() => navigate('/forgetpass')}>
                    Forgot password?
                  </span>
                </p>
                <p style={{marginTop: '10px'}}>
                  Don't have an account?{' '}
                  <span className="clickable-text" onClick={() => navigate('/pharmacy')}>
                    Signup
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="login-image-side">
  <Lottie
    animationData={animationData}
    loop
    style={{
      width: '500px',
      height: '600px'
    }}
  />
</div>

        </div>
      </div>
    </div>
  );
}

export default Login;
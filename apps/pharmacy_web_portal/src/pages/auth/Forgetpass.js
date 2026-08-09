import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { authAPI } from "../../services/api"
import "./Forgetpass.css";
import toast from 'react-hot-toast';


const Forgetpass = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e) => {
  e.preventDefault();

  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    setError("Email address is required.");
    toast.error("Email address is required.");
    return;
  }

  setIsLoading(true);

  try {
    const response =
      await authAPI.forgotPassword({
        email: trimmedEmail,
      });

    localStorage.setItem(
      "resetToken",
      response.resetToken
    );

    toast.success(
      "OTP sent to your email."
    );

    navigate("/otp", {
      state: {
        email: trimmedEmail,
        resetToken:
          response.resetToken,
      },
    });

  } catch (error) {
    const message =
      error.message ||
      "Failed to send OTP.";

    setError(message);
    toast.error(message);

  } finally {
    setIsLoading(false);
  }
};
  return(
    <div className="main-container">
      <div className="card">
        <div className="form-container">
          <div className="form-header">
            <h1>Forgot Password</h1>
            <p>Enter your email address and we'll send you an OTP to reset your password</p>
            
            {success && (
              <div style={{
                backgroundColor: '#d4edda',
                color: '#155724',
                padding: '10px',
                borderRadius: '4px',
                margin: '10px 0',
                border: '1px solid #c3e6cb'
              }}>
                ✓ OTP sent successfully! Check your email.
              </div>
            )}
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                  setSuccess(false);
                }}
                className={`form-input ${error ? 'error-input' : ''}`}
                placeholder="Enter your email address"
                disabled={isLoading}
              />
              {error && <div className="error-text">{error}</div>}
            </div>
            
            <button 
              type="submit" 
              className="btn-primary"
              style={{width: '100%', marginTop: '20px'}}
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span> Sending OTP...
                </>
              ) : 'Send OTP'}
            </button>
          </form>
          
          <div style={{textAlign: 'center', marginTop: '30px'}}>
            <p style={{color: '#666', marginBottom: '15px'}}>
              Remember Password?{' '}
              <span 
                className="clickable-text" 
                onClick={() => navigate('/')}
                style={{cursor: 'pointer', color: '#2a4eca'}}
              >
                Login
              </span>
            </p>
            
            <div style={{fontSize: '14px', color: '#888', marginTop: '20px'}}>
              <p>📧 Check your spam folder if you don't see the email</p>
              <p>⏱️ OTP expires in 3 minutes</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Removed the style tag with all CSS */}
    </div>
  );
}

export default Forgetpass;
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { authAPI } from "../../services/api";
import "./Otp.css";
import toast from "react-hot-toast";

const Otp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputsRef = useRef([]);

  // Get email and resetToken from location state
  useEffect(() => {
    if (location.state?.email && location.state?.resetToken) {
      setEmail(location.state.email);
      setResetToken(location.state.resetToken);
      
      // Store in localStorage as backup
      localStorage.setItem('resetEmail', location.state.email);
      localStorage.setItem('resetToken', location.state.resetToken);
    } else {
      // Try to get from localStorage as fallback
      const storedEmail = localStorage.getItem('resetEmail');
      const storedToken = localStorage.getItem('resetToken');
      
      if (storedEmail && storedToken) {
        setEmail(storedEmail);
        setResetToken(storedToken);
      } else {
        setError("Session expired. Please restart the process.");
toast.error("Session expired. Please restart the process.");
        setTimeout(() => navigate('/forgetpass'), 3000);
      }
    }
  }, [location, navigate]);

  // Timer for resend OTP
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // ✅ FIXED: Simplified handleChange function
  const handleChange = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;
    
    // Limit to 1 character
    if (value.length > 1) {
      value = value.charAt(0);
    }
    
    // Create new OTP array
    const newOtp = [...otp];
    newOtp[index] = value;
    
    // Update state
    setOtp(newOtp);
    setError('');
    
    // Auto-focus next input if value entered
    if (value && index < 5) {
      setTimeout(() => {
        inputsRef.current[index + 1]?.focus();
      }, 10);
    }
    
    // Auto-focus previous input on backspace if empty
    if (!value && index > 0) {
      setTimeout(() => {
        inputsRef.current[index - 1]?.focus();
      }, 10);
    }
  };

  // ✅ FIXED: Better key handling
  const handleKeyDown = (index, e) => {
    // Handle backspace when field is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      setTimeout(() => {
        inputsRef.current[index - 1]?.focus();
      }, 10);
    }
    
    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      setTimeout(() => {
        inputsRef.current[index - 1]?.focus();
      }, 10);
    }
    
    if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      setTimeout(() => {
        inputsRef.current[index + 1]?.focus();
      }, 10);
    }
    
    // Handle paste
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault();
      navigator.clipboard.readText().then(pastedText => {
        const digits = pastedText.replace(/\D/g, '').split('').slice(0, 6);
        if (digits.length === 6) {
          const newOtp = [...otp];
          digits.forEach((digit, idx) => {
            newOtp[idx] = digit;
          });
          setOtp(newOtp);
          setError('');
          // Focus last input
          setTimeout(() => {
            inputsRef.current[5]?.focus();
          }, 10);
        }
      });
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const digits = pastedText.replace(/\D/g, '').split('').slice(0, 6);
    
    if (digits.length === 6) {
      const newOtp = [...otp];
      digits.forEach((digit, idx) => {
        newOtp[idx] = digit;
      });
      setOtp(newOtp);
      setError('');
      setTimeout(() => {
        inputsRef.current[5]?.focus();
      }, 10);
    }
  };

  // ✅ FIXED: Now uses resetToken instead of email
  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!resetToken) {
      setError("Reset token not found. Please restart the process.");
toast.error("Reset token not found. Please restart the process.");
      return;
    }
    
    // Check if all 6 digits are filled
    const isOtpComplete = otp.every(digit => digit !== '');
    if (!isOtpComplete) {
      setError("Please enter all 6 digits");
toast.error("Please enter all 6 digits.");
      
      // Highlight empty inputs
      otp.forEach((digit, index) => {
        if (!digit) {
          const input = document.getElementById(`otp-${index}`);
          if (input) {
            input.classList.add('error-input');
            setTimeout(() => {
              input.classList.remove('error-input');
            }, 2000);
          }
        }
      });
      return;
    }
    
    const otpString = otp.join('');
    
    // Double-check length
    if (otpString.length !== 6) {
      setError("OTP must be exactly 6 digits");
toast.error("OTP must be exactly 6 digits.");
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Sending verification with resetToken:', { resetToken, otp: otpString });
      
      // ✅ Send resetToken + otp (NOT email + otp)
      const response = await authAPI.verifyOtp({ 
        resetToken: resetToken, 
        otp: otpString 
      });
      
      console.log('OTP verification successful:', response);
      
      // ✅ Store the resetToken returned from verification
      if (response.resetToken) {
        localStorage.setItem('resetToken', response.resetToken);
        setResetToken(response.resetToken);
      }
      
      toast.success("OTP verified successfully.");
      navigate('/newpass', { 
        state: { email: email } ,
      });
      
    } catch (error) {
      console.error('Full error object:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Verification failed';
      
      setError(errorMessage);
toast.error(errorMessage);
      
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FIXED: Now uses resetToken for resend
  const handleResendOtp = async () => {
    if (!resetToken) {
      setError("Cannot resend: reset token not found");
toast.error("Cannot resend: reset token not found.");
      return;
    }
    
    if (timer > 0) {
     setError(`Please wait ${timer} seconds before resending`);
toast.error(`Please wait ${timer} seconds before resending.`);
      return;
    }
    
    setIsResending(true);
    setError('');
    
    try {
      // ✅ Send resetToken for resend
      const response = await authAPI.resendOtp({ resetToken });
      
      // ✅ Update resetToken if a new one is returned
      if (response.resetToken) {
        setResetToken(response.resetToken);
        localStorage.setItem('resetToken', response.resetToken);
      }
      
      // Reset timer and OTP fields
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 10);
      
      setError('New OTP sent! Check your email.');
toast.success("A new OTP has been sent to your email.");
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to resend OTP';
      setError(errorMessage);
toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Debug: Log state whenever it changes
  useEffect(() => {
    console.log('Current OTP:', otp);
    console.log('All filled?', otp.every(digit => digit !== ''));
    console.log('Reset Token exists?', !!resetToken);
  }, [otp, resetToken]);

  return(
    <div className="main-container">
      <div className="card">
        <div className="form-container">
          <div className="form-header">
            <h1>OTP Verification</h1>
            <p>Enter the 6-digit code sent to</p>
            <p className="email-display">
              <strong>{email || 'your email'}</strong>
            </p>
            {email && (
              <small style={{color: '#666', marginTop: '5px'}}>
                (Check your spam folder if you don't see it)
              </small>
            )}
          </div>
          
          <form onSubmit={handleVerify}>
            <div className="otp-container">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  ref={el => inputsRef.current[index] = el}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="1"
                  value={otp[index]}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={`otp-input ${error ? 'error-input' : ''}`}
                  autoFocus={index === 0}
                  disabled={isLoading}
                  autoComplete="one-time-code"
                />
              ))}
            </div>
            
            {/* Debug info (remove in production) */}
            <div style={{fontSize: '12px', color: '#666', textAlign: 'center', marginTop: '10px'}}>
              Debug: OTP = {otp.join('')} | Length = {otp.join('').length}
            </div>
            
            {error && (
              <div className={`error-general ${error.includes('sent') ? 'success' : ''}`}>
                {error}
              </div>
            )}
            
            <button 
              type="submit" 
              className="btn-primary"
              style={{width: '100%', marginTop: '20px'}}
              disabled={isLoading || !resetToken}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span> Verifying...
                </>
              ) : 'Verify'}
            </button>
          </form>
          
          <div style={{textAlign: 'center', marginTop: '30px'}}>
            <p style={{marginBottom: '10px', color: '#666'}}>
              Didn't receive the code?
            </p>
            
            {timer > 0 ? (
              <p style={{color: '#666'}}>
                Resend available in <strong>{formatTime(timer)}</strong>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                className="clickable-text"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2a4eca',
                  cursor: 'pointer',
                  fontSize: '16px',
                  textDecoration: 'underline',
                  padding: '0'
                }}
                disabled={isResending || !resetToken}
              >
                {isResending ? 'Sending...' : 'Resend OTP'}
              </button>
            )}
            
            <div style={{marginTop: '20px'}}>
              <button
                type="button"
                onClick={() => navigate('/forgetpass')}
                className="clickable-text"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ← Use different email
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Removed the style tag with all CSS */}
    </div>
  );
}

export default Otp;
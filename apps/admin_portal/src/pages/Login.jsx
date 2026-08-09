import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login({ onLogin }) {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs = {};

    if (!username.trim()) {
      errs.username = "Username is required";
    }

    if (!password) {
      errs.password = "Password is required";
    }

    return errs;
  }

  async function handleLogin(event) {
    event.preventDefault();

    const errs = validate();

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/dashboard/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            username: username.trim(),
            password: password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setErrors({
          general:
            result.message ||
            "Invalid username or password",
        });

        return;
      }

      /*
        No JWT is being used.

        We only save a frontend login flag so the dashboard
        remains visible after refreshing the browser.
      */
      localStorage.setItem(
        "adminLoggedIn",
        "true"
      );

      localStorage.setItem(
        "adminData",
        JSON.stringify(result.admin)
      );

      if (onLogin) {
        onLogin(result.admin);
      }

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Admin login error:",
        error
      );

      setErrors({
        general:
          "Cannot connect to the server. Make sure the backend is running.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background:
          "linear-gradient(135deg, #0a0f1d 0%, #131b2e 50%, #006a61 100%)",
      }}
    >
      {/* Left Side - Branding */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
          color: "white",
        }}
      >
        <div
          style={{
            maxWidth: "400px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "20px",
              background:
                "rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              backdropFilter: "blur(10px)",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "40px",
                color: "#4edea3",
              }}
            >
              local_pharmacy
            </span>
          </div>

          <h1
            style={{
              fontSize: "40px",
              fontWeight: "800",
              marginBottom: "16px",
              letterSpacing: "-0.02em",
            }}
          >
            MEDSPOT
          </h1>

          <p
            style={{
              fontSize: "18px",
              color:
                "rgba(255,255,255,0.7)",
              lineHeight: "1.6",
              marginBottom: "40px",
            }}
          >
            Clinical Admin Portal for
            managing pharmacies, users,
            and medicine reservations
            across Pakistan.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {[
              {
                icon: "verified",
                text:
                  "Pharmacy Verification & Management",
              },
              {
                icon: "group",
                text:
                  "User Account Monitoring",
              },
              {
                icon: "medication",
                text:
                  "Medicine Catalog Control",
              },
              {
                icon: "assessment",
                text:
                  "Reports & Moderation",
              },
            ].map((item) => {
              return (
                <div
                  key={item.text}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background:
                      "rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    padding:
                      "12px 16px",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      color: "#4edea3",
                      fontSize: "20px",
                    }}
                  >
                    {item.icon}
                  </span>

                  <span
                    style={{
                      fontSize: "14px",
                      color:
                        "rgba(255,255,255,0.8)",
                    }}
                  >
                    {item.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div
        style={{
          width: "480px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
          background:
            "rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
          borderLeft:
            "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "380px",
          }}
        >
          <div
            style={{
              marginBottom: "40px",
            }}
          >
            <h2
              style={{
                fontSize: "28px",
                fontWeight: "800",
                color: "white",
                marginBottom: "8px",
              }}
            >
              Welcome Back
            </h2>

            <p
              style={{
                fontSize: "15px",
                color:
                  "rgba(255,255,255,0.5)",
              }}
            >
              Sign in to your admin account
            </p>
          </div>

          {/* General Error */}
          {errors.general && (
            <div
              style={{
                background: "#fee2e2",
                borderRadius: "12px",
                padding: "12px 16px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: "18px",
                  color: "#dc2626",
                }}
              >
                error
              </span>

              <p
                style={{
                  fontSize: "13px",
                  color: "#dc2626",
                  fontWeight: "600",
                  margin: 0,
                }}
              >
                {errors.general}
              </p>
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Username Field */}
            <div
              style={{
                marginBottom: "20px",
              }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color:
                    "rgba(255,255,255,0.6)",
                  textTransform:
                    "uppercase",
                  letterSpacing:
                    "0.05em",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Username
              </label>

              <div
                style={{
                  position: "relative",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform:
                      "translateY(-50%)",
                    color:
                      "rgba(255,255,255,0.4)",
                    fontSize: "20px",
                  }}
                >
                  person
                </span>

                <input
                  type="text"
                  value={username}
                  placeholder="Enter admin username"
                  autoComplete="username"
                  onChange={(event) => {
                    setUsername(
                      event.target.value
                    );

                    setErrors(
                      (previous) => ({
                        ...previous,
                        username: "",
                        general: "",
                      })
                    );
                  }}
                  style={{
                    width: "100%",
                    padding:
                      "14px 16px 14px 48px",
                    borderRadius: "14px",

                    border:
                      errors.username
                        ? "2px solid #dc2626"
                        : "2px solid rgba(255,255,255,0.15)",

                    background:
                      "rgba(255,255,255,0.08)",
                    color: "white",
                    fontSize: "15px",
                    outline: "none",
                    boxSizing:
                      "border-box",
                  }}
                  onFocus={(event) => {
                    event.target.style.borderColor =
                      "#4edea3";
                  }}
                  onBlur={(event) => {
                    event.target.style.borderColor =
                      errors.username
                        ? "#dc2626"
                        : "rgba(255,255,255,0.15)";
                  }}
                />
              </div>

              {errors.username && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#f87171",
                    marginTop: "6px",
                    fontWeight: "600",
                  }}
                >
                  {errors.username}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div
              style={{
                marginBottom: "32px",
              }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color:
                    "rgba(255,255,255,0.6)",
                  textTransform:
                    "uppercase",
                  letterSpacing:
                    "0.05em",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Password
              </label>

              <div
                style={{
                  position: "relative",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform:
                      "translateY(-50%)",
                    color:
                      "rgba(255,255,255,0.4)",
                    fontSize: "20px",
                  }}
                >
                  lock
                </span>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  onChange={(event) => {
                    setPassword(
                      event.target.value
                    );

                    setErrors(
                      (previous) => ({
                        ...previous,
                        password: "",
                        general: "",
                      })
                    );
                  }}
                  style={{
                    width: "100%",
                    padding:
                      "14px 48px 14px 48px",
                    borderRadius: "14px",

                    border:
                      errors.password
                        ? "2px solid #dc2626"
                        : "2px solid rgba(255,255,255,0.15)",

                    background:
                      "rgba(255,255,255,0.08)",
                    color: "white",
                    fontSize: "15px",
                    outline: "none",
                    boxSizing:
                      "border-box",
                  }}
                  onFocus={(event) => {
                    event.target.style.borderColor =
                      "#4edea3";
                  }}
                  onBlur={(event) => {
                    event.target.style.borderColor =
                      errors.password
                        ? "#dc2626"
                        : "rgba(255,255,255,0.15)";
                  }}
                />

                <button
                  type="button"
                  onClick={() => {
                    setShowPassword(
                      (previous) =>
                        !previous
                    );
                  }}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform:
                      "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      color:
                        "rgba(255,255,255,0.4)",
                      fontSize: "20px",
                    }}
                  >
                    {showPassword
                      ? "visibility_off"
                      : "visibility"}
                  </span>
                </button>
              </div>

              {errors.password && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#f87171",
                    marginTop: "6px",
                    fontWeight: "600",
                  }}
                >
                  {errors.password}
                </p>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "14px",
                border: "none",

                background: loading
                  ? "rgba(78,222,163,0.5)"
                  : "linear-gradient(135deg, #006a61, #4edea3)",

                color: "white",
                fontWeight: "700",
                fontSize: "16px",

                cursor: loading
                  ? "not-allowed"
                  : "pointer",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                transition: "all 0.2s",
              }}
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: "20px",
                      height: "20px",

                      border:
                        "3px solid rgba(255,255,255,0.3)",

                      borderTop:
                        "3px solid white",

                      borderRadius: "50%",

                      animation:
                        "spin 1s linear infinite",
                    }}
                  />

                  Signing in...
                </>
              ) : (
                <>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: "20px",
                    }}
                  >
                    login
                  </span>

                  Sign In
                </>
              )}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              fontSize: "13px",
              color:
                "rgba(255,255,255,0.4)",
              marginTop: "24px",
            }}
          >
            Authorized administrators only
          </p>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          input::placeholder {
            color: rgba(255,255,255,0.3);
          }

          @media (max-width: 900px) {
            .login-branding {
              display: none;
            }
          }
        `}
      </style>
    </div>
  );
}
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import registrationService from "../../services/registrationService";
import { APIProvider, Map, AdvancedMarker, useMapsLibrary } from "@vis.gl/react-google-maps";
import pakistanData from "../../data/pakistanData.json";
import './stepPharmacy.css';

// Google Maps Configuration
const libraries = ["places"];
const mapContainerStyle = { height: '250px', width: '100%' };
const defaultCenter = { lat: 33.5671, lng: 73.0169 };
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const emailDomains = ["gmail.com", "yahoo.com", "hotmail.com", "icloud.com"];

const daysOfWeek = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' }
];

const StepNavigation = ({ currentStep = 1, steps = 3, onStepClick }) => {
  const stepLabels = ['Pharmacy Details', 'Pharmacist Info', 'Account Setup'];

  return (
    <div className="step-navigation">
      {Array.from({ length: steps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="step-item">
          <div
            className={`step-circle ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
            onClick={() => {
              if (currentStep > step) {
                onStepClick?.(step);
              }
            }}
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

const PlaceAutocomplete = ({ onPlaceSelect }) => {
  const inputRef = useRef(null);
  const places = useMapsLibrary('places');

  useEffect(() => {
    if (!places || !inputRef.current) return;
    const autocomplete = new places.Autocomplete(inputRef.current, {
      fields: ['geometry', 'name', 'formatted_address']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry) onPlaceSelect(place);
    });
  }, [places, onPlaceSelect]);

  return (
    <input
      ref={inputRef}
      className="map-search-input"
      placeholder="Search for pharmacy..."
      style={{
        position: 'absolute', top: '10px', left: '10px', zIndex: 1,
        width: '250px', height: '40px', padding: '0 12px'
      }}
    />
  );
};

const StepPharmacy = () => {
  // GOOGLE MAPS LOADER

  useEffect(() => {
    const internal = registrationService.getInternalNav();
    if (!internal) {
      registrationService.clearAll();
    }
    const saved = registrationService.getData() || {};
    setFormData(prev => ({
      ...prev,
      ...saved
    }));
    registrationService.setInternalNav(false);
  }, []);

  const navigate = useNavigate();
  const [map, setMap] = useState(null);
  const autocompleteRef = useRef(null);

  const [formData, setFormData] = useState({
    pharmacyName: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    ownerCNIC: "",
    province: "",
    city: "",
    area: "",
    shopNo: "",
    streetNo: "",
    blockNo: "",
    yearsOperation: "",
    location: { lat: 33.5671, lng: 73.0169 }
  });

  const [emailLocal, setEmailLocal] = useState("");
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [cnicStatus, setCnicStatus] = useState(null);
  const [isCheckingCNIC, setIsCheckingCNIC] = useState(false);
  const [is24Hours, setIs24Hours] = useState(null);
  const [operatingHours, setOperatingHours] = useState({
    monday: { open: '09:00', close: '18:00', isOpen: true },
    tuesday: { open: '09:00', close: '18:00', isOpen: true },
    wednesday: { open: '09:00', close: '18:00', isOpen: true },
    thursday: { open: '09:00', close: '18:00', isOpen: true },
    friday: { open: '09:00', close: '18:00', isOpen: true },
    saturday: { open: '10:00', close: '16:00', isOpen: true },
    sunday: { open: '', close: '', isOpen: false }
  });

  const [errors, setErrors] = useState({});
  const [errorOperating, setErrorOperating] = useState("");

  useEffect(() => {
    if (!formData.ownerEmail || !formData.ownerEmail.includes('@')) {
      setEmailStatus(null);
      return;
    }
    const checkAvailability = async () => {
      setIsCheckingEmail(true);
      try {
        const isAvailable = await registrationService.checkEmailAvailability(formData.ownerEmail);
        setEmailStatus(isAvailable ? 'available' : 'taken');
      } catch (err) {
        console.error("Availability check failed", err);
      } finally {
        setIsCheckingEmail(false);
      }
    };
    const timeoutId = setTimeout(() => {
      checkAvailability();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.ownerEmail]);

  useEffect(() => {
    if (!/^\d{5}-\d{7}-\d{1}$/.test(formData.ownerCNIC)) {
      setCnicStatus(null);
      return;
    }

    const checkAvailability = async () => {
      setIsCheckingCNIC(true);

      try {
        const isAvailable =
          await registrationService.checkCNICAvailability(formData.ownerCNIC);

        setCnicStatus(isAvailable ? "available" : "taken");

      } catch (err) {
        console.error("CNIC check failed", err);
      } finally {
        setIsCheckingCNIC(false);
      }
    };

    const timeoutId = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timeoutId);

  }, [formData.ownerCNIC]);

  useEffect(() => {
    const saved = registrationService.getData() || {};
    setFormData(prev => ({ ...prev, ...saved }));
    if (saved.ownerEmail) {
      if (saved.ownerEmail.includes("@")) {
        const parts = saved.ownerEmail.split("@");
        setEmailLocal(parts[0]);
      } else {
        setEmailLocal(saved.ownerEmail);
      }
    }
    if (saved.province) setCities(Object.keys(pakistanData[saved.province] || {}));
    if (saved.province && saved.city) setAreas(pakistanData[saved.province][saved.city] || []);
    if (saved.is24Hours !== undefined) setIs24Hours(saved.is24Hours);
    if (saved.operatingHours) setOperatingHours(saved.operatingHours);
  }, []);

  // NEW HANDLERS (Paste these inside your StepPharmacy component)
  const handleMapClick = (e) => {
    // Extract only the numeric values
    const lat = Number(e.detail.latLng.lat);
    const lng = Number(e.detail.latLng.lng);
    setFormData(prev => ({ ...prev, location: { lat, lng } }));
  };

  const handleMarkerDrag = (e) => {
    // e.latLng is a plain object in this library, but let's be safe
    const lat = Number(e.latLng.lat);
    const lng = Number(e.latLng.lng);
    setFormData(prev => ({ ...prev, location: { lat, lng } }));
  };

  const handlePlaceSelect = (place) => {
    if (place.geometry && place.geometry.location) {
      // You MUST call .lat() and .lng() as functions here
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      setFormData(prev => ({
        ...prev,
        location: { lat, lng } // This is now plain data
      }));
    }
  };

  // FORM VALIDATION & TEXT HANDLERS (UNCHANGED)
  const validateForm = () => {
    const e = {};
    if (!/^[A-Za-z ]{3,20}$/.test((formData.pharmacyName || "").trim())) e.pharmacyName = "3–20 letters/spaces required";
    if (!/^[A-Za-z ]{3,20}$/.test((formData.ownerName || "").trim())) e.ownerName = "3–20 letters/spaces required";
    if (!formData.ownerEmail || !/^.+@(gmail|yahoo|hotmail|icloud)\.com$/.test(formData.ownerEmail)) e.ownerEmail = "pick allowed domain";
    if (emailStatus === 'taken') e.ownerEmail = "Email already registered";
    if (!/^03\d{9}$/.test(formData.ownerPhone)) e.ownerPhone = "Start with 03 and 11 digits";
    if (!/^\d{5}-\d{7}-\d{1}$/.test(formData.ownerCNIC || "")) e.ownerCNIC = "Format: 12345-1234567-1";
    if (!formData.province) e.province = "Required";
    if (!formData.city) e.city = "Required";
    if (!formData.area) e.area = "Required";
    const shortPattern = /^\d[aA-zZ0-9\-\/]{0,5}$/;
    if (!shortPattern.test(formData.shopNo || "")) e.shopNo = "Start with digit, max 6 chars";
    if (!shortPattern.test(formData.streetNo || "")) e.streetNo = "Start with digit, max 6 chars";
    if (!shortPattern.test(formData.blockNo || "")) e.blockNo = "Start with digit, max 6 chars";
    if (formData.yearsOperation === "" || formData.yearsOperation === null || formData.yearsOperation === undefined) e.yearsOperation = "Required";
    else if (!(Number.isInteger(Number(formData.yearsOperation)) && Number(formData.yearsOperation) >= 0 && Number(formData.yearsOperation) <= 50)) e.yearsOperation = "0–50";
    if (is24Hours === null) e.is24Hours = "Select Yes or No";
    return e;
  };

  const handleTextChange = (ev) => {
    const { name, value } = ev.target;
    if (name === "pharmacyName" || name === "ownerName") {
      const cleaned = value.replace(/[^A-Za-z ]/g, "").slice(0, 20);
      setFormData(prev => ({ ...prev, [name]: cleaned }));
      setErrors(prev => ({ ...prev, [name]: "" }));
      return;
    }
    if (name === "ownerPhone") {
      const digits = value.replace(/\D/g, "").slice(0, 11);
      setFormData(prev => ({ ...prev, ownerPhone: digits }));
      setErrors(prev => ({ ...prev, ownerPhone: "" }));
      return;
    }
    if (name === "ownerCNIC") {
      const digits = value.replace(/\D/g, "").slice(0, 13);
      let formatted = digits;
      if (digits.length > 5) formatted = digits.slice(0, 5) + "-" + digits.slice(5);
      if (digits.length > 12) formatted = digits.slice(0, 5) + "-" + digits.slice(5, 12) + "-" + digits.slice(12);
      setCnicStatus(null);
      setFormData(prev => ({ ...prev, ownerCNIC: formatted }));
      setErrors(prev => ({ ...prev, ownerCNIC: "" }));
      return;
    }
    if (name === "province") {
      setFormData(prev => ({ ...prev, province: value, city: "", area: "" }));
      setCities(Object.keys(pakistanData[value] || {}));
      setAreas([]);
      setErrors(prev => ({ ...prev, province: "" }));
      return;
    }
    if (name === "city") {
      setFormData(prev => ({ ...prev, city: value, area: "" }));
      setAreas(pakistanData[formData.province]?.[value] || []);
      setErrors(prev => ({ ...prev, city: "" }));
      return;
    }
    if (name === "area") {
      setFormData(prev => ({ ...prev, area: value }));
      setErrors(prev => ({ ...prev, area: "" }));
      return;
    }
    if (["shopNo", "streetNo", "blockNo"].includes(name)) {
      const cleaned = value.replace(/[^0-9A-Za-z\-\/]/g, "").slice(0, 6);
      setFormData(prev => ({ ...prev, [name]: cleaned }));
      setErrors(prev => ({ ...prev, [name]: "" }));
      return;
    }
    if (name === "yearsOperation") {
      let n = value === "" ? "" : Number(value);
      if (n !== "" && (isNaN(n) || n < 0)) n = 0;
      if (n > 50) n = 50;
      setFormData(prev => ({ ...prev, yearsOperation: n === "" ? "" : String(n) }));
      setErrors(prev => ({ ...prev, yearsOperation: "" }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleEmailLocalChange = (ev) => {
    const local = ev.target.value.replace(/\s/g, "").slice(0, 64);
    setEmailLocal(local);
    setFormData(prev => ({ ...prev, ownerEmail: local }));
    setShowEmailDropdown(local.length > 0);
    setErrors(prev => ({ ...prev, ownerEmail: "" }));
    setEmailStatus(null);
  };

  const pickEmailDomain = (domain) => {
    const full = `${emailLocal}@${domain}`;
    setFormData(prev => ({ ...prev, ownerEmail: full }));
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

  const handleDayToggle = (day) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isOpen: !prev[day].isOpen,
        open: !prev[day].isOpen ? '09:00' : '',
        close: !prev[day].isOpen ? '18:00' : ''
      }
    }));
    setErrorOperating("");
  };

  const handleTimeChange = (day, field, value) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
    setErrorOperating("");
  };

  const handle24HoursClick = (val) => {
    setIs24Hours(val);
    setErrorOperating("");
    if (val === true) {
      const all = {};
      Object.keys(operatingHours).forEach(d => { all[d] = { open: '00:00', close: '23:59', isOpen: true }; });
      setOperatingHours(all);
    } else {
      setOperatingHours({
        monday: { open: '09:00', close: '18:00', isOpen: true },
        tuesday: { open: '09:00', close: '18:00', isOpen: true },
        wednesday: { open: '09:00', close: '18:00', isOpen: true },
        thursday: { open: '09:00', close: '18:00', isOpen: true },
        friday: { open: '09:00', close: '18:00', isOpen: true },
        saturday: { open: '10:00', close: '16:00', isOpen: true },
        sunday: { open: '', close: '', isOpen: false }
      });
    }
  };

  const handleNext = (ev) => {
    ev.preventDefault();
    const validationErrors = validateForm();
    setErrors(validationErrors);
    let hoursError = "";
    if (is24Hours === false) {
      const hasHours = Object.values(operatingHours).some(d => d.isOpen && d.open && d.close);
      if (!hasHours) {
        hoursError = "Set operating hours for at least one day";
        setErrorOperating(hoursError);
      }
    }
    if (is24Hours === true) setErrorOperating("");
    if (Object.keys(validationErrors).length > 0 || hoursError || emailStatus === 'taken' || cnicStatus === 'taken') return;

    registrationService.updateData({
      ...formData,
      ownerEmail: formData.ownerEmail.includes("@") ? formData.ownerEmail : (emailLocal || formData.ownerEmail),
      is24Hours,
      operatingHours
    });
    registrationService.setInternalNav(true);
    navigate("/Pharmacist");
  };

  return (
    <div className="main-container">
      <div className="card" style={{ maxHeight: '86vh', overflow: 'auto' }}>
        <div className="form-header">
          <h1>Pharmacy Details</h1>
          <p>Enter your pharmacy information</p>
        </div>

        <div style={{ padding: '0 10px 20px 10px' }}>
          <StepNavigation
            currentStep={1}
            steps={3}
            onStepClick={(step) => {
              registrationService.updateData({
                ...formData,
                ownerEmail: formData.ownerEmail.includes("@") ? formData.ownerEmail : (emailLocal || formData.ownerEmail),
                is24Hours,
                operatingHours
              });
              registrationService.setInternalNav(true);
              if (step === 2) navigate("/Pharmacist");
              if (step === 3) navigate("/loginc");
            }}
          />
        </div>

        <form onSubmit={handleNext} style={{ padding: '0 10px 30px 10px' }}>
          <div className="form-grid">
            {/* Input Fields (SAME AS BEFORE) */}
            <div className="form-group">
              <label>Pharmacy Name</label>
              <input className={`form-input ${errors.pharmacyName ? 'error-input' : ''}`}
                name="pharmacyName" value={formData.pharmacyName} onChange={handleTextChange} placeholder="Enter pharmacy name" />
              {errors.pharmacyName && <span className="error-text">{errors.pharmacyName}</span>}
            </div>
            <div className="form-group">
              <label>Owner Name</label>
              <input className={`form-input ${errors.ownerName ? 'error-input' : ''}`}
                name="ownerName" value={formData.ownerName} onChange={handleTextChange} placeholder="Enter owner name" />
              {errors.ownerName && <span className="error-text">{errors.ownerName}</span>}
            </div>
            <div className="form-group">
              <label>CNIC</label>

              <div style={{ position: 'relative' }}>
                <input
                  className={`form-input ${errors.ownerCNIC || cnicStatus === 'taken'
                    ? 'error-input'
                    : ''
                    }`}
                  name="ownerCNIC"
                  value={formData.ownerCNIC}
                  onChange={handleTextChange}
                  placeholder="12345-1234567-1"
                  maxLength={15}
                />

                {isCheckingCNIC && (
                  <span
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: 10,
                      fontSize: 12
                    }}
                  >
                    Checking...
                  </span>
                )}

                {cnicStatus === 'available' && (
                  <span
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: 8,
                      color: 'green'
                    }}
                  >
                    ✔ Available
                  </span>
                )}

                {cnicStatus === 'taken' && (
                  <span
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: 8,
                      color: 'red'
                    }}
                  >
                    ✖ Taken
                  </span>
                )}
              </div>

              {errors.ownerCNIC && (
                <span className="error-text">
                  {errors.ownerCNIC}
                </span>
              )}

              {cnicStatus === 'taken' && (
                <span className="error-text">
                  CNIC already registered
                </span>
              )}
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label>E-mail</label>
              <div style={{ position: 'relative' }}>
                <input className={`form-input ${errors.ownerEmail || emailStatus === 'taken' ? 'error-input' : ''}`}
                  name="ownerEmail" value={formData.ownerEmail.includes("@") ? formData.ownerEmail : emailLocal}
                  onChange={handleEmailLocalChange} onKeyDown={handleEmailKeyDown} placeholder="type local part then pick domain" autoComplete="off" />
                {isCheckingEmail && <span style={{ position: 'absolute', right: 10, top: 10, fontSize: 12 }}>Checking...</span>}
                {emailStatus === 'available' && <span style={{ position: 'absolute', right: 10, top: 8, color: 'green' }}>✔ Available</span>}
              </div>
              {showEmailDropdown && emailLocal && (
                <div className="email-dropdown" style={{ position: 'absolute', zIndex: 80, width: '100%', marginTop: 6, background: 'white', border: '1px solid #ccc' }}>
                  {emailDomains.map((dom, i) => (
                    <div key={dom} className={`email-option ${i === highlightedIndex ? 'highlighted' : ''}`}
                      onMouseEnter={() => setHighlightedIndex(i)} onClick={() => pickEmailDomain(dom)} style={{ padding: '8px 12px', cursor: 'pointer' }}>
                      {`${emailLocal}@${dom}`}
                    </div>
                  ))}
                </div>
              )}
              {errors.ownerEmail && <span className="error-text">{errors.ownerEmail}</span>}
              {emailStatus === 'taken' && <span className="error-text">Email already registered</span>}
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input className={`form-input ${errors.ownerPhone ? 'error-input' : ''}`}
                name="ownerPhone" value={formData.ownerPhone} onChange={handleTextChange} placeholder="03XXXXXXXXX" maxLength={11} />
              {errors.ownerPhone && <span className="error-text">{errors.ownerPhone}</span>}
            </div>

            <div className="form-group">
              <label>Province</label>
              <select className={`form-input ${errors.province ? 'error-input' : ''}`} name="province" value={formData.province} onChange={handleTextChange}>
                <option value="">Select Province</option>
                {Object.keys(pakistanData).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.province && <span className="error-text">{errors.province}</span>}
            </div>

            <div className="form-group">
              <label>City</label>
              <select className={`form-input ${errors.city ? 'error-input' : ''}`} name="city" value={formData.city} onChange={handleTextChange}>
                <option value="">Select City</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.city && <span className="error-text">{errors.city}</span>}
            </div>

            <div className="form-group">
              <label>Area</label>
              <select className={`form-input ${errors.area ? 'error-input' : ''}`} name="area" value={formData.area} onChange={handleTextChange}>
                <option value="">Select Area</option>
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              {errors.area && <span className="error-text">{errors.area}</span>}
            </div>

            <div className="form-group">
              <label>Shop No</label>
              <input className={`form-input ${errors.shopNo ? 'error-input' : ''}`} name="shopNo" value={formData.shopNo} onChange={handleTextChange} placeholder="e.g. 1A-3" maxLength={6} />
              {errors.shopNo && <span className="error-text">{errors.shopNo}</span>}
            </div>

            <div className="form-group">
              <label>Street No</label>
              <input className={`form-input ${errors.streetNo ? 'error-input' : ''}`} name="streetNo" value={formData.streetNo} onChange={handleTextChange} placeholder="e.g. 2B" maxLength={6} />
              {errors.streetNo && <span className="error-text">{errors.streetNo}</span>}
            </div>

            <div className="form-group">
              <label>Block No</label>
              <input className={`form-input ${errors.blockNo ? 'error-input' : ''}`} name="blockNo" value={formData.blockNo} onChange={handleTextChange} placeholder="e.g. 3C" maxLength={6} />
              {errors.blockNo && <span className="error-text">{errors.blockNo}</span>}
            </div>

            <div className="form-group">
              <label>Years in Operation</label>
              <input className={`form-input ${errors.yearsOperation ? 'error-input' : ''}`} name="yearsOperation" type="number" value={formData.yearsOperation} onChange={handleTextChange} min={0} max={50} />
              {errors.yearsOperation && <span className="error-text">{errors.yearsOperation}</span>}
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Map Location</label>
              <APIProvider apiKey="YOUR_GOOGLE_MAP_API_KEY">
                <div style={{ height: '350px', width: '100%', position: 'relative' }}>
                  <Map
                    defaultCenter={defaultCenter}
                    defaultZoom={15}
                    mapId="593aaf660a6f150a749bed3e"
                    // Force the values to be plain numbers
                    center={formData.location.lat ? { lat: Number(formData.location.lat), lng: Number(formData.location.lng) } : null}
                    onClick={handleMapClick}
                  >
                    <PlaceAutocomplete onPlaceSelect={handlePlaceSelect} />

                    <AdvancedMarker
                      position={formData.location.lat ? formData.location : { lat: 33.5671, lng: 73.0169 }}
                      draggable={true}
                      onDragEnd={handleMarkerDrag}
                    />
                  </Map>
                </div>
              </APIProvider>
            </div>

            {/* OPERATING HOURS (UNCHANGED) */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', color: '#2A4ECA', fontSize: 26, marginBottom: 10 }}>Does your pharmacy operate 24/7?</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <button type="button" className={`btn-primary ${is24Hours === true ? 'active' : ''}`} onClick={() => handle24HoursClick(true)}>Yes</button>
                <button type="button" className={`btn-secondary ${is24Hours === false ? 'active' : ''}`} onClick={() => handle24HoursClick(false)}>No</button>
                {errors.is24Hours && <span className="error-text" style={{ marginLeft: 12 }}>{errors.is24Hours}</span>}
              </div>
              {is24Hours === true && (
                <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: 12, borderRadius: 6, marginBottom: 12 }}>Your pharmacy is set to operate 24/7.</div>
              )}
              {is24Hours === false && (
                <div className="operating-hours" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {daysOfWeek.map(d => (
                    <div key={d.id} className="day-row" style={{ alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                        <label style={{ minWidth: 120 }}>
                          <input type="checkbox" checked={operatingHours[d.id].isOpen} onChange={() => handleDayToggle(d.id)} />
                          <span style={{ marginLeft: 8 }}>{d.label}</span>
                        </label>
                        {operatingHours[d.id].isOpen ? (
                          <>
                            <input type="time" className="form-input" style={{ width: 120 }} value={operatingHours[d.id].open} onChange={(e) => handleTimeChange(d.id, 'open', e.target.value)} required />
                            <span style={{ margin: '0 6px' }}>to</span>
                            <input type="time" className="form-input" style={{ width: 120 }} value={operatingHours[d.id].close} onChange={(e) => handleTimeChange(d.id, 'close', e.target.value)} required />
                          </>
                        ) : (
                          <span style={{ color: '#888', marginLeft: 8 }}>Closed</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {errorOperating && <div className="error-text" style={{ marginTop: 10 }}>{errorOperating}</div>}
            </div>
          </div>

          <div className="navigation-buttons" style={{ marginTop: 28 }}>
            <div />
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn-secondary" onClick={() => {
                registrationService.updateData({
                  ...formData,
                  ownerEmail: formData.ownerEmail.includes("@") ? formData.ownerEmail : (emailLocal || formData.ownerEmail),
                  is24Hours,
                  operatingHours
                });
                navigate('/');
              }}>Cancel</button>
              <button type="submit" className="btn-primary">Next</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StepPharmacy;
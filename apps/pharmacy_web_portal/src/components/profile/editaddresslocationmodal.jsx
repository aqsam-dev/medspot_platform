import {
  useState,
  useRef,
  useEffect
} from "react";

import pharmacyProfileService from "../../services/pharmacyprofileservice";
import pakistanData from "../../data/pakistanData.json";

import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMapsLibrary
} from "@vis.gl/react-google-maps";

const GOOGLE_MAPS_API_KEY =
  process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

function PlaceAutocomplete({
  onPlaceSelect
}) {
  const inputRef = useRef(null);

  const places =
    useMapsLibrary("places");

  useEffect(() => {
    if (!places || !inputRef.current) {
      return;
    }

    const autocomplete =
      new places.Autocomplete(
        inputRef.current,
        {
          fields: [
            "geometry",
            "formatted_address"
          ]
        }
      );

    const listener =
      autocomplete.addListener(
        "place_changed",
        () => {
          const place =
            autocomplete.getPlace();

          if (
            place.geometry &&
            place.geometry.location
          ) {
            onPlaceSelect(place);
          }
        }
      );

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [places, onPlaceSelect]);

  return (
    <input
      ref={inputRef}
      placeholder="Search location"
      className="
        absolute
        top-3
        left-3
        z-10
        bg-white
        border
        px-3
        py-2
        rounded-lg
        w-72
      "
    />
  );
}

export default function EditAddressLocationModal({
  profile,
  onClose,
  onSuccess
}) {
  const [cities, setCities] =
    useState([]);

  const [areas, setAreas] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [formData, setFormData] =
    useState({
      province:
        profile.province || "",

      city:
        profile.city || "",

      area:
        profile.area || "",

      shop_no:
        profile.shop_no || "",

      street_no:
        profile.street_no || "",

      block_no:
        profile.block_no || "",

      map_lat:
        profile.map_lat || 33.6844,

      map_lng:
        profile.map_lng || 73.0479
    });

  useEffect(() => {
    const selectedProvince =
      profile.province || "";

    const selectedCity =
      profile.city || "";

    setCities(
      Object.keys(
        pakistanData[
          selectedProvince
        ] || {}
      )
    );

    setAreas(
      pakistanData[
        selectedProvince
      ]?.[
        selectedCity
      ] || []
    );
  }, [profile]);

  const handleChange = (e) => {
    const {
      name,
      value
    } = e.target;

    setError("");

    if (name === "province") {
      setFormData(prev => ({
        ...prev,
        province: value,
        city: "",
        area: ""
      }));

      setCities(
        Object.keys(
          pakistanData[value] || {}
        )
      );

      setAreas([]);

      return;
    }

    if (name === "city") {
      setFormData(prev => ({
        ...prev,
        city: value,
        area: ""
      }));

      setAreas(
        pakistanData[
          formData.province
        ]?.[value] || []
      );

      return;
    }

    if (
      [
        "shop_no",
        "street_no",
        "block_no"
      ].includes(name)
    ) {
      const cleaned =
        value
          .replace(
            /[^A-Za-z0-9\-\/]/g,
            ""
          )
          .slice(0, 6);

      setFormData(prev => ({
        ...prev,
        [name]: cleaned
      }));

      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMapClick = (e) => {
    if (!e.detail?.latLng) {
      return;
    }

    setError("");

    setFormData(prev => ({
      ...prev,
      map_lat: Number(
        e.detail.latLng.lat
      ),
      map_lng: Number(
        e.detail.latLng.lng
      )
    }));
  };

  const handleMarkerDrag = (e) => {
    if (!e.latLng) {
      return;
    }

    setError("");

    setFormData(prev => ({
      ...prev,
      map_lat: Number(
        e.latLng.lat()
      ),
      map_lng: Number(
        e.latLng.lng()
      )
    }));
  };

  const handlePlaceSelect =
    (place) => {
      if (
        !place.geometry ||
        !place.geometry.location
      ) {
        return;
      }

      const lat =
        place.geometry.location.lat();

      const lng =
        place.geometry.location.lng();

      setError("");

      setFormData(prev => ({
        ...prev,
        map_lat: Number(lat),
        map_lng: Number(lng)
      }));
    };

 const save = async () => {
  try {
    setLoading(true);
    setError("");

    if (
      !formData.province ||
      !formData.city ||
      !formData.area ||
      !formData.shop_no ||
      !formData.street_no ||
      !formData.block_no
    ) {
      setError(
        "Please complete all address fields."
      );

      return;
    }

    const latitude =
      Number(formData.map_lat);

    const longitude =
      Number(formData.map_lng);

    if (
      Number.isNaN(latitude) ||
      Number.isNaN(longitude)
    ) {
      setError(
        "Please select a valid map location."
      );

      return;
    }

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      setError(
        "The selected map coordinates are invalid."
      );

      return;
    }

    const payload = {
      province:
        formData.province.trim(),

      city:
        formData.city.trim(),

      area:
        formData.area.trim(),

      shop_no:
        formData.shop_no.trim(),

      street_no:
        formData.street_no.trim(),

      block_no:
        formData.block_no.trim(),

      map_lat: latitude,

      map_lng: longitude
    };

    const response =
      await pharmacyProfileService.updateAddress(
        profile.pharmacy_id,
        payload
      );

    if (response.success) {
      onSuccess();
    }
  } catch (err) {
    console.error(
      "Update Address Error:",
      err
    );

    setError(
      err.message ||
      "Failed to update address and location."
    );
  } finally {
    setLoading(false);
  }
};
  const latitude =
    Number(formData.map_lat);

  const longitude =
    Number(formData.map_lng);

  const validMapPosition =
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude);

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-5xl rounded-2xl p-6 max-h-[90vh] overflow-auto">
        <h2 className="text-xl font-semibold mb-5">
          Edit Address & Location
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          <select
            name="province"
            value={formData.province}
            onChange={handleChange}
            disabled={loading}
            className="border p-3 rounded-xl"
          >
            <option value="">
              Select Province
            </option>

            {Object.keys(
              pakistanData
            ).map(province => (
              <option
                key={province}
                value={province}
              >
                {province}
              </option>
            ))}
          </select>

          <select
            name="city"
            value={formData.city}
            onChange={handleChange}
            disabled={
              loading ||
              !formData.province
            }
            className="border p-3 rounded-xl disabled:bg-gray-100"
          >
            <option value="">
              Select City
            </option>

            {cities.map(city => (
              <option
                key={city}
                value={city}
              >
                {city}
              </option>
            ))}
          </select>

          <select
            name="area"
            value={formData.area}
            onChange={handleChange}
            disabled={
              loading ||
              !formData.city
            }
            className="border p-3 rounded-xl disabled:bg-gray-100"
          >
            <option value="">
              Select Area
            </option>

            {areas.map(area => (
              <option
                key={area}
                value={area}
              >
                {area}
              </option>
            ))}
          </select>

          <input
            name="shop_no"
            value={formData.shop_no}
            onChange={handleChange}
            disabled={loading}
            placeholder="Shop No"
            className="border p-3 rounded-xl"
          />

          <input
            name="street_no"
            value={formData.street_no}
            onChange={handleChange}
            disabled={loading}
            placeholder="Street No"
            className="border p-3 rounded-xl"
          />

          <input
            name="block_no"
            value={formData.block_no}
            onChange={handleChange}
            disabled={loading}
            placeholder="Block No"
            className="border p-3 rounded-xl"
          />
        </div>

        <div className="h-[400px] mt-6 rounded-xl overflow-hidden border">
          <APIProvider
            apiKey={
              GOOGLE_MAPS_API_KEY
            }
          >
            {validMapPosition && (
              <Map
                defaultZoom={15}
                center={{
                  lat: latitude,
                  lng: longitude
                }}
                mapId="593aaf660a6f150a749bed3e"
                onClick={
                  handleMapClick
                }
                gestureHandling="greedy"
              >
                <PlaceAutocomplete
                  onPlaceSelect={
                    handlePlaceSelect
                  }
                />

                <AdvancedMarker
                  draggable
                  position={{
                    lat: latitude,
                    lng: longitude
                  }}
                  onDragEnd={
                    handleMarkerDrag
                  }
                />
              </Map>
            )}
          </APIProvider>
        </div>

        <div className="mt-3 grid md:grid-cols-2 gap-3">
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
            <span className="font-medium">
              Latitude:
            </span>{" "}
            {validMapPosition
              ? latitude.toFixed(6)
              : "Not selected"}
          </div>

          <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
            <span className="font-medium">
              Longitude:
            </span>{" "}
            {validMapPosition
              ? longitude.toFixed(6)
              : "Not selected"}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="
              px-4 py-2
              border
              rounded-xl
              disabled:opacity-60
              disabled:cursor-not-allowed
            "
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={save}
            disabled={loading}
            className="
              px-4 py-2
              bg-blue-600
              text-white
              rounded-xl
              disabled:opacity-60
              disabled:cursor-not-allowed
            "
          >
            {loading
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
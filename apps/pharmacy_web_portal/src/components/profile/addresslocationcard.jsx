import {
  MapPin,
  Building2,
  Navigation,
  Pencil
} from "lucide-react";

import {
  APIProvider,
  Map,
  AdvancedMarker
} from "@vis.gl/react-google-maps";

const GOOGLE_MAPS_API_KEY =process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

function Info({ icon, label, value }) {
  return (
    <div className="bg-gray-50 border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs uppercase text-gray-500">
          {label}
        </span>
      </div>

      <p className="font-semibold text-gray-800">
        {value || "-"}
      </p>
    </div>
  );
}

export default function AddressLocationCard({
  profile,
  onEdit
}) {
  const lat = Number(profile.map_lat);
  const lng = Number(profile.map_lng);

  return (
    <div className="bg-white rounded-2xl border shadow-sm">

      <div className="flex justify-between items-center p-6 border-b">

        <div>
          <h2 className="text-xl font-semibold">
            Address & Location
          </h2>

          <p className="text-sm text-gray-500">
            Pharmacy address information
          </p>
        </div>

        <button
          onClick={onEdit}
          className="
            flex items-center gap-2
            bg-blue-600 text-white
            px-4 py-2 rounded-xl
          "
        >
          <Pencil size={16}/>
          Edit
        </button>

      </div>

      <div className="p-6">

        <div className="grid md:grid-cols-2 gap-4 mb-6">

          <Info
            icon={<MapPin size={16}/>}
            label="Province"
            value={profile.province}
          />

          <Info
            icon={<MapPin size={16}/>}
            label="City"
            value={profile.city}
          />

          <Info
            icon={<MapPin size={16}/>}
            label="Area"
            value={profile.area}
          />

          <Info
            icon={<Building2 size={16}/>}
            label="Shop No"
            value={profile.shop_no}
          />

          <Info
            icon={<Building2 size={16}/>}
            label="Street No"
            value={profile.street_no}
          />

          <Info
            icon={<Building2 size={16}/>}
            label="Block No"
            value={profile.block_no}
          />

        </div>

        {lat && lng && (

          <div>

            <div className="flex items-center gap-2 mb-3">

              <Navigation
                size={18}
                className="text-blue-600"
              />

              <h3 className="font-semibold">
                Pharmacy Location
              </h3>

            </div>

            <div className="h-[350px] rounded-xl overflow-hidden border">

              <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>

                <Map
                  defaultZoom={15}
                  center={{
                    lat,
                    lng
                  }}
                  mapId="593aaf660a6f150a749bed3e"
                >
                  <AdvancedMarker
                    position={{
                      lat,
                      lng
                    }}
                  />
                </Map>

              </APIProvider>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}
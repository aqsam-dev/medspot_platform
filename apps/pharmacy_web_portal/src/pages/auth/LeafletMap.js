import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

const LeafletMap = ({ location, setLocation }) => {
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      },
    });
    return null;
  };

  return (
    <MapContainer
      center={location || { lat: 24.8607, lng: 67.0011 }} // Default to Karachi
      zoom={13}
      style={{ height: "300px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler />
      {location && <Marker position={location} />}
    </MapContainer>
  );
};

export default LeafletMap;

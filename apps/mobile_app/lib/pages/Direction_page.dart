import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_polyline_points/flutter_polyline_points.dart';
import 'dart:async'; // Required for StreamSubscription

class PharmacyDirectionScreen extends StatefulWidget {
  const PharmacyDirectionScreen({super.key});

  @override
  State<PharmacyDirectionScreen> createState() =>
      _PharmacyDirectionScreenState();
}

class _PharmacyDirectionScreenState extends State<PharmacyDirectionScreen>
    with TickerProviderStateMixin {
  // Brand Colors
  static const Color primaryBlue = Color(0xFF2A4ECA);
  static const Color slate950 = Color(0xFF020617);
  static const Color slate900 = Color(0xFF0F172A);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate500 = Color(0xFF64748B);
  static const Color emerald = Color(0xFF10B981);

  late AnimationController _listController;
  GoogleMapController? _mapController;
  StreamSubscription<Position>? _positionStream; // To track live movement
  LatLng? _pharmacyPosition;
  String pharmacyName = "";
  LatLng? _currentPosition;
  List<LatLng> _polylineCoordinates = [];
  final PolylinePoints polylinePoints = PolylinePoints();
  final String googleApiKey = "Your Google API key";
  double? _distanceKm;
  int? _durationMinutes;
  String? _distanceText;
  String? _durationText;

  bool _argumentsLoaded = false;

  void _loadArguments() {
    if (_argumentsLoaded) return;

    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;

    print("Direction Args: $args");

    if (args != null) {
      final lat = args?["latitude"];
      final lng = args?["longitude"];

      if (lat != null && lng != null) {
        pharmacyName = args?["pharmacyName"] ?? "Pharmacy";

        _pharmacyPosition = LatLng(
          (lat as num).toDouble(),
          (lng as num).toDouble(),
        );
      }

      pharmacyName = args["pharmacyName"] ?? "Pharmacy";

      _pharmacyPosition = LatLng(lat, lng);
    }

    _argumentsLoaded = true;
  }

  @override
  void initState() {
    super.initState();
    _listController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _listController.forward();

    _startLiveTracking(); // Initialize location tracking
  }

  // Exact & Live Tracking Function
  void _startLiveTracking() async {
    bool serviceEnabled;
    LocationPermission permission;

    // Check if location services are enabled
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return;

    // Handle location permissions
    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return;
    }

    // Fetch initial exact location and move camera
    if (_pharmacyPosition != null) {
      _mapController?.animateCamera(
        CameraUpdate.newLatLngZoom(_pharmacyPosition!, 16.0),
      );
    }

    // Stream to update camera as the user moves
    _positionStream =
        Geolocator.getPositionStream(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            distanceFilter: 5,
          ),
        ).listen((Position position) {
          setState(() {
            _currentPosition = LatLng(position.latitude, position.longitude);
          });

          _mapController?.animateCamera(
            CameraUpdate.newLatLng(_currentPosition!),
          );

          _getRoute();
          _getDistanceAndDuration();
        });
  }

  Future<void> _getRoute() async {
    if (_currentPosition == null || _pharmacyPosition == null) return;

    PolylineRequest request = PolylineRequest(
      origin: PointLatLng(
        _currentPosition!.latitude,
        _currentPosition!.longitude,
      ),
      destination: PointLatLng(
        _pharmacyPosition!.latitude,
        _pharmacyPosition!.longitude,
      ),
      mode: TravelMode.driving,
    );

    PolylineResult result = await polylinePoints.getRouteBetweenCoordinates(
      googleApiKey: googleApiKey,
      request: request,
    );

    if (result.points.isNotEmpty) {
      _polylineCoordinates.clear();

      for (final point in result.points) {
        _polylineCoordinates.add(LatLng(point.latitude, point.longitude));
      }

      setState(() {});
    }
  }

  Future<void> _getDistanceAndDuration() async {
    if (_currentPosition == null || _pharmacyPosition == null) return;

    final url =
        "https://maps.googleapis.com/maps/api/directions/json"
        "?origin=${_currentPosition!.latitude},${_currentPosition!.longitude}"
        "&destination=${_pharmacyPosition!.latitude},${_pharmacyPosition!.longitude}"
        "&key=$googleApiKey";

    final response = await http.get(Uri.parse(url));

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);

      if (data["routes"].isNotEmpty) {
        final leg = data["routes"][0]["legs"][0];

        setState(() {
          _distanceText = leg["distance"]["text"];
          _durationText = leg["duration"]["text"];
        });
      }
    }
  }

  @override
  void dispose() {
    _listController.dispose();
    _positionStream?.cancel(); // Cancel stream to prevent memory leaks
    super.dispose();
  }

  // Professional Dark Map Configuration
  final String _darkMapStyle = '''[
    {"elementType": "geometry", "stylers": [{"color": "#242f3e"}]},
    {"elementType": "labels.text.stroke", "stylers": [{"color": "#242f3e"}]},
    {"elementType": "labels.text.fill", "stylers": [{"color": "#746855"}]},
    {"featureType": "road", "elementType": "geometry", "stylers": [{"color": "#38414e"}]},
    {"featureType": "water", "elementType": "geometry", "stylers": [{"color": "#17263c"}]}
  ]''';

  @override
  Widget build(BuildContext context) {
    _loadArguments();
    final bool isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? slate950 : Colors.white,
      body: Column(
        children: [
          // Map Section
          Expanded(
            flex: 5,
            child: Stack(
              children: [
                GoogleMap(
                  initialCameraPosition: CameraPosition(
                    target: _pharmacyPosition ?? const LatLng(31.4826, 74.3051),
                    zoom: 15,
                  ),
                  mapType: MapType.normal,
                  myLocationEnabled: true,
                  myLocationButtonEnabled:
                      false, // Custom button provided in Action Panel
                  zoomControlsEnabled: false,
                  onMapCreated: (controller) {
                    _mapController = controller;

                    if (isDark) {
                      _mapController?.setMapStyle(_darkMapStyle);
                    }

                    if (_pharmacyPosition != null) {
                      controller.animateCamera(
                        CameraUpdate.newLatLngZoom(_pharmacyPosition!, 15),
                      );
                    }
                  },
                  polylines: {
                    Polyline(
                      polylineId: const PolylineId("route"),
                      points: _polylineCoordinates,
                      color: Colors.blue,
                      width: 6,
                    ),
                  },
                  markers: {
                    if (_pharmacyPosition != null)
                      Marker(
                        markerId: const MarkerId('pharmacy'),
                        position: _pharmacyPosition!,
                        infoWindow: InfoWindow(title: pharmacyName),
                      ),

                    if (_currentPosition != null)
                      Marker(
                        markerId: const MarkerId('user'),
                        position: _currentPosition!,
                        icon: BitmapDescriptor.defaultMarkerWithHue(
                          BitmapDescriptor.hueAzure,
                        ),
                        infoWindow: const InfoWindow(title: "You"),
                      ),
                  },
                ),

                _buildBackArrow(context, isDark),
                _buildPharmacyFloatingCard(isDark),
              ],
            ),
          ),

          // Navigation Steps Section
          _buildActionPanel(isDark),
        ],
      ),
    );
  }

  // --- UI Build Methods ---

  Widget _animateItem(int index, Widget child) {
    return FadeTransition(
      opacity: CurvedAnimation(
        parent: _listController,
        curve: Interval(index * 0.1, 1.0, curve: Curves.easeIn),
      ),
      child: child,
    );
  }

  Widget _buildHeaderRow(bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          "Navigation",
          style: GoogleFonts.plusJakartaSans(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : slate900,
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: emerald.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Text(
            "LIVE",
            style: TextStyle(
              color: emerald,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStep(
    bool isDark,
    IconData icon,
    Color color,
    String title,
    String sub,
    bool isLast,
  ) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 40,
                color: isDark ? slate800 : Colors.grey[200],
              ),
          ],
        ),
        const SizedBox(width: 15),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.plusJakartaSans(
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : slate900,
                ),
              ),
              Text(
                sub,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 12,
                  color: slate500,
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActionPanel(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      color: isDark ? slate950 : Colors.white,
      child: ElevatedButton(
        onPressed: () {
          if (_currentPosition != null) {
            _mapController?.animateCamera(
              CameraUpdate.newCameraPosition(
                CameraPosition(target: _currentPosition!, zoom: 17),
              ),
            );
          }
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryBlue,
          minimumSize: const Size(double.infinity, 60),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
        ),
        child: const Text(
          "RE-CENTER MAP",
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Widget _buildBackArrow(BuildContext context, bool isDark) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          style: IconButton.styleFrom(
            backgroundColor: isDark ? slate800 : Colors.white,
            foregroundColor: isDark ? Colors.white : slate900,
          ),
        ),
      ),
    );
  }

  Widget _buildPharmacyFloatingCard(bool isDark) {
    return Positioned(
      bottom: 20,
      left: 20,
      right: 20,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? slate800 : Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 15),
          ],
        ),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: primaryBlue,
              child: Icon(Icons.local_pharmacy, color: Colors.white),
            ),
            SizedBox(width: 15),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    pharmacyName,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),

                  const SizedBox(height: 4),

                  const Text(
                    "Tracking Enabled",
                    style: TextStyle(color: emerald, fontSize: 12),
                  ),

                  if (_distanceText != null)
                    Text(_distanceText!, style: const TextStyle(fontSize: 12)),

                  if (_durationText != null)
                    Text(
                      "ETA: $_durationText",
                      style: const TextStyle(fontSize: 12),
                    ),
                ],
              ),
            ),
            Icon(Icons.gps_fixed, color: primaryBlue),
          ],
        ),
      ),
    );
  }
}

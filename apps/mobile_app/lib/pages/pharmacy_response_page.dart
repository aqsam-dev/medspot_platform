import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:medspot/services/patient_api.dart';

class PharmacyResponseScreen extends StatefulWidget {
  final String prescriptionId;
  final String prescriptionImage;

  const PharmacyResponseScreen({
    super.key,
    required this.prescriptionId,
    required this.prescriptionImage,
  });

  @override
  State<PharmacyResponseScreen> createState() => _PharmacyResponseScreenState();
}

class _PharmacyResponseScreenState extends State<PharmacyResponseScreen> {
  String prescriptionImage = "";
  int? pharmacyId;
  String pharmacyName = "";
  String distanceKm = "";
  double? pharmacyLat;
  double? pharmacyLng;
  bool responseExpired = false;

  @override
  void initState() {
    super.initState();
    loadResponse();
  }

  List<dynamic> medicines = [];
  bool loading = true;
  final Map<String, bool> _selectedMedicines = {};
  final Map<String, int> _medicineStrips = {};
  final Map<String, double> _medicinePrices = {};

  Future<void> loadResponse() async {
    try {
      final data = await PatientApi.getPrescriptionResponses(
        widget.prescriptionId,
      );
      if (data["data"] != null &&
    (data["data"] as List).isEmpty) {
  setState(() {
    responseExpired = true;
    loading = false;
  });
  return;
}

setState(() {
  medicines = data["medicines"] ?? [];

  pharmacyId = data["response"]?["pharmacy_id"];

  prescriptionImage = data["image_url"] ?? "";
  pharmacyName = data["pharmacy_name"] ?? "";
  distanceKm = data["distance_km"]?.toString() ?? "";

  pharmacyLat =
      (data["response"]?["map_lat"] as num?)?.toDouble();

  pharmacyLng =
      (data["response"]?["map_lng"] as num?)?.toDouble();

  loading = false;
});

      for (final med in medicines) {
        _selectedMedicines[med["medicine_name"]] =
            med["status"] != "unavailable";

        _medicineStrips[med["medicine_name"]] = med["quantity"] ?? 1;

        _medicinePrices[med["medicine_name"]] =
            double.tryParse(med["price"].toString()) ?? 0;
      }
    } catch (e) {
      print(e);

      setState(() {
        loading = false;
      });
    }
  }

  // Notification State Variables
  String? _topMessage;
  bool _isNotificationError = false;

  // Static Theme Colors
  static const Color brandBlue = Color(0xFF2A4ECA);
  static const Color successGreen = Color(0xFF10B981);
  static const Color errorRed = Color(0xFFEF4444);
  static const Color slate900 = Color(0xFF0F172A);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate500 = Color(0xFF64748B);
  static const Color slate50 = Color(0xFFF8FAFC);

  // Dynamic selection calculations
  int get _selectedCount =>
      _selectedMedicines.values.where((v) => v == true).length;
  int get _totalAvailableCount => _selectedMedicines.length;

  double get _calculateTotalAmount {
    double total = 0.0;
    _selectedMedicines.forEach((key, isSelected) {
      if (isSelected) {
        int strips = _medicineStrips[key] ?? 1;
        total += (_medicinePrices[key] ?? 0.0) * strips;
      }
    });
    return total;
  }

  // Notification Functionality
  void _showTopNotification(String message, {bool isError = false}) {
    if (!mounted) return;
    setState(() {
      _topMessage = message;
      _isNotificationError = isError;
    });
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _topMessage = null);
    });
  }

  // Pop-out Dialog for Confirmation
  void _showConfirmDialog() {
    if (_selectedCount == 0) {
      _showTopNotification(
        "Please select at least one medicine to reserve.",
        isError: true,
      );
      return;
    }

    final String confirmationText = _selectedCount == _totalAvailableCount
        ? "Do you want to confirm all medicine reservations?"
        : "Do you want to confirm the reservation for $_selectedCount selected items?";

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: Text(
            "Confirm Reservation",
            style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.bold),
          ),
          content: Text(confirmationText, style: GoogleFonts.plusJakartaSans()),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/prescription');
              },
              child: Text(
                "No",
                style: TextStyle(color: errorRed, fontWeight: FontWeight.bold),
              ),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: brandBlue,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              onPressed: () {
                Navigator.pop(context);
                _finalizeOrder();
              },
              child: const Text("Yes", style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );
  }

  // Full-screen Prescription Image Viewer Dialog
  void _showPrescriptionViewer() {
    if (prescriptionImage.isEmpty) {
      _showTopNotification("Prescription image not found", isError: true);
      return;
    }

    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          backgroundColor: Colors.transparent,
          child: InteractiveViewer(
            child: Image.network(
              prescriptionImage,
              fit: BoxFit.contain,
              errorBuilder: (context, error, stackTrace) {
                return const Center(
                  child: Text(
                    "Failed to load prescription image",
                    style: TextStyle(color: Colors.white),
                  ),
                );
              },
            ),
          ),
        );
      },
    );
  }
Future<void> _finalizeOrder() async {
  // Safety check
  if (pharmacyId == null) {
    _showTopNotification(
      "Pharmacy information not found.",
      isError: true,
    );
    return;
  }

  try {
    final List<Map<String, dynamic>> selectedItems = [];

    for (final med in medicines) {
      final String name = med["medicine_name"];

      if (_selectedMedicines[name] == true) {
        selectedItems.add({
          "medicine_name": name,
          "quantity": _medicineStrips[name] ?? 1,
            "price": _medicinePrices[name] ?? 0,
  "subtotal":
      (_medicinePrices[name] ?? 0) *
      (_medicineStrips[name] ?? 1),
        });
      }
    }

    // Extra safety check
    if (selectedItems.isEmpty) {
      _showTopNotification(
        "Please select at least one medicine.",
        isError: true,
      );
      return;
    }

    print("Creating reservation...");
    print("Pharmacy ID: $pharmacyId");
    print("Items: $selectedItems");

    final response = await PatientApi.createReservation(
      pharmacyId: pharmacyId!,
      reservationType: "PRESCRIPTION",
      items: selectedItems,
    );

    print("Reservation Response:");
    print(response);

    _showTopNotification(
      "Reservation Confirmed!",
    );

    Future.delayed(const Duration(seconds: 1), () {
      if (!mounted) return;

      Navigator.pushNamedAndRemoveUntil(
        context,
        "/reservation",
        (route) => false,
        arguments: response["reservation_id"],
      );
    });
  } catch (e, stackTrace) {
    print("ERROR: $e");
    print("STACK TRACE:");
    print(stackTrace);

    _showTopNotification(
      e.toString(),
      isError: true,
    );
  }
}

  @override
  Widget build(BuildContext context) {
    if (responseExpired) {
  return Scaffold(
    appBar: AppBar(
      title: const Text("Prescription Response"),
    ),
    body: const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.access_time,
            size: 70,
            color: Colors.grey,
          ),
          SizedBox(height: 16),
          Text(
            "This prescription response has expired.",
            style: TextStyle(fontSize: 16),
          ),
        ],
      ),
    ),
  );
}

    if (loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    final Color bgColor = isDark ? slate900 : slate50;
    final Color surfaceColor = isDark ? slate800 : Colors.white;
    final Color textColor = isDark ? Colors.white : slate900;

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios_new_rounded,
            color: textColor,
            size: 20,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          "Review Order",
          style: GoogleFonts.plusJakartaSans(
            color: textColor,
            fontWeight: FontWeight.w800,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),
      bottomNavigationBar: _buildBottomCheckout(isDark, surfaceColor),
      body: Stack(
        children: [
          SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Column(
              crossAxisAlignment:
                  CrossAxisAlignment.start, // Fixed typo error here
              children: [
                _buildPharmacyInfo(isDark, surfaceColor, textColor),
                _buildOrderTimeline(isDark, textColor),
                _buildMedicineList(isDark, surfaceColor, textColor),
                const SizedBox(height: 24),
              ],
            ),
          ),
          if (_topMessage != null)
            Positioned(
              top: 10,
              left: 20,
              right: 20,
              child: GestureDetector(
                onHorizontalDragEnd: (details) =>
                    setState(() => _topMessage = null),
                child: _buildTopNotificationUI(),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTopNotificationUI() {
    final Color barColor = _isNotificationError
        ? Colors.redAccent
        : successGreen;
    return Material(
      color: Colors.transparent,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: barColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: barColor.withOpacity(0.3),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Icon(
              _isNotificationError
                  ? Icons.error_outline
                  : Icons.check_circle_outline,
              color: Colors.white,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                _topMessage!,
                style: GoogleFonts.plusJakartaSans(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- UI COMPONENTS ---

  Widget _buildPharmacyInfo(bool isDark, Color surface, Color text) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.3 : 0.05),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 25,
            backgroundColor: brandBlue.withOpacity(0.1),
            child: const Icon(Icons.local_pharmacy_rounded, color: brandBlue),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  pharmacyName.isEmpty ? "Loading Pharmacy..." : pharmacyName,
                  style: GoogleFonts.plusJakartaSans(
                    fontWeight: FontWeight.w800,
                    fontSize: 17,
                    color: text,
                  ),
                ),

                Text(
                  distanceKm.isEmpty
                      ? "Verified Partner"
                      : "Verified Partner • $distanceKm km",
                  style: GoogleFonts.plusJakartaSans(
                    color: slate500,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(
              Icons.directions_rounded,
              color: brandBlue,
              size: 28,
            ),
            onPressed: () {
          
    print("LAT => $pharmacyLat");
    print("LNG => $pharmacyLng");

              Navigator.pushNamed(
                context,
                '/Direction',
                arguments: {
                  "latitude": pharmacyLat,
                  "longitude": pharmacyLng,
                  "pharmacyName": pharmacyName,
                },
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildOrderTimeline(bool isDark, Color text) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      child: Column(
        children: [
          _timelineRow("Request Sent", "10:30 AM", true, text),
          const SizedBox(height: 6),
          _timelineRow("Pharmacy Response", "10:45 AM", true, text),
          const SizedBox(height: 6),
          _timelineRow("Awaiting Confirmation", "Now", false, text),
        ],
      ),
    );
  }

  Widget _timelineRow(String title, String time, bool isDone, Color text) {
    return Row(
      children: [
        Icon(
          isDone
              ? Icons.check_circle_rounded
              : Icons.radio_button_unchecked_rounded,
          color: isDone ? successGreen : brandBlue,
          size: 20,
        ),
        const SizedBox(width: 12),
        Text(
          title,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 13,
            color: isDone ? text : slate500,
            fontWeight: isDone ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
        const Spacer(),
        Text(
          time,
          style: GoogleFonts.plusJakartaSans(fontSize: 11, color: slate500),
        ),
      ],
    );
  }

  Widget _buildMedicineList(bool isDark, Color surface, Color text) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 20, 16, 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Inventory Result",
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: text,
                ),
              ),
              TextButton(
                onPressed: _showPrescriptionViewer,
                style: TextButton.styleFrom(
                  minimumSize: Size.zero,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  "View Prescription",
                  style: GoogleFonts.plusJakartaSans(
                    color: brandBlue,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    decoration: TextDecoration.underline,
                  ),
                ),
              ),
            ],
          ),
        ),
        ...medicines.map((med) {
          Color statusColor;

          switch (med["status"]) {
            case "available":
              statusColor = successGreen;
              break;

            case "alternative":
              statusColor = brandBlue;
              break;

            default:
              statusColor = errorRed;
          }

          return _medicineCard(
            med["medicine_name"],
            med["status"].toUpperCase(),
            statusColor,
            "Rs. ${med["price"]}",
            isDark,
            surface,
            text,
            substitutedFor: med["alternative_for"],
            isGrey: med["status"] == "unavailable",
          );
        }).toList(),
      ],
    );
  }

  Widget _medicineCard(
    String name,
    String status,
    Color sColor,
    String price,
    bool isDark,
    Color surface,
    Color text, {
    bool isGrey = false,
    String? substitutedFor,
  }) {
    final bool isSelected = _selectedMedicines[name] ?? false;
    final int currentStrips = _medicineStrips[name] ?? 1;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
      padding: const EdgeInsets.all(16),
      constraints: const BoxConstraints(minHeight: 92),
      decoration: BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.15 : 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(
          color: isGrey
              ? Colors.transparent
              : (isSelected
                    ? sColor.withOpacity(0.4)
                    : sColor.withOpacity(0.1)),
          width: isSelected ? 1.5 : 1.0,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (substitutedFor != null) ...[
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text(
                        substitutedFor,
                        style: GoogleFonts.plusJakartaSans(
                          fontWeight: FontWeight.w500,
                          color: slate500,
                          fontSize: 12,
                          decoration: TextDecoration.lineThrough,
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 4),
                        child: Icon(
                          Icons.arrow_right_alt_rounded,
                          color: brandBlue,
                          size: 16,
                        ),
                      ),
                      Expanded(
                        child: Text(
                          name,
                          style: GoogleFonts.plusJakartaSans(
                            fontWeight: FontWeight.bold,
                            color: isGrey ? slate500 : text,
                            fontSize: 14,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ] else ...[
                  Text(
                    name,
                    style: GoogleFonts.plusJakartaSans(
                      fontWeight: FontWeight.w700,
                      color: isGrey ? slate500 : text,
                      fontSize: 14,
                    ),
                  ),
                ],
                const SizedBox(height: 6),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: sColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(5),
                      ),
                      child: Text(
                        status,
                        style: GoogleFonts.plusJakartaSans(
                          color: sColor,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      isSelected
                          ? "Rs. ${((_medicinePrices[name] ?? 0) * currentStrips).toStringAsFixed(0)}"
                          : price,
                      style: GoogleFonts.plusJakartaSans(
                        fontWeight: FontWeight.w700,
                        color: isGrey ? slate500 : brandBlue,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),

          isGrey
              ? Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white10 : Colors.black45,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    "Unavailable",
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 12,
                      color: slate500,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                )
              : Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (isSelected) ...[
                      IconButton(
                        constraints: const BoxConstraints(),
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        icon: Icon(
                          Icons.remove_circle_outline_rounded,
                          color: currentStrips > 1 ? brandBlue : slate500,
                          size: 24,
                        ),
                        onPressed: () {
                          if (currentStrips > 1) {
                            setState(() {
                              _medicineStrips[name] = currentStrips - 1;
                            });
                          }
                        },
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        child: Text(
                          "$currentStrips",
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: text,
                          ),
                        ),
                      ),
                      IconButton(
                        constraints: const BoxConstraints(),
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        icon: Icon(
                          Icons.add_circle_outline_rounded,
                          color: currentStrips < 3 ? brandBlue : slate500,
                          size: 24,
                        ),
                        onPressed: () {
                          if (currentStrips < 3) {
                            setState(() {
                              _medicineStrips[name] = currentStrips + 1;
                            });
                          } else {
                            _showTopNotification(
                              "Maximum limit is 3 items.",
                              isError: true,
                            );
                          }
                        },
                      ),
                      const SizedBox(width: 8),
                    ],

                    InkWell(
                      onTap: () {
                        setState(() {
                          _selectedMedicines[name] = !isSelected;
                          if (!isSelected) {
                            _medicineStrips[name] = 1;
                          }
                        });
                      },
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 10,
                        ),
                      decoration: BoxDecoration(
  color: isSelected ? errorRed : Colors.transparent,
  borderRadius: BorderRadius.circular(12),
  border: Border.all(
    color: isSelected ? errorRed : brandBlue,
    width: 1.5,
  ),
),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (isSelected)
                              const Icon(
                                Icons.close_rounded,
                                color: Colors.white,
                                size: 16,
                              )
                            else
                              Text(
                                "Reserve",
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: brandBlue,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
        ],
      ),
    );
  }

  Widget _buildBottomCheckout(bool isDark, Color surface) {
    String actionLabel = "RESERVE ALL";
    if (_selectedCount == 0) {
      actionLabel = "SELECT MEDICINES";
    } else if (_selectedCount < _totalAvailableCount) {
      actionLabel = "RESERVE SELECTED ($_selectedCount)";
    }

    return Container(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 30),
      decoration: BoxDecoration(
        color: surface,
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 20),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Total Amount",
                style: GoogleFonts.plusJakartaSans(
                  color: slate500,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                "Rs. ${_calculateTotalAmount.toStringAsFixed(2)}",
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: brandBlue,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 55,
            child: ElevatedButton(
              onPressed: _selectedCount > 0 ? _showConfirmDialog : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: brandBlue,
                disabledBackgroundColor: isDark
                    ? Colors.white10
                    : Colors.black12,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(15),
                ),
                elevation: 0,
              ),
              child: Text(
                actionLabel,
                style: GoogleFonts.plusJakartaSans(
                  fontWeight: FontWeight.w800,
                  color: _selectedCount > 0 ? Colors.white : slate500,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

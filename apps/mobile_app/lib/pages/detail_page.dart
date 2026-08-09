import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:medspot/services/patient_api.dart';

class PharmacyDetailsScreen extends StatefulWidget {
  final Map<String, dynamic> pharmacy;

  const PharmacyDetailsScreen({super.key, required this.pharmacy});

  @override
  State<PharmacyDetailsScreen> createState() => _PharmacyDetailsScreenState();
}

class _PharmacyDetailsScreenState extends State<PharmacyDetailsScreen> {
  // --- Theme Constants ---
  static const Color primaryBlue = Color(0xFF2A4ECA);
  static const Color slate950 = Color(0xFF020617);
  static const Color slate900 = Color(0xFF0F172A);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate400 = Color(0xFF94A3B8);
  static const Color slate500 = Color(0xFF64748B);

  @override
  void initState() {
    super.initState();
    print(widget.pharmacy); // <-- ADD THIS

    medicines = List<Map<String, dynamic>>.from(
      widget.pharmacy['medicines'] ?? [],
    );
    for (var medicine in medicines) {
      medicine['selected'] = false;
      medicine['quantity'] = 1;
    }

    alternativeMedicines = List<Map<String, dynamic>>.from(
      widget.pharmacy['alternative_medicines'] ?? [],
    );

    for (var medicine in alternativeMedicines) {
      medicine['selected'] = false;
      medicine['quantity'] = 1;
    }
  }

  List<Map<String, dynamic>> medicines = [];
  List<Map<String, dynamic>> alternativeMedicines = [];
  bool _isSubmitting = false;

  Future<void> _executeReservation() async {
    setState(() => _isSubmitting = true);

    final List<Map<String, dynamic>> selectedItemsPayload = [];
    final allMedicines = [...medicines, ...alternativeMedicines];

    for (var med in allMedicines) {
      if (med['selected'] == true) {
      selectedItemsPayload.add({
  "external_medicine_id":
      med["external_medicine_id"],

  "medicine_name":
      med["brand_name"],

  "quantity":
      med["quantity"] ?? 1,

"unit_price":
      double.parse(
        med["price"].toString()
      ),
});
      }
    }

    final int pharmacyId =
        widget.pharmacy['pharmacy_id'] ?? widget.pharmacy['id'] ?? 0;

    try {
      final response = await PatientApi.createReservation(
        pharmacyId: pharmacyId,
        items: selectedItemsPayload,
        reservationType: "SEARCH",
      );

      print("RESERVATION RESPONSE:");
print(response);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Reservation secured for 15 minutes!')),
        );
        Navigator.pushNamed(
          context,
          '/reservation',
          arguments: response["reservation_id"],
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Reservation Failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

int get selectedCount =>
    [...medicines, ...alternativeMedicines]
        .where((m) => m['selected'] == true)
        .length;

int get totalAvailableCount =>
    medicines.length + alternativeMedicines.length;

  @override
  Widget build(BuildContext context) {
    // Check if the system is in Dark Mode
    final bool isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? slate950 : Colors.white,
      body: Stack(
        children: [
          /// Main Scrollable View
          SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(context, isDark),
                _buildDetailsCard(isDark),
                const SizedBox(height: 12),
                _buildMedicinesSection(isDark),
                const SizedBox(height: 20),
                _buildAlternativeMedicinesSection(isDark),
                const SizedBox(
                  height: 120,
                ), // Extra space for bottom fixed action bar
              ],
            ),
          ),

          /// Fixed Bottom Navigation/Action Bar
          _buildBottomAction(context, isDark),
        ],
      ),
    );
  }

  /// Displays a confirmation dialog before navigating to the reservation page
  void _showConfirmationDialog(BuildContext context, bool isDark) {
    String confirmationText = selectedCount == totalAvailableCount
        ? "Are you sure you want to confirm all medicine reservations?"
        : "Are you sure you want to confirm the reservation for $selectedCount selected items?";

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: isDark ? slate900 : Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          title: Text(
            "Confirm Reservation",
            style: GoogleFonts.manrope(
              fontWeight: FontWeight.w800,
              color: isDark ? Colors.white : slate900,
            ),
          ),
          content: Text(
            confirmationText,
            style: GoogleFonts.manrope(
              color: isDark ? slate400 : slate500,
              fontWeight: FontWeight.w500,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(
                "Cancel",
                style: GoogleFonts.manrope(
                  color: slate500,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            ElevatedButton(
              onPressed: _isSubmitting
                  ? null
                  : () {
                      Navigator.pop(context); // Close the dialog
                      _executeReservation(); // Navigate to reservation
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryBlue,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                "Yes",
                style: GoogleFonts.manrope(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  /// Top Image Header with Back Button
  Widget _buildHeader(BuildContext context, bool isDark) {
    return Stack(
      children: [
        Container(
          height: 300,
          width: double.infinity,
          decoration: const BoxDecoration(
            image: DecorationImage(
              image: NetworkImage(
                "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?q=80&w=1000",
              ),
              fit: BoxFit.cover,
            ),
          ),
        ),
        Container(
          height: 340,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                primaryBlue.withOpacity(0.6),
                Colors.transparent,
                isDark
                    ? slate950.withOpacity(0.8)
                    : Colors.black.withOpacity(0.4),
              ],
            ),
          ),
        ),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: isDark ? slate800 : Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.2),
                      blurRadius: 10,
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.arrow_back_ios_new_rounded,
                  color: primaryBlue,
                  size: 20,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  /// Main Information Card
  Widget _buildDetailsCard(bool isDark) {
    return Transform.translate(
      offset: const Offset(0, -50),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: isDark ? slate900 : Colors.white,
            borderRadius: BorderRadius.circular(32),
            boxShadow: [
              BoxShadow(
                color: primaryBlue.withOpacity(isDark ? 0.2 : 0.08),
                blurRadius: 40,
                offset: const Offset(0, 15),
              ),
            ],
            border: Border.all(
              color: isDark ? slate800 : const Color(0xFFF1F5F9),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    widget.pharmacy['pharmacy_name'] ?? '',
                    style: GoogleFonts.manrope(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : slate900,
                    ),
                  ),
                  _buildBadge(
                    widget.pharmacy['is_open'] == true ? "Open Now" : "Closed",
                  ),
                ],
              ),
              const SizedBox(height: 10),
              _buildRatingRow(isDark),
              const SizedBox(height: 30),
              _buildInfoItem(
                isDark,
                Icons.location_on_rounded,
                "ADDRESS",
                "Shop #${widget.pharmacy['shop_no'] ?? 'N/A'}, "
                    "Street #${widget.pharmacy['street_no'] ?? 'N/A'}, "
                    "Block #${widget.pharmacy['block_no'] ?? 'N/A'}, "
                    " ${widget.pharmacy['area'] ?? 'N/A'}, "
                    "${widget.pharmacy['city'] ?? 'N/A'}",
                "${((widget.pharmacy['distance'] ?? 0) as num).toStringAsFixed(1)} km away",
              ),
              const SizedBox(height: 24),
              Divider(
                height: 48,
                color: isDark ? slate800 : const Color(0xFFF1F5F9),
                thickness: 1.5,
              ),
              _buildOpeningHours(isDark),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBadge(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: primaryBlue.withOpacity(0.1),
        borderRadius: BorderRadius.circular(100),
      ),
      child: Text(
        label,
        style: GoogleFonts.manrope(
          color: primaryBlue,
          fontSize: 12,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }

  Widget _buildRatingRow(bool isDark) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: isDark
                ? Colors.orange.withOpacity(0.1)
                : const Color(0xFFFFF7ED),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              const Icon(
                Icons.star_rounded,
                color: Color(0xFFF59E0B),
                size: 18,
              ),
              const SizedBox(width: 4),
              Text(
                "${widget.pharmacy['rating'] ?? 0}",
                style: GoogleFonts.manrope(
                  fontWeight: FontWeight.w800,
                  fontSize: 14,
                  color: const Color(0xFFF59E0B),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Text(
          "(${widget.pharmacy['reviews_count'] ?? 0} reviews)",
          style: GoogleFonts.manrope(
            color: slate500,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildInfoItem(
    bool isDark,
    IconData icon,
    String label,
    String value,
    String? dist,
  ) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: primaryBlue.withOpacity(0.1),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Icon(icon, color: primaryBlue, size: 24),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.manrope(
                  color: slate400,
                  fontSize: 10,
                  letterSpacing: 1.5,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                value,
                style: GoogleFonts.manrope(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white : slate800,
                ),
              ),
              if (dist != null)
                Text(
                  dist,
                  style: GoogleFonts.manrope(
                    color: primaryBlue,
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildOpeningHours(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.schedule_rounded, color: primaryBlue, size: 20),
            const SizedBox(width: 12),
            Text(
              "Opening Hours",
              style: GoogleFonts.manrope(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : slate900,
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        ...(widget.pharmacy['opening_hours'] ?? []).map<Widget>((hour) {
          return _buildTimelineItem(
            isDark,
            hour['day'],
            hour['time'],
            hour['is_today'] == true,
          );
        }).toList(),
      ],
    );
  }

  Widget _buildTimelineItem(bool isDark, String day, String time, bool active) {
    return IntrinsicHeight(
      child: Row(
        children: [
          const SizedBox(width: 7),
          Column(
            children: [
              Container(
                width: 14,
                height: 14,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: active
                      ? primaryBlue
                      : (isDark ? slate800 : Colors.white),
                  border: Border.all(
                    color: active ? primaryBlue : slate400,
                    width: 3,
                  ),
                ),
              ),
              Expanded(
                child: Container(
                  width: 2,
                  color: isDark ? slate800 : const Color(0xFFF1F5F9),
                ),
              ),
            ],
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 24),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    day,
                    style: GoogleFonts.manrope(
                      fontWeight: active ? FontWeight.w800 : FontWeight.w500,
                      color: active
                          ? (isDark ? Colors.white : slate800)
                          : slate500,
                    ),
                  ),
                  Text(
                    time,
                    style: GoogleFonts.manrope(
                      fontWeight: active ? FontWeight.w800 : FontWeight.w500,
                      color: active ? primaryBlue : slate500,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// --- AVAILABLE MEDICINES SECTION ---
  Widget _buildMedicinesSection(bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Available Medicines",
            style: GoogleFonts.manrope(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: isDark ? Colors.white : slate900,
            ),
          ),
          const SizedBox(height: 12),
          Column(
            children: medicines.map((medicine) {
              return _buildMedicineCard(medicine, isDark);
            }).toList(),
          ),
        ],
      ),
    );
  }

  /// --- AVAILABLE MEDICINES SECTION ---
  Widget _buildAlternativeMedicinesSection(bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Alternative Medicines",
            style: GoogleFonts.manrope(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: isDark ? Colors.white : slate900,
            ),
          ),
          const SizedBox(height: 12),
          Column(
            children: alternativeMedicines.map((medicine) {
              return _buildMedicineCard(medicine, isDark);
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildMedicineCard(Map<String, dynamic> medicine, bool isDark) {
    final bool isSelected = medicine['selected'];
    final int quantity = medicine['quantity'];
    final double basePrice = ((medicine['price'] ?? 0) as num).toDouble();
    final double totalPrice = basePrice * quantity;

    final Color cardBackground = isDark ? slate900 : Colors.white;
    final Color textMainColor = isDark ? Colors.white : slate900;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBackground,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isSelected
              ? primaryBlue.withOpacity(0.5)
              : (isDark ? slate800 : const Color(0xFFE2E8F0)),
          width: isSelected ? 1.5 : 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.1 : 0.02),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Medicine Info Left Side
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  medicine['brand_name'] ?? '',
                  style: GoogleFonts.manrope(
                    fontWeight: FontWeight.w700,
                    color: textMainColor,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  "Rs. ${totalPrice.toStringAsFixed(0)}",
                  style: GoogleFonts.manrope(
                    fontWeight: FontWeight.w800,
                    color: primaryBlue,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),

          // Custom Sleek Elements Right Side
          Row(
            children: [
              if (isSelected) ...[
                // Clean Minus Icon Button
                IconButton(
                  constraints: const BoxConstraints(),
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  icon: Icon(
                    Icons.remove_circle_outline_rounded,
                    color: quantity > 1 ? primaryBlue : slate500,
                    size: 24,
                  ),
                  onPressed: () {
                    if (quantity > 1) {
                      setState(() {
                        medicine['quantity']--;
                      });
                    }
                  },
                ),
                // Pure Numeric State Tracker
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Text(
                    "$quantity",
                    style: GoogleFonts.manrope(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: textMainColor,
                    ),
                  ),
                ),
                // Clean Plus Icon Button
                IconButton(
                  constraints: const BoxConstraints(),
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  icon: const Icon(
                    Icons.add_circle_outline_rounded,
                    color: primaryBlue,
                    size: 24,
                  ),
                  onPressed: () {
                    if (quantity < 3) {
                      setState(() {
                        medicine['quantity']++;
                      });
                    }
                  },
                ),
                const SizedBox(width: 8),
              ],

              // Interactive Reserve Custom Toggle Button
              InkWell(
                onTap: () {
                  setState(() {
                    if (isSelected) {
                      // Unselect
                      medicine['selected'] = false;
                      medicine['quantity'] = 1;
                    } else {
                      // Select
                      medicine['selected'] = true;
                      medicine['quantity'] = 1;
                    }
                  });
                },
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: isSelected ? Colors.red : Colors.transparent,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected ? Colors.red : primaryBlue,
                      width: 1.5,
                    ),
                  ),
                  child: Row(
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
                          style: GoogleFonts.manrope(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: primaryBlue,
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

  /// BOTTOM ACTION BAR - Direction & Reservation Equal Size Layout
  Widget _buildBottomAction(BuildContext context, bool isDark) {
    String actionLabel = "RESERVE ALL";
    if (selectedCount == 0) {
      actionLabel = "SELECT ITEMS";
    } else if (selectedCount < totalAvailableCount) {
      actionLabel = "RESERVE ($selectedCount)";
    }

    return Align(
      alignment: Alignment.bottomCenter,
      child: Container(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 34),
        decoration: BoxDecoration(
          color: isDark ? slate900 : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(isDark ? 0.3 : 0.06),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: Row(
          children: [
            /// EQUAL SIZE DIRECTION BUTTON
            Expanded(
              child: GestureDetector(
                onTap: () => Navigator.pushNamed(context, '/Direction'),
                child: Container(
                  height: 56,
                  decoration: BoxDecoration(
                    color: isDark ? slate800 : Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: isDark
                          ? slate400.withOpacity(0.2)
                          : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.near_me_rounded,
                        color: primaryBlue,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        "Direction",
                        style: GoogleFonts.manrope(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white : slate900,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            const SizedBox(width: 16),

            /// EQUAL SIZE DYNAMIC RESERVE ACTION BUTTON
            Expanded(
              child: GestureDetector(
                onTap: selectedCount > 0
                    ? () => _showConfirmationDialog(context, isDark)
                    : null,
                child: Container(
                  height: 56,
                  decoration: BoxDecoration(
                    gradient: selectedCount > 0
                        ? const LinearGradient(
                            colors: [primaryBlue, Color(0xFF1E40AF)],
                          )
                        : null,
                    color: selectedCount == 0
                        ? (isDark ? Colors.white10 : Colors.black12)
                        : null,
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: selectedCount > 0
                        ? [
                            BoxShadow(
                              color: primaryBlue.withOpacity(0.3),
                              blurRadius: 15,
                              offset: const Offset(0, 8),
                            ),
                          ]
                        : null,
                  ),
                  child: Center(
                    child: Text(
                      actionLabel,
                      style: GoogleFonts.manrope(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: selectedCount > 0 ? Colors.white : slate500,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

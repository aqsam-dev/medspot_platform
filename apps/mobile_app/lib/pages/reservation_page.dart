import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:medspot/theme.dart';
import 'package:medspot/services/patient_api.dart';
import 'package:medspot/pages/rating_review.dart';
import 'package:intl/intl.dart';

class ReservationDetailsScreen extends StatefulWidget {
  const ReservationDetailsScreen({super.key});

  @override
  State<ReservationDetailsScreen> createState() => _ReservationDetailsScreenState();
}

class _ReservationDetailsScreenState extends State<ReservationDetailsScreen> {
  // Notification State Variables
  late int reservationId;
  String? _topMessage;
  bool _isNotificationError = false;
  Map<String, dynamic>? reservation;
  bool _loading = true;
  bool _dialogShown = false;



  // Notification Logic with Swipe-to-Dismiss and Auto-hide
  void _showTopNotification(String message, {bool isError = false}) {
    if (!mounted) return;
    setState(() {
      _topMessage = message;
      _isNotificationError = isError;
    });
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted && _topMessage == message) {
        setState(() => _topMessage = null);
      }
    });
  }
  void _showReviewDialog() {
  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (_) => AlertDialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      title: const Text(
        "Reservation Completed!",
      ),
      content: const Text(
        "Please rate your experience with this pharmacy."
      ),
      actions: [

        TextButton(
          onPressed: () {
            Navigator.pop(context);
          },
          child: const Text("Later"),
        ),

        ElevatedButton(
          onPressed: () {

            Navigator.pop(context);

            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) =>
                    PharmacyReviewScreen(
                  pharmacyId:
                      reservation!["pharmacy"]
                          ["pharmacy_id"],
                  pharmacyName:
                      reservation!["pharmacy"]
                          ["pharmacy_name"],
                  reservationId:
                      reservation!["reservation_id"],
                ),
              ),
            );
          },
          child: const Text(
            "Rate Now",
          ),
        ),
      ],
    ),
  );
}


    Future<void> _loadReservation() async {
  try {
  reservation =
    await PatientApi.getReservationDetails(
        reservationId);

if (
    reservation?["status"] == "COMPLETED" &&
    !_dialogShown
) {
  _dialogShown = true;

  Future.delayed(
    const Duration(milliseconds: 500),
    () {
      if (mounted) {
        _showReviewDialog();
      }
    },
  );
}

  } catch (e) {
    _showTopNotification(
      "Failed to load reservation",
      isError: true,
    );
  }

  if (mounted) {
    setState(() {
      _loading = false;
    });
  }
}

 // POP-UP DIALOG: Logic for "Are you sure to cancel"
void _showCancelConfirmation(BuildContext context, bool isDark) {
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
      ),
      title: Text(
        "Cancel Reservation?",
        style: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.w800,
          color: isDark ? Colors.white : const Color(0xFF1E293B),
        ),
      ),
      content: Text(
        "Are you sure you want to cancel this reservation? This action cannot be undone.",
        style: GoogleFonts.plusJakartaSans(
          color: isDark ? Colors.white70 : Colors.black54,
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text(
            "No",
            style: TextStyle(
              color: isDark ? Colors.white60 : Colors.black54,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.redAccent,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          onPressed: () async {
            Navigator.pop(context); // Close dialog

            try {
              await PatientApi.cancelReservation(reservationId);

              _showTopNotification(
                "Your reservation has been cancelled.",
              );

              Future.delayed(const Duration(seconds: 2), () {
                if (mounted) {
                  Navigator.pop(context);
                }
              });
            } catch (e) {
              _showTopNotification(
                e.toString(),
                isError: true,
              );
            }
          },
          child: const Text(
            "Yes, Cancel",
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    ),
  );
}

@override
void didChangeDependencies() {
  super.didChangeDependencies();

  if (reservation == null) {
    reservationId =
        ModalRoute.of(context)!.settings.arguments as int;

    _loadReservation();
  }
}
  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    final Color scaffoldBg = isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final Color cardColor = isDark ? const Color(0xFF1E293B) : Colors.white;
    final Color textColor = isDark ? Colors.white : const Color(0xFF1E293B);

     if (_loading) {
  return const Scaffold(
    body: Center(
      child: CircularProgressIndicator(),
    ),
  );
}

if (reservation == null) {
  return const Scaffold(
    body: Center(
      child: Text("Reservation not found"),
    ),
  );
}

    return Scaffold(
      backgroundColor: scaffoldBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        toolbarHeight: 80,
        leadingWidth: 80,
        leading: Center(
          child: InkWell(
            onTap: () => Navigator.pop(context),
            child: Container(
              height: 48, width: 48,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF334155) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(isDark ? 0.2 : 0.04), blurRadius: 10, offset: const Offset(0, 4))],
              ),
              child: Icon(Icons.chevron_left_rounded, color: isDark ? Colors.white : const Color(0xFF1E293B), size: 28),
            ),
          ),
        ),
        title: Text("Reservation Details", style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800, fontSize: 18, color: textColor)),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
            child: Column(
              children: [
                _buildMainDetailsCard(isDark, cardColor, textColor),
                const SizedBox(height: 24),
if (reservation!["status"] == "ACTIVE")
  Row(
    children: [
      Expanded(
        child: _buildActionButton(
          label: "Cancel",
          onPressed: () =>
              _showCancelConfirmation(context, isDark),
          isSecondary: true,
          isDark: isDark,
        ),
      ),

      const SizedBox(width: 16),

      Expanded(
        child: _buildActionButton(
          label: "Direction",
          icon: Icons.directions_rounded,
          onPressed: () {
            Navigator.pushNamed(
              context,
              '/Direction',
              arguments: {
                "latitude":
                    reservation!["pharmacy"]["latitude"],
                "longitude":
                    reservation!["pharmacy"]["longitude"],
              },
            );
          },
          isSecondary: false,
          isDark: isDark,
        ),
      ),
    ],
  ),

if (reservation!["status"] == "COMPLETED")
  Row(
    children: [
      Expanded(
        child: _buildActionButton(
          label: "Direction",
          icon: Icons.directions_rounded,
          onPressed: () {
            Navigator.pushNamed(
              context,
              '/Direction',
              arguments: {
                "latitude":
                    reservation!["pharmacy"]["latitude"],
                "longitude":
                    reservation!["pharmacy"]["longitude"],
              },
            );
          },
          isSecondary: true,
          isDark: isDark,
        ),
      ),

      const SizedBox(width: 16),

      Expanded(
        child: _buildActionButton(
          label: "Rate & Review",
          icon: Icons.star_rounded,
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => PharmacyReviewScreen(
                  pharmacyId:
                      reservation!["pharmacy"]["pharmacy_id"],
                  pharmacyName:
                      reservation!["pharmacy"]
                          ["pharmacy_name"],
                  reservationId:
                      reservation!["reservation_id"],
                ),
              ),
            );
          },
          isSecondary: false,
          isDark: isDark,
        ),
      ),
    ],
  ),
              ],
            ),
          ),
          
          // NOTIFICATION OVERLAY (Fully Functional + Swipe to Dismiss)
          if (_topMessage != null)
            Positioned(
              top: 10, left: 20, right: 20,
              child: GestureDetector(
                onHorizontalDragEnd: (details) => setState(() => _topMessage = null),
                child: _buildTopNotificationUI(),
              ),
            ),
        ],
      ),
      // CHANGED: Passing scaffoldBg here so it matches perfectly with the home page flat style instead of popping up
      bottomNavigationBar: _buildBottomNav(isDark, scaffoldBg),
    );
  }
  // --- UI COMPONENTS ---
  Widget _buildTopNotificationUI() {
    final Color barColor = _isNotificationError ? Colors.redAccent : AppColors.primary;
    return Material(
      color: Colors.transparent,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: barColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: barColor.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4))],
        ),
        child: Row(
          children: [
            Icon(_isNotificationError ? Icons.error_outline : Icons.check_circle_outline, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(
              child: Text(_topMessage!, style: GoogleFonts.plusJakartaSans(color: Colors.white, fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      ),
    );
  }

 
Widget _buildMainDetailsCard(
    bool isDark,
    Color bgColor,
    Color textColor,
) {
    final expiry = DateTime.parse(
    reservation!["expires_at"],
  ).toLocal();
  return Container(
    padding: const EdgeInsets.all(24),
    decoration: BoxDecoration(
      color: bgColor,
      borderRadius: BorderRadius.circular(32),
      border: Border.all(
        color: isDark
            ? Colors.white.withOpacity(0.05)
            : const Color(0xFFF1F5F9),
      ),
    ),
    child: Column(
      children: [
        Row(
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(
                Icons.confirmation_number_rounded,
                color: AppColors.primary,
                size: 28,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "ORDER REFERENCE",
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white38 : Colors.black38,
                      letterSpacing: 1,
                    ),
                  ),
                  Text(
                    "#RZ${reservation!["reservation_id"]}",
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),

        Padding(
          padding: const EdgeInsets.symmetric(vertical: 24),
          child: Divider(
            height: 1,
            color: isDark
                ? Colors.white10
                : Colors.black.withOpacity(0.05),
          ),
        ),

        _buildInfoItem(
          Icons.store_rounded,
          "Pharmacy Address",
          reservation!["pharmacy"]["address"],
          isDark,
        ),

        const SizedBox(height: 20),

        


      _buildInfoItem(
  Icons.alarm_on_rounded,
  "Reservation Held Until",
  DateFormat("dd MMM yyyy • hh:mm a").format(expiry),
  isDark,
  highlight: true,
),

        const SizedBox(height: 32),

        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: isDark
                ? Colors.black.withOpacity(0.2)
                : const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(28),
            border: Border.all(
              color: isDark
                  ? Colors.white10
                  : AppColors.primary.withOpacity(0.1),
            ),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.medication_liquid_rounded,
                        color: AppColors.primary,
                        size: 22,
                      ),
                      const SizedBox(width: 10),
                      Text(
                        "Medicines List",
                        style: GoogleFonts.plusJakartaSans(
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                          color: textColor,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      "${reservation!["items"].length} ITEMS",
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              ...(reservation!["items"] as List)
                  .map(
                    (item) => _buildMedRow(
                      item["medicine_name"],
                      "${item["quantity"]}",
                      isDark,
                    ),
                  )
                  .toList(),

              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Divider(
                  height: 1,
                  thickness: 0.5,
                ),
              ),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    "Total Bill",
                    style: GoogleFonts.plusJakartaSans(
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
                      color: textColor,
                    ),
                  ),
                  Text(
                    "${reservation!["total_bill"]} RS",
                    style: GoogleFonts.plusJakartaSans(
                      fontWeight: FontWeight.w900,
                      fontSize: 20,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

  Widget _buildInfoItem(IconData icon, String label, String value, bool isDark, {bool highlight = false}) {
    return Row(
      children: [
        Container(
          width: 44, height: 44,
          decoration: BoxDecoration(color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: highlight ? Colors.orangeAccent : (isDark ? Colors.white38 : Colors.black38), size: 20),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label.toUpperCase(), style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: isDark ? Colors.white38 : Colors.black38, letterSpacing: 0.5)),
              Text(value, style: GoogleFonts.plusJakartaSans(fontSize: 14, fontWeight: FontWeight.w700, color: highlight ? Colors.orangeAccent : (isDark ? Colors.white : const Color(0xFF1E293B)))),
            ],
          ),
        )
      ],
    );
  }

  Widget _buildMedRow(String name, String qty, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(children: [
            const Icon(Icons.circle, size: 6, color: AppColors.primary),
            const SizedBox(width: 8),
            Text(name, style: TextStyle(color: isDark ? Colors.white70 : Colors.black54, fontSize: 14, fontWeight: FontWeight.w600)),
          ]),
          Text(qty, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: isDark ? Colors.white : Colors.black87)),
        ],
      ),
    );
  }

  Widget _buildActionButton({required String label, IconData? icon, required VoidCallback onPressed, required bool isSecondary, required bool isDark}) {
    return Container(
      height: 60,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        boxShadow: isSecondary ? [] : [BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 6))],
      ),
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: isSecondary ? (isDark ? const Color(0xFF1E293B) : Colors.white) : AppColors.primary,
          foregroundColor: isSecondary ? (isDark ? Colors.white60 : Colors.black54) : Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: isSecondary ? BorderSide(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0)) : BorderSide.none,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) Icon(icon, size: 20),
            if (icon != null) const SizedBox(width: 8),
            Text(label, style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800, fontSize: 15)),
          ],
        ),
      ),
    );
  }

 Widget _buildBottomNav(bool isDark, Color bgColor) {
  return BottomAppBar(
    height: 70,
    color: bgColor,
    padding: EdgeInsets.zero,
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: [
        _navItem(Icons.home_rounded, "Home", false, () => Navigator.pushNamed(context, '/home')),
        _navItem(Icons.search_rounded, "Search", false, () => Navigator.pushNamed(context, '/search')),
        _navItem(Icons.receipt_long_rounded, "Reservations", true, () {}),
        _navItem(Icons.person_rounded, "Profile", false, () => Navigator.pushNamed(context, '/profile')),
      ],
    ),
  );
}

  Widget _navItem(IconData icon, String label, bool isActive, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
Icon(icon, color: isActive ? AppColors.primary : const Color(0xFF94A3B8)),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(fontSize: 10, fontWeight: isActive ? FontWeight.w900 : FontWeight.w700, color: isActive ? AppColors.primary : const Color(0xFF94A3B8))),
        ],
      ),
    );
  }
}
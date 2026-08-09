import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:medspot/theme.dart';
import '../services/patient_api.dart'; // Adjust path as needed

class ReservationsScreen extends StatefulWidget {
  const ReservationsScreen({super.key});

  @override
  State<ReservationsScreen> createState() => _ReservationsScreenState();
}

class _ReservationsScreenState extends State<ReservationsScreen> {
  // --- Dark Theme Color Constants ---
  static const Color slate900 = Color(0xFF0F172A);
  static const Color darkCardColor = Color(0xFF1E293B);
  static const Color darkInputFill = Color(0xFF334155);

  // --- State Variables ---
  List<dynamic> _reservations = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchReservations();
  }

  // --- API Fetch Handler ---
  Future<void> _fetchReservations() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Calls your static API method from patient_api.dart
      final data = await PatientApi.getReservations();
      setState(() {
        _reservations = data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  // Helper to map DB status string to UI Color
  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'completed':
      case 'confirmed':
        return Colors.green;
      case 'pending':
        return Colors.amber.shade700;
      case 'cancelled':
      case 'expired':
      case 'rejected':
        return Colors.red;
      default:
        return Colors.blue;
    }
  }

  // Helper to format ISO Date strings safely
  String _formatDate(String? isoString) {
    if (isoString == null || isoString.isEmpty) return "N/A";
    try {
      final dateTime = DateTime.parse(isoString).toLocal();
      return "${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}";
    } catch (_) {
      return isoString;
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;

    final Color primaryBlue = AppColors.primary;
    final Color midnightBlue = isDark ? Colors.black : const Color(0xFF1E3A8A);
    final Color scaffoldBg = isDark ? slate900 : AppColors.slate50;
    final Color cardBg = isDark ? darkCardColor : Colors.white;
    final Color textColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final Color subTextColor = isDark ? Colors.white70 : const Color(0xFF64748B);

    return Scaffold(
      backgroundColor: scaffoldBg,
      body: Stack(
        children: [
          _buildBackgroundPattern(isDark),
          CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              // Header
              SliverToBoxAdapter(
                child: _buildHeader(
                  context,
                  primaryBlue,
                  midnightBlue,
                  _reservations.length,
                ),
              ),

              // Content Handler: Loading, Error, Empty, or List
              if (_isLoading)
                const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (_errorMessage != null)
                SliverFillRemaining(
                  child: _buildErrorState(subTextColor),
                )
              else if (_reservations.isEmpty)
                SliverFillRemaining(
                  child: _buildEmptyState(subTextColor),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final item = _reservations[index];

                        // Field mapping from SQL response
                        final String orderNo = item['reservation_id']?.toString() ?? 'N/A';
                        final String pharmacy = item['pharmacy_name'] ?? 'Unknown Pharmacy';
                        final String bill = item['total_bill']?.toString() ?? '0';
                        final String expiryTime = _formatDate(item['expires_at']);
                        final String statusText = (item['status'] ?? 'PENDING').toString().toUpperCase();
                        final Color statusColor = _getStatusColor(item['status']);

                        return Padding(
                          padding: const EdgeInsets.only(bottom: 20),
                          child:_buildReservationCard(
    context: context,
    item: item,
    orderNo: orderNo,
    pharmacy: pharmacy,
    bill: bill,
    time: expiryTime,
    status: statusText,
    statusColor: statusColor,
    primaryColor: primaryBlue,
    isDark: isDark,
    cardBg: cardBg,
    textColor: textColor,
    subTextColor: subTextColor,
),
                        );
                      },
                      childCount: _reservations.length,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  // --- Background Design ---
  Widget _buildBackgroundPattern(bool isDark) {
    return Positioned.fill(
      child: Opacity(
        opacity: isDark ? 0.01 : 0.03,
        child: Image.network(
          'https://www.transparenttextures.com/patterns/cubes.png',
          repeat: ImageRepeat.repeat,
          errorBuilder: (context, error, stackTrace) => const SizedBox.shrink(),
        ),
      ),
    );
  }

  // --- Header Implementation ---
  Widget _buildHeader(BuildContext context, Color primary, Color dark, int count) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 60, 24, 40),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [primary, dark],
        ),
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(40)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _headerIconButton(Icons.chevron_left, () => Navigator.pop(context)),
          const SizedBox(height: 32),
          Text(
            "Your's\nReservations",
            style: GoogleFonts.plusJakartaSans(
              color: Colors.white,
              fontSize: 34,
              fontWeight: FontWeight.w800,
              height: 1.1,
              letterSpacing: -1,
            ),
          ),
          const SizedBox(height: 24),
          _buildSummaryChip(count),
        ],
      ),
    );
  }

  Widget _buildSummaryChip(int count) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.15),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Row(
        children: [
          const CircleAvatar(
            backgroundColor: Colors.white,
            child: Icon(Icons.receipt_long, color: Color(0xFF2A4ECA)),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("Active Orders", style: TextStyle(color: Colors.white70, fontSize: 12)),
              Text(
                "$count Items Found",
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ],
          ),
        ],
      ),
    );
  }

// --- Main Reservation Card ---
Widget _buildReservationCard({
  required Map<String, dynamic> item,
  required BuildContext context,
  required String orderNo,
  required String pharmacy,
  required String bill,
  required String time,
  required String status,
  required Color statusColor,
  required Color primaryColor,
  required bool isDark,
  required Color cardBg,
  required Color textColor,
  required Color subTextColor,
}) {
  return InkWell(
    borderRadius: BorderRadius.circular(30),

    onTap: () {
      Navigator.pushNamed(
        context,
        "/reservation",
        arguments: item["reservation_id"],
      );
    },

    child: Container(
      padding: const EdgeInsets.all(24),

      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(30),

        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(
              isDark ? 0.2 : 0.04,
            ),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],

        border: Border.all(
          color: isDark
              ? Colors.white.withOpacity(0.05)
              : const Color(0xFFF1F5F9),
        ),
      ),

      child: Column(
        children: [
          Row(
            mainAxisAlignment:
                MainAxisAlignment.spaceBetween,

            children: [
              Text(
                "#RZ-$orderNo",

                style:
                    GoogleFonts.jetBrainsMono(
                  fontWeight:
                      FontWeight.bold,

                  color: isDark
                      ? primaryColor
                      : const Color(
                          0xFF94A3B8),
                ),
              ),

              _statusBadge(
                status,
                statusColor,
              ),
            ],
          ),

          Divider(
            height: 40,
            color: isDark
                ? Colors.white
                    .withOpacity(0.05)
                : const Color(
                    0xFFF1F5F9),
          ),

          _rowInfo(
            Icons.storefront_outlined,
            "Pharmacy",
            pharmacy,
            subTextColor,
            textColor,
          ),

          const SizedBox(height: 24),

          Row(
            children: [
              Expanded(
                child: _miniStat(
                  "Bill Amount",
                  "Rs. $bill",
                  primaryColor,
                  isDark,
                ),
              ),

              const SizedBox(width: 12),

              Expanded(
                child: _miniStat(
                  "Valid Until",
                  time,
                  textColor,
                  isDark,
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity,

            child: ElevatedButton(
              onPressed: () {
                if (status.toUpperCase() ==
                    "COMPLETED") {
                  Navigator.pushNamed(
                    context,
                    "/rating_review",

                    arguments: {
                      "reservationId":
                          item[
                              "reservation_id"],

                      "pharmacyId":
                          item["pharmacy_id"],

                      "pharmacyName":
                          item[
                              "pharmacy_name"],
                    },
                  );
                } else {
                  Navigator.pushNamed(
                    context,
                    "/Direction",
                  );
                }
              },

              style: ElevatedButton.styleFrom(
                backgroundColor:
                    primaryColor,

                foregroundColor:
                    Colors.white,

                elevation: 0,

                shape:
                    RoundedRectangleBorder(
                  borderRadius:
                      BorderRadius.circular(
                          16),
                ),

                padding:
                    const EdgeInsets.symmetric(
                  vertical: 18,
                ),
              ),

              child: Text(
                status.toUpperCase() ==
                        "COMPLETED"
                    ? "Rate & Review"
                    : "Get Directions",

                style: const TextStyle(
                  fontWeight:
                      FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

  Widget _statusBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(text, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w800)),
    );
  }

  Widget _rowInfo(IconData icon, String label, String value, Color subColor, Color mainColor) {
    return Row(
      children: [
        Icon(icon, size: 18, color: subColor.withOpacity(0.6)),
        const SizedBox(width: 12),
        Text("$label:", style: TextStyle(color: subColor, fontSize: 13)),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            value,
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: mainColor),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _miniStat(String label, String value, Color color, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? darkInputFill.withOpacity(0.5) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 10, color: isDark ? Colors.white38 : const Color(0xFF94A3B8))),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(Color color) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.assignment_late_outlined, size: 80, color: color.withOpacity(0.2)),
        const SizedBox(height: 16),
        Text(
          "No reservations yet",
          style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w600, color: color),
        ),
      ],
    );
  }

  Widget _buildErrorState(Color color) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.error_outline, size: 80, color: Colors.red.withOpacity(0.5)),
        const SizedBox(height: 16),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Text(
            _errorMessage ?? "Something went wrong",
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 14, color: color),
          ),
        ),
        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: _fetchReservations,
          child: const Text("Retry"),
        ),
      ],
    );
  }

  Widget _headerIconButton(IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.2),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Icon(icon, color: Colors.white, size: 22),
      ),
    );
  }
}
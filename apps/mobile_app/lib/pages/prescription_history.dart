import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter/services.dart';
import 'package:medspot/pages/pharmacy_response_page.dart';
import 'package:medspot/services/patient_api.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shimmer/shimmer.dart';

class PrescriptionHistoryScreen extends StatefulWidget {
  const PrescriptionHistoryScreen({super.key});

  @override
  State<PrescriptionHistoryScreen> createState() =>
      _PrescriptionHistoryScreenState();
}

class _PrescriptionHistoryScreenState extends State<PrescriptionHistoryScreen> {
  // Professional Brand Palette Constants
  static const Color brandBlue = Color(0xFF2A4ECA);
  static const Color dangerRed = Color(0xFFDC2626);
  static const Color successGreen = Color(0xFF10B981);
  static const Color warningOrange = Color(0xFFF59E0B);
  static const Color slate900 = Color(0xFF0F172A);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate500 = Color(0xFF64748B);

  final TextEditingController _searchController = TextEditingController();

  bool loading = true;

  List<Map<String, dynamic>> _allPrescriptions = [];
  List<Map<String, dynamic>> _filteredPrescriptions = [];

  @override
  void initState() {
    super.initState();
    loadPrescriptions();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> loadPrescriptions() async {
    try {
      final prefs = await SharedPreferences.getInstance();

      final int? patientId = prefs.getInt("patient_id");

      if (patientId == null) {
        throw Exception("Patient ID not found");
      }

      final List records = await PatientApi.getPatientPrescriptions(
        patientId.toString(),
      );

      print(records);

      setState(() {
        _allPrescriptions = List<Map<String, dynamic>>.from(records);

        _filteredPrescriptions = _allPrescriptions;

        loading = false;
      });
    } catch (e) {
      debugPrint(e.toString());

      setState(() {
        loading = false;
      });
    }
  }

  void _filterSearch(String query) {
    setState(() {
      _filteredPrescriptions = _allPrescriptions
          .where(
            (item) => item["prescription_no"].toString().toLowerCase().contains(
              query.toLowerCase(),
            ),
          )
          .toList();
    });
  }

  // ✅ FULL SCREEN PRESCRIPTION IMAGE VIEWER (Copied directly from Pharmacy Response Screen)
  void _showPrescriptionViewer(String url) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.all(16),
          child: Stack(
            alignment: Alignment.center,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: InteractiveViewer(
                  maxScale: 4.0,
                  child: Image.network(
                    url,
                    fit: BoxFit.contain,
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return const Center(
                        child: CircularProgressIndicator(color: brandBlue),
                      );
                    },
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        padding: const EdgeInsets.all(24),
                        color: slate800,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.broken_image_rounded,
                              color: Colors.white38,
                              size: 48,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              "Failed to load image structure",
                              style: GoogleFonts.plusJakartaSans(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ),
              Positioned(
                top: 10,
                right: 10,
                child: CircleAvatar(
                  backgroundColor: Colors.black54,
                  child: IconButton(
                    icon: const Icon(Icons.close_rounded, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // Prescription Details Bottom Sheet
  void _showPrescriptionDetails(Map<String, dynamic> item, bool isDark) {
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? slate800 : Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 50,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.grey.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 25),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "Prescription Details",
                  style: GoogleFonts.plusJakartaSans(
                    fontWeight: FontWeight.w800,
                    fontSize: 20,
                    color: isDark ? Colors.white : slate900,
                  ),
                ),
                // ✅ VIEW PRESCRIPTION BUTTON (Matches Pharmacy Response Design & Logic)
                TextButton(
                  onPressed: () {
                    Navigator.pop(context); // Close the bottom sheet smoothly
                    _showPrescriptionViewer(
                      item['prescriptionUrl'],
                    ); // Trigger full viewer layout
                  },
                  style: TextButton.styleFrom(
                    minimumSize: Size.zero,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    backgroundColor: brandBlue.withOpacity(0.1),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: Text(
                    "View Prescription",
                    style: GoogleFonts.plusJakartaSans(
                      color: brandBlue,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            _detailRow("Record ID", item['id'], isDark),
            _detailRow("Date", item['date'], isDark),
            _detailRow("Category", item['type'], isDark),
            _detailRow(
              "Status",
              item['status'],
              isDark,
              color: item['statusColor'],
            ),
            const SizedBox(height: 30),
            GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(
                height: 55,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: brandBlue,
                  borderRadius: BorderRadius.circular(15),
                ),
                alignment: Alignment.center,
                child: Text(
                  "Close View",
                  style: GoogleFonts.plusJakartaSans(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(String title, String value, bool isDark, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: GoogleFonts.plusJakartaSans(color: slate500, fontSize: 14),
          ),
          Text(
            value,
            style: GoogleFonts.plusJakartaSans(
              fontWeight: FontWeight.w700,
              color: color ?? (isDark ? Colors.white : slate900),
            ),
          ),
        ],
      ),
    );
  }

  void _handleNewUpload() {
    _searchController.clear();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          "Records Refreshed",
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600),
        ),
        backgroundColor: successGreen,
      ),
    );

    loadPrescriptions();
  }

  @override
  Widget build(BuildContext context) {
    final bool isDarkMode = Theme.of(context).brightness == Brightness.dark;

    final Color bgColor = isDarkMode ? slate900 : const Color(0xFFF8FAFC);
    final Color headerColor = isDarkMode ? slate800 : const Color(0xFFF0F4FF);
    final Color cardColor = isDarkMode ? slate800 : Colors.white;
    final Color textColor = isDarkMode ? Colors.white : slate900;
    final Color subTextColor = isDarkMode ? const Color(0xFF94A3B8) : slate500;
    final Color borderColor = isDarkMode
        ? const Color(0xFF334155)
        : const Color(0xFFF1F5F9);
    final Color fieldColor = isDarkMode
        ? const Color(0xFF020617)
        : const Color(0xFFF8FAFC);

    return Scaffold(
      backgroundColor: bgColor,
      body: Stack(
        children: [
          Container(
            height: MediaQuery.of(context).size.height * 0.28,
            decoration: BoxDecoration(
              color: headerColor,
              borderRadius: const BorderRadius.vertical(
                bottom: Radius.circular(40),
              ),
            ),
          ),
     SafeArea(
  child: loading
      ? _buildFullPageSkeleton(isDarkMode)
      : Column(
          children: [
            _buildAppBar(
              context,
              textColor,
              cardColor,
              isDarkMode,
            ),
            _buildInsightsCard(),
            const SizedBox(height: 20),
            _buildSearchBar(
              fieldColor,
              subTextColor,
              isDarkMode,
            ),
            Expanded(
              child: _buildPrescriptionList(
                cardColor,
                textColor,
                subTextColor,
                borderColor,
                isDarkMode,
              ),
            ),
          ],
        ),
),
          if (!loading) _buildFloatingActionButton(context),
        ],
      ),
    );
  }

  Widget _buildAppBar(
    BuildContext context,
    Color textColor,
    Color iconBg,
    bool isDark,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(15),
                border: isDark
                    ? Border.all(color: const Color(0xFF334155))
                    : null,
              ),
              child: const Icon(
                Icons.arrow_back_ios_new_rounded,
                color: brandBlue,
                size: 18,
              ),
            ),
          ),
          Text(
            "Medical Records",
            style: GoogleFonts.plusJakartaSans(
              color: textColor,
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(width: 42),
        ],
      ),
    );
  }

  Widget _buildInsightsCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: brandBlue,
        borderRadius: BorderRadius.circular(28),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.auto_awesome_motion_rounded,
            color: Colors.white,
            size: 28,
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Health Repository",
                style: GoogleFonts.plusJakartaSans(
                  color: Colors.white70,
                  fontSize: 13,
                ),
              ),
              Text(
                "${_filteredPrescriptions.length} Active Files",
                style: GoogleFonts.plusJakartaSans(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar(Color fieldColor, Color hintColor, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
      child: TextField(
        controller: _searchController,
        onChanged: _filterSearch,
        style: TextStyle(color: isDark ? Colors.white : Colors.black),
        decoration: InputDecoration(
          hintText: "Search prescription ID...",
          hintStyle: GoogleFonts.plusJakartaSans(
            color: hintColor,
            fontSize: 14,
          ),
          prefixIcon: const Icon(Icons.search_rounded, color: brandBlue),
          filled: true,
          fillColor: fieldColor,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(18),
            borderSide: BorderSide.none,
          ),
          contentPadding: const EdgeInsets.symmetric(vertical: 16),
        ),
      ),
    );
  }

  Widget _buildPrescriptionList(
    Color cardColor,
    Color textColor,
    Color subColor,
    Color border,
    bool isDark,
  ) {
   if (loading) {
  return _buildSkeletonLoader(isDark);
}
    if (_filteredPrescriptions.isEmpty) {
      return Center(
        child: Text("No records found", style: TextStyle(color: subColor)),
      );
    }

    return ListView.builder(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(24, 10, 24, 120),
      itemCount: _filteredPrescriptions.length,
      itemBuilder: (context, index) {
        final item = _filteredPrescriptions[index];
        return GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => PharmacyResponseScreen(
                  prescriptionId: item["id"].toString(),
                  prescriptionImage: item["image_url"] ?? "",
                ),
              ),
            );
          },
          child: _buildHistoryItem(
            id: "MP-${item['prescription_no']}",
            date: item['created_at'].toString().substring(0, 10),
            status: item['status'] == 'completed' ? "Received" : "Pending",

            statusColor: item['status'] == 'completed'
                ? successGreen
                : warningOrange,
            cardColor: cardColor,
            textColor: textColor,
            subColor: subColor,
            borderColor: border,
            isDark: isDark,
          ),
        );
      },
    );
  }

  Widget _buildSkeletonLoader(bool isDark) {
  return ListView.builder(
    padding: const EdgeInsets.fromLTRB(24, 10, 24, 120),
    itemCount: 6,
    itemBuilder: (context, index) {
      return Shimmer.fromColors(
        baseColor:
            isDark ? Colors.grey.shade800 : Colors.grey.shade300,
        highlightColor:
            isDark ? Colors.grey.shade700 : Colors.grey.shade100,
        child: Container(
          margin: const EdgeInsets.only(bottom: 14),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
              ),

              const SizedBox(width: 16),

              Expanded(
                child: Column(
                  crossAxisAlignment:
                      CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 14,
                      width: 140,
                      color: Colors.white,
                    ),

                    const SizedBox(height: 10),

                    Container(
                      height: 10,
                      width: 100,
                      color: Colors.white,
                    ),
                  ],
                ),
              ),

              Container(
                width: 16,
                height: 16,
                color: Colors.white,
              ),
            ],
          ),
        ),
      );
    },
  );
}

Widget _buildFullPageSkeleton(bool isDark) {
  return Column(
    children: [
      _buildAppBar(
        context,
        Colors.white,
        Colors.white,
        isDark,
      ),

      Shimmer.fromColors(
        baseColor:
            isDark ? Colors.grey.shade800 : Colors.grey.shade300,
        highlightColor:
            isDark ? Colors.grey.shade700 : Colors.grey.shade100,
        child: Column(
          children: [
            Container(
              margin: const EdgeInsets.symmetric(
                horizontal: 24,
                vertical: 8,
              ),
              height: 110,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(28),
              ),
            ),

            const SizedBox(height: 20),

            Container(
              margin:
                  const EdgeInsets.symmetric(horizontal: 24),
              height: 55,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
              ),
            ),

            const SizedBox(height: 20),

            Expanded(
              child: _buildSkeletonLoader(isDark),
            ),
          ],
        ),
      ),
    ],
  );
}


  Widget _buildHistoryItem({
    required String id,
    required String date,
    required String status,
    required Color statusColor,
    required Color cardColor,
    required Color textColor,
    required Color subColor,
    required Color borderColor,
    required bool isDark,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          Container(
            height: 52,
            width: 52,
            decoration: BoxDecoration(
              color: statusColor.withOpacity(isDark ? 0.2 : 0.12),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(
              status == "Received"
                  ? Icons.verified_user_rounded
                  : Icons.history_edu_rounded,
              color: statusColor,
              size: 26,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  id,
                  style: GoogleFonts.plusJakartaSans(
                    fontWeight: FontWeight.w800,
                    fontSize: 15,
                    color: textColor,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  "$date • $status",
                  style: GoogleFonts.plusJakartaSans(
                    color: subColor,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Icon(
            Icons.arrow_forward_ios_rounded,
            color: subColor.withOpacity(0.3),
            size: 16,
          ),
        ],
      ),
    );
  }

  Widget _buildFloatingActionButton(BuildContext context) {
    return Positioned(
      bottom: 30,
      left: 24,
      right: 24,
      child: GestureDetector(
        onTap: _handleNewUpload,
        child: Container(
          height: 64,
          decoration: BoxDecoration(
            color: brandBlue,
            borderRadius: BorderRadius.circular(22),
            boxShadow: [
              BoxShadow(
                color: brandBlue.withOpacity(0.4),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const SizedBox(width: 12),
              Text(
                "Refresh",
                style: GoogleFonts.plusJakartaSans(
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.2,
                  color: Colors.white,
                  fontSize: 15,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

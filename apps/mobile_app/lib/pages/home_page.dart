import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:medspot/services/patient_api.dart';
import 'package:provider/provider.dart';
import 'package:medspot/main.dart'; // To access ThemeProvider state

class MedSpotDashboard extends StatefulWidget {
  const MedSpotDashboard({super.key});

  @override
  State<MedSpotDashboard> createState() => _MedSpotDashboardState();
}

class _MedSpotDashboardState extends State<MedSpotDashboard> {
  // --- Branding Colors ---
  static const Color primaryColor = Color(0xFF2a4eca);
  static const Color slate950 = Color(0xFF020617);
  static const Color slate900 = Color(0xFF0F172A);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate50 = Color(0xFFf8fafc);
  static const Color slate500 = Color(0xFF64748b);

  String? _topMessage;
  bool _isSuccess = false;
  bool _showAllTips = false; 

  String get displayUserName => PatientApi.userName ?? "User";

  void _showNotification(String message, {bool success = false}) {
    if (!mounted) return;
    setState(() {
      _topMessage = message;
      _isSuccess = success;
    });
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted && _topMessage == message) {
        setState(() => _topMessage = null);
      }
    });
  }

  Future<void> _navigateTo(String route) async {
    await Navigator.pushNamed(context, route);
    // Refresh the dashboard state if any updates happened inside sub-screens
    if (mounted) {
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? slate950 : Colors.white,
      bottomNavigationBar: _buildBottomNav(context, isDark),
      body: Stack(
        children: [
          CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              _buildAppBar(context, isDark),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildUserCard(isDark), 
                      const SizedBox(height: 32),
                      Text(
                        "Services",
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : slate900,
                        ),
                      ),
                      const SizedBox(height: 16),
                      _buildActionCard(
                        context, isDark, Icons.search_rounded, 
                        "Find Medicine", "Check stock in local pharmacies",
                        () => _navigateTo('/search'),
                      ),
                      const SizedBox(height: 16),
                      _buildActionCard(
                        context, isDark, Icons.qr_code_scanner_rounded, 
                        "Scan Prescription", "Instant upload for faster pickup",
                        () => _navigateTo('/prescription'),
                      ),
                      const SizedBox(height: 32),
                      _buildSectionHeader(isDark, "Health Insights", () {
                        setState(() {
                          _showAllTips = !_showAllTips;
                        });
                      }),
                      const SizedBox(height: 16),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 160,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    children: [
                      _buildTipCard(isDark, Icons.wb_sunny_rounded, "Vitamin D", "Spend 15 mins in sun."),
                      _buildTipCard(isDark, Icons.self_improvement_rounded, "Mental Health", "Take 5 deep breaths."),
                      _buildTipCard(isDark, Icons.monitor_heart_rounded, "Checkup", "Book your annual vitals."),
                      if (_showAllTips) ...[
                        _buildTipCard(isDark, Icons.water_drop_rounded, "Hydration", "Drink 2L of water daily."),
                        _buildTipCard(isDark, Icons.bedtime_rounded, "Sleep Cycle", "Get 8 hours of rest."),
                        _buildTipCard(isDark, Icons.directions_run_rounded, "Activity", "Walk 10k steps today."),
                      ],
                    ],
                  ),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
          if (_topMessage != null)
            Positioned(
              top: MediaQuery.of(context).padding.top + 10,
              left: 20,
              right: 20,
              child: _buildTopNotification(isDark),
            ),
        ],
      ),
    );
  }

  Widget _buildUserCard(bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [primaryColor, Color(0xFF4f70ff)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: primaryColor.withOpacity(isDark ? 0.4 : 0.2),
            blurRadius: 20,
            offset: const Offset(0, 10),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("Welcome back,", 
            style: GoogleFonts.plusJakartaSans(color: Colors.white70, fontSize: 14)),
          Text(
            displayUserName, 
            style: GoogleFonts.plusJakartaSans(
              color: Colors.white, 
              fontSize: 24, 
              fontWeight: FontWeight.w800
            ),
          ),
          const SizedBox(height: 8),
          Text("Your health is looking great!", 
            style: GoogleFonts.plusJakartaSans(color: Colors.white.withOpacity(0.8), fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildAppBar(BuildContext context, bool isDark) {
    final themeProvider = Provider.of<ThemeProvider>(context, listen: false);

    return SliverAppBar(
      pinned: true,
      elevation: 0,
      centerTitle: true,
      backgroundColor: (isDark ? slate950 : Colors.white).withOpacity(0.8),
      flexibleSpace: ClipRRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(color: Colors.transparent),
        ),
      ),
      title: Text("MEDSPOT", style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w900, letterSpacing: 1.2, color: primaryColor, fontSize: 20)),
      leading: IconButton(
        icon: const Icon(Icons.widgets_rounded, color: primaryColor),
        onPressed: () => _navigateTo('/menu'),
      ),
      actions: [
        IconButton(
          onPressed: () {
            themeProvider.toggleTheme(!isDark);
          },
          icon: Icon(
            isDark ? Icons.dark_mode : Icons.light_mode_outlined,
            color: isDark ? Colors.white : slate900,
          ),
        ),
        // IconButton(
        //   onPressed: () => _showNotification("Your health data is end-to-end encrypted.", success: true),
        //   icon: Badge(
        //     backgroundColor: Colors.redAccent,
        //     label: const Text("2", style: TextStyle(color: Colors.white, fontSize: 10)),
        //     child: Icon(Icons.notifications_none_rounded, color: isDark ? Colors.white : slate900),
        //   ),
        // ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildActionCard(BuildContext context, bool isDark, IconData icon, String title, String subtitle, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isDark ? slate900 : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: isDark ? slate800 : const Color(0xFFF1F5F9)),
          boxShadow: isDark ? [] : [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 20, offset: const Offset(0, 8))],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: primaryColor.withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
              child: Icon(icon, color: primaryColor),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800, fontSize: 15, color: isDark ? Colors.white : slate900)),
                  Text(subtitle, style: GoogleFonts.plusJakartaSans(color: slate500, fontSize: 13)),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios_rounded, color: isDark ? slate500 : const Color(0xFFCBD5E1), size: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildTipCard(bool isDark, IconData icon, String title, String desc) {
    return Container(
      width: 180,
      margin: const EdgeInsets.only(right: 16, bottom: 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? slate900 : slate50,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? slate800 : Colors.transparent),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: primaryColor, size: 28),
          const Spacer(),
          Text(title, style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800, fontSize: 14, color: isDark ? Colors.white : slate900)),
          const SizedBox(height: 4),
          Text(desc, style: GoogleFonts.plusJakartaSans(color: slate500, fontSize: 11)),
        ],
      ),
    );
  }

  Widget _buildBottomNav(BuildContext context, bool isDark) {
    return BottomAppBar(
      height: 70,
      color: isDark ? slate900 : Colors.white,
      padding: EdgeInsets.zero,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _navItem(context, isDark, Icons.home_filled, "Home", true, '/'),
          _navItem(context, isDark, Icons.search_rounded, "Search", false, '/search'),
          _navItem(context, isDark, Icons.receipt_long_rounded, "Reservation", false, '/today_reservation'),
          _navItem(context, isDark, Icons.person_rounded, "Profile", false, '/profile'),
        ],
      ),
    );
  }

  Widget _navItem(BuildContext context, bool isDark, IconData icon, String label, bool active, String route) {
    return InkWell(
      onTap: () => active ? null : _navigateTo(route),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: active ? primaryColor : slate500),
          Text(label, style: GoogleFonts.plusJakartaSans(fontSize: 10, color: active ? primaryColor : slate500, fontWeight: active ? FontWeight.bold : FontWeight.normal)),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(bool isDark, String title, VoidCallback onViewAll) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800, fontSize: 18, color: isDark ? Colors.white : slate900)),
        GestureDetector(
          onTap: onViewAll,
          child: Text(
            _showAllTips ? "Show Less" : "View all", 
            style: GoogleFonts.plusJakartaSans(color: primaryColor, fontWeight: FontWeight.bold, fontSize: 13)
          ),
        ),
      ],
    );
  }

  Widget _buildTopNotification(bool isDark) {
    final notifyBgColor = isDark ? slate900 : const Color(0xFFF0F4FF);
    return Material(
      elevation: 8,
      borderRadius: BorderRadius.circular(12),
      color: Colors.transparent, 
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: notifyBgColor, 
          borderRadius: BorderRadius.circular(12), 
          border: Border.all(color: primaryColor.withOpacity(0.3))
        ),
        child: Row(
          children: [
            const Icon(Icons.privacy_tip_rounded, color: primaryColor, size: 22),
            const SizedBox(width: 12),
            Expanded(child: Text(_topMessage!, style: GoogleFonts.plusJakartaSans(color: isDark ? Colors.white : slate900, fontWeight: FontWeight.bold, fontSize: 13))),
            GestureDetector(onTap: () => setState(() => _topMessage = null), child: Icon(Icons.close, color: isDark ? Colors.white54 : slate500, size: 18))
          ],
        ),
      ),
    );
  }
}
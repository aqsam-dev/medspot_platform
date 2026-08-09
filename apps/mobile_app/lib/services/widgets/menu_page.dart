import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Import PatientApi for dynamic user data handling
import 'package:medspot/services/patient_api.dart';

// Import pages for navigation
import 'package:medspot/pages/about_us.dart';
import 'package:medspot/pages/favorite_pharmacy_page.dart';
import 'package:medspot/pages/help_support.dart';
import 'package:medspot/pages/login_page.dart';
import 'package:medspot/pages/prescription_history.dart';
import 'package:medspot/pages/privacy_page.dart';
import 'package:medspot/pages/profile_page.dart';
import 'package:medspot/pages/today_reservation_page.dart';
import 'package:medspot/pages/term_condition_page.dart';
import 'package:medspot/pages/settings_page.dart';

class MedSpotMenuDrawer extends StatelessWidget {
  const MedSpotMenuDrawer({super.key});

  // --- UI Color Palette ---
  static const Color brandBlue = Color(0xFF2A4ECA);
  static const Color slate900 = Color(0xFF0F172A); 
  static const Color darkCardColor = Color(0xFF1E293B); 

  @override
  Widget build(BuildContext context) {
    // Check current theme brightness
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    
    // Theme-based dynamic colors
    final Color drawerBg = isDark ? slate900 : Colors.white;
    final Color textColor = isDark ? Colors.white : slate900;
    final Color cardBg = isDark ? darkCardColor : const Color(0xFFF1F5F9).withOpacity(0.5);
    final Color sectionLabelColor = isDark ? Colors.white54 : const Color(0xFF475569).withOpacity(0.5);

    return Drawer(
      width: MediaQuery.of(context).size.width * 0.85,
      backgroundColor: Colors.transparent,
      child: Container(
        decoration: BoxDecoration(
          color: drawerBg,
          borderRadius: const BorderRadius.only(
            topRight: Radius.circular(40),
            bottomRight: Radius.circular(40),
          ),
        ),
        child: SafeArea(
          bottom: false,
          child: Column(
            children: [
              // Header displaying current user information
              _buildHeader(context, textColor, isDark),
              
              Expanded(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 10),
                      _buildSectionLabel("Main Dashboard", sectionLabelColor),
                      const SizedBox(height: 16),
                      
                      // Grid for primary navigation actions
                      _buildActionGrid(context, cardBg, textColor, isDark),
                      
                      const SizedBox(height: 20),
                      _buildWideTile(
                        context,
                        Icons.auto_stories_outlined,
                        "Prescription History",
                        cardBg,
                        textColor,
                        () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PrescriptionHistoryScreen())),
                      ),
                      
                      const SizedBox(height: 32),
                      _buildSectionLabel("Support & Legal", sectionLabelColor),
                      const SizedBox(height: 16),
                      
                      // Smaller tiles for info and legal pages
                      _buildInfoGrid(context, cardBg, isDark),
                    ],
                  ),
                ),
              ),
              
              // Logout section at the bottom of the drawer
              _buildSignOutFooter(context, drawerBg, isDark),
            ],
          ),
        ),
      ),
    );
  }

  // --- Header Section with Dynamic Name ---
  Widget _buildHeader(BuildContext context, Color textColor, bool isDark) {
    // Fetches the updated name from PatientApi; defaults to "User" if null
    final String currentUserName = PatientApi.userName ?? "User";

    return Container(
      padding: const EdgeInsets.all(24),
      margin: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: brandBlue.withOpacity(0.2), width: 2),
            ),
            child: const CircleAvatar(
              radius: 28,
              backgroundColor: brandBlue,
              child: Icon(Icons.person_rounded, color: Colors.white, size: 30),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  currentUserName, // Now reflects updates made during the session
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: textColor,
                  ),
                ),
                // Verified account line removed from here
              ],
            ),
          ),
        ],
      ),
    );
  }

  // --- Layout Components ---
  Widget _buildActionGrid(BuildContext context, Color cardBg, Color textColor, bool isDark) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 1.1,
      children: [
        _buildMenuCard(context, Icons.person_outline, "My Profile", const PremiumProfileScreen(), cardBg, textColor, isDark),
        _buildMenuCard(context, Icons.receipt_long_outlined, "Reservations", const ReservationsScreen(), cardBg, textColor, isDark),
        _buildMenuCard(context, Icons.local_hospital_outlined, "Pharmacies", const FavouritePharmaciesPage(), cardBg, textColor, isDark),
        _buildMenuCard(context, Icons.tune_rounded, "Settings", const MedSpotSettings(), cardBg, textColor, isDark),
      ],
    );
  }

  Widget _buildInfoGrid(BuildContext context, Color cardBg, bool isDark) {
    final Color infoTextColor = isDark ? Colors.white70 : const Color(0xFF475569);
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 2.3,
      children: [
        _buildCompactTile(context, Icons.info_outline, "About Us", const AboutMedSpotScreen(), cardBg, infoTextColor),
        _buildCompactTile(context, Icons.description_outlined, "Terms", const TermsScreen(), cardBg, infoTextColor),
        _buildCompactTile(context, Icons.shield_outlined, "Privacy", const PrivacyPolicyPage(), cardBg, infoTextColor),
        _buildCompactTile(context, Icons.contact_support_outlined, "Support", const SupportCenterScreen(), cardBg, infoTextColor),
      ],
    );
  }

  // --- Reusable Tile Widgets ---
  Widget _buildMenuCard(BuildContext context, IconData icon, String label, Widget page, Color cardBg, Color textColor, bool isDark) {
    return InkWell(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => page)),
      borderRadius: BorderRadius.circular(24),
      child: Container(
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: isDark ? Colors.white10 : Colors.transparent),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? brandBlue.withOpacity(0.1) : Colors.white, 
                shape: BoxShape.circle
              ),
              child: Icon(icon, color: brandBlue, size: 24),
            ),
            const SizedBox(height: 12),
            Text(
              label,
              style: GoogleFonts.plusJakartaSans(fontSize: 13, fontWeight: FontWeight.w700, color: textColor),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWideTile(BuildContext context, IconData icon, String label, Color cardBg, Color textColor, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: brandBlue.withOpacity(0.1)),
        ),
        child: Row(
          children: [
            Icon(icon, color: brandBlue),
            const SizedBox(width: 16),
            Text(label, style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 15, color: textColor)),
            const Spacer(),
            Icon(Icons.chevron_right, color: brandBlue.withOpacity(0.3)),
          ],
        ),
      ),
    );
  }

  Widget _buildCompactTile(BuildContext context, IconData icon, String label, Widget page, Color cardBg, Color textColor) {
    return InkWell(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => page)),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(icon, size: 16, color: brandBlue),
            const SizedBox(width: 8),
            Text(label, style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w600, color: textColor)),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionLabel(String text, Color color) {
    return Text(
      text.toUpperCase(),
      style: GoogleFonts.plusJakartaSans(
        fontSize: 11,
        fontWeight: FontWeight.w800,
        color: color,
        letterSpacing: 1.2,
      ),
    );
  }

  // --- Sign Out Logic & Footer ---
  Widget _buildSignOutFooter(BuildContext context, Color bgColor, bool isDark) {
    const Color errorRed = Color(0xFFDC2626);
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 40),
      decoration: BoxDecoration(
        color: bgColor,
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(isDark ? 0.2 : 0.03), blurRadius: 10, offset: const Offset(0, -5))
        ],
      ),
      child: InkWell(
        onTap: () => _showLogoutConfirmation(context, isDark),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: errorRed.withOpacity(0.08),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.logout_rounded, color: errorRed, size: 20),
              const SizedBox(width: 12),
              Text(
                "Sign Out",
                style: GoogleFonts.plusJakartaSans(
                  color: errorRed,
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showLogoutConfirmation(BuildContext context, bool isDark) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: isDark ? darkCardColor : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        title: Text("Sign Out", style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800, color: isDark ? Colors.white : slate900)),
        content: Text("Are you sure you want to end your current session?", style: TextStyle(color: isDark ? Colors.white70 : Colors.black87)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel", style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () {
              // Resetting the session data
              PatientApi.logout(); 

              Navigator.pop(context);
              // Navigate back to login screen and clear history
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (_) => const MedSpotLoginPage()),
                (route) => false,
              );
            },
            child: const Text("Confirm Exit", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
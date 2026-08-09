import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AboutMedSpotScreen extends StatelessWidget {
  const AboutMedSpotScreen({super.key});

  // Adaptive Styling Constants
  static const Color primaryBlue = Color(0xFF2a4eca);
  static const Color slate950 = Color(0xFF020617); // Dark BG
  static const Color slate900 = Color(0xFF0F172A); // Dark Card
  static const Color slate800 = Color(0xFF1E293B); // Dark Border
  static const Color textGray = Color(0xFF64748B);
  static const Color borderLight = Color(0xFFF1F5F9);

  @override
  Widget build(BuildContext context) {
    // DARK THEME CHECK
    final bool isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? slate950 : Colors.white,
      body: Column(
        children: [
          /// ---------------- TOP BAR (Adaptive) ----------------
          SafeArea(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isDark ? slate950 : Colors.white,
                border: Border(
                  bottom: BorderSide(color: isDark ? slate800 : borderLight),
                ),
              ),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: primaryBlue),
                    style: IconButton.styleFrom(
                      backgroundColor: primaryBlue.withOpacity(0.1),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  Expanded(
                    child: Text(
                      "About MedSpot",
                      textAlign: TextAlign.center,
                      style: GoogleFonts.manrope(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : slate900,
                      ),
                    ),
                  ),
                  const SizedBox(width: 48), 
                ],
              ),
            ),
          ),

          /// ---------------- CONTENT ----------------
          Expanded(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Column(
                children: [
                  const SizedBox(height: 40),

                  // App Logo Placeholder Icon
                  Container(
                    width: 90,
                    height: 90,
                    decoration: BoxDecoration(
                      color: primaryBlue,
                      borderRadius: BorderRadius.circular(25),
                      boxShadow: [
                        BoxShadow(
                          color: primaryBlue.withOpacity(0.3),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        )
                      ],
                    ),
                    child: const Icon(Icons.medical_services_rounded, color: Colors.white, size: 45),
                  ),

                  const SizedBox(height: 20),
                  Text(
                    "MedSpot",
                    style: GoogleFonts.manrope(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      color: primaryBlue,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _buildVersionBadge(isDark),

                  const SizedBox(height: 40),

                  // Mission Section
                  _buildSection(
                    isDark: isDark,
                    icon: Icons.lightbulb_outline_rounded,
                    title: "Our Mission",
                    child: _buildMissionCard(isDark),
                  ),

                  // How it works Section
                  _buildSection(
                    isDark: isDark,
                    icon: Icons.settings_suggest_rounded,
                    title: "How it Works",
                    child: Column(
                      children: [
                        _buildStepTile(isDark, Icons.search_rounded, "Search", "Find meds instantly."),
                        _buildStepTile(isDark, Icons.location_on_rounded, "Locate", "Real-time pharmacy tracking."),
                        _buildStepTile(isDark, Icons.check_circle_rounded, "Reserve", "Quick pickup reservation."),
                      ],
                    ),
                  ),

                  // Grid Section
                  _buildSection(
                    isDark: isDark,
                    icon: Icons.auto_awesome_rounded,
                    title: "Why MedSpot?",
                    child: GridView.count(
                      padding: EdgeInsets.zero,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 1.2,
                      children: [
                        _buildGridCard(isDark, Icons.verified_user_rounded, "Verified", "Licensed Partners"),
                        _buildGridCard(isDark, Icons.speed_rounded, "Fast", "Real-time updates"),
                        _buildGridCard(isDark, Icons.lock_outline_rounded, "Secure", "Data Protection"),
                        _buildGridCard(isDark, Icons.headset_mic_rounded, "24/7", "Premium Support"),
                      ],
                    ),
                  ),

                  const SizedBox(height: 50),
                  _buildFooter(isDark),
                  const SizedBox(height: 30),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // --- HELPER WIDGETS ---

  Widget _buildVersionBadge(bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: primaryBlue.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: const Text(
        "V 2.4.0",
        style: TextStyle(color: primaryBlue, fontWeight: FontWeight.bold, fontSize: 10),
      ),
    );
  }

  Widget _buildSection({required bool isDark, required IconData icon, required String title, required Widget child}) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: primaryBlue, size: 22),
              const SizedBox(width: 10),
              Text(
                title, 
                style: GoogleFonts.manrope(
                  fontSize: 18, 
                  fontWeight: FontWeight.w800, 
                  color: isDark ? Colors.white : slate900
                )
              ),
            ],
          ),
          const SizedBox(height: 15),
          child,
        ],
      ),
    );
  }

  Widget _buildMissionCard(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? slate900 : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? slate800 : borderLight),
        boxShadow: isDark ? null : [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10)],
      ),
      child: Text(
        "Simplifying healthcare by connecting patients with pharmacies through modern technology.",
        style: GoogleFonts.manrope(color: textGray, fontSize: 15, height: 1.5),
      ),
    );
  }

  Widget _buildStepTile(bool isDark, IconData icon, String title, String sub) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: isDark ? slate900 : Colors.white,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: isDark ? slate800 : borderLight),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: primaryBlue.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: primaryBlue, size: 20),
          ),
          const SizedBox(width: 15),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: TextStyle(fontWeight: FontWeight.bold, color: isDark ? Colors.white : slate900)),
              Text(sub, style: const TextStyle(fontSize: 12, color: textGray)),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildGridCard(bool isDark, IconData icon, String title, String sub) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? slate900 : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? slate800 : borderLight),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: primaryBlue, size: 28),
          const SizedBox(height: 10),
          Text(title, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: isDark ? Colors.white : slate900)),
          const SizedBox(height: 4),
          Text(sub, textAlign: TextAlign.center, style: const TextStyle(fontSize: 10, color: textGray)),
        ],
      ),
    );
  }

  Widget _buildFooter(bool isDark) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // _footerIcon(Icons.language_rounded),
            const SizedBox(width: 24),
            // _footerIcon(Icons.email_rounded),
            const SizedBox(width: 24),
            // _footerIcon(Icons.share_rounded),
          ],
        ),
        const SizedBox(height: 20),
        Text(
          "© 2026 MEDSPOT HEALTH SYSTEMS", 
          style: TextStyle(
            fontSize: 10, 
            color: isDark ? textGray.withOpacity(0.6) : textGray, 
            letterSpacing: 1.5,
            fontWeight: FontWeight.w600
          )
        ),
      ],
    );
  }

  Widget _footerIcon(IconData icon) {
    return Icon(icon, color: textGray, size: 22);
  }
}
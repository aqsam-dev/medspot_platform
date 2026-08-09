import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class PrivacyPolicyPage extends StatefulWidget {
  const PrivacyPolicyPage({super.key});

  @override
  State<PrivacyPolicyPage> createState() => _PrivacyPolicyPageState();
}

class _PrivacyPolicyPageState extends State<PrivacyPolicyPage> {
  @override
  Widget build(BuildContext context) {
    // ✅ AUTO-DETECT SYSTEM THEME
    final bool isDarkMode = Theme.of(context).brightness == Brightness.dark;

    const Color primaryBlue = Color(0xFF2A4ECA);
    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : Colors.white;
    final Color textColor = isDarkMode ? Colors.white : const Color(0xFF0F172A);
    final Color subTextColor = isDarkMode
        ? const Color(0xFF94A3B8)
        : const Color(0xFF64748B);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color borderColor = isDarkMode
        ? const Color(0xFF334155)
        : const Color(0xFFF1F5F9);

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        backgroundColor: bgColor,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: primaryBlue, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          "Privacy Policy",
          style: GoogleFonts.manrope(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: textColor,
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: borderColor),
        ),
      ),
      body: ListView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 20),
        children: [
          const SizedBox(height: 24),

          // Header
          Row(
            children: [
              Icon(Icons.update_rounded, size: 16, color: subTextColor),
              const SizedBox(width: 6),
              Text(
                "Last Updated: March 07, 2026",
                style: GoogleFonts.manrope(
                  color: subTextColor,
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            "Your Privacy Matters",
            style: GoogleFonts.manrope(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: textColor,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            "At MedSpot, we believe you should always know what data we collect and how we use it.",
            style: GoogleFonts.manrope(
              fontSize: 15,
              height: 1.6,
              color: textColor.withOpacity(0.8),
            ),
          ),

          const SizedBox(height: 32),

          // Sections
          _buildAccordion(
            title: "Data Collection",
            icon: Icons.shield_outlined,
            primaryBlue: primaryBlue,
            cardColor: cardColor,
            borderColor: borderColor,
            textColor: textColor,
            subTextColor: subTextColor,
            initiallyExpanded: true,
            children: [
              _paragraph(
                "We collect personal information that you provide directly to us:",
                textColor,
              ),
              _bullet(
                "Account details (name, email, phone)",
                primaryBlue,
                subTextColor,
              ),
              _bullet(
                "Location data for pharmacy search",
                primaryBlue,
                subTextColor,
              ),
            ],
          ),

          _buildAccordion(
            title: "How We Use Your Data",
            icon: Icons.insights_outlined,
            primaryBlue: primaryBlue,
            cardColor: cardColor,
            borderColor: borderColor,
            textColor: textColor,
            subTextColor: subTextColor,
            children: [
              _paragraph(
                "Your data allows us to provide a seamless experience:",
                textColor,
              ),
              _bullet(
                "Facilitating pharmacy reservations",
                primaryBlue,
                subTextColor,
              ),
              _bullet("Sending order notifications", primaryBlue, subTextColor),
            ],
          ),

          const SizedBox(height: 32),
          Text(
            "Contact Us",
            style: GoogleFonts.manrope(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          const SizedBox(height: 20),
          _buildEmailCard(primaryBlue, isDarkMode),
          const SizedBox(height: 60),
        ],
      ),
    );
  }

  // --- HELPER WIDGETS ---

  Widget _buildAccordion({
    required String title,
    required IconData icon,
    required List<Widget> children,
    required Color primaryBlue,
    required Color cardColor,
    required Color borderColor,
    required Color textColor,
    required Color subTextColor,
    bool initiallyExpanded = false,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Theme(
        data: ThemeData().copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          initiallyExpanded: initiallyExpanded,
          leading: Icon(icon, color: primaryBlue, size: 22),
          title: Text(
            title,
            style: GoogleFonts.manrope(
              color: textColor,
              fontWeight: FontWeight.w700,
              fontSize: 16,
            ),
          ),
          iconColor: primaryBlue,
          collapsedIconColor: subTextColor,
          childrenPadding: const EdgeInsets.fromLTRB(54, 0, 16, 20),
          children: children,
        ),
      ),
    );
  }

  Widget _buildEmailCard(Color primaryBlue, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: primaryBlue.withOpacity(isDark ? 0.1 : 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: primaryBlue.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Icon(Icons.mail_rounded, color: primaryBlue, size: 20),
          const SizedBox(width: 16),
          Text(
            "privacy@medspot.app",
            style: GoogleFonts.manrope(
              color: primaryBlue,
              fontSize: 15,
              fontWeight: FontWeight.w700,
            ),
          ),
          const Spacer(),
          Icon(
            Icons.open_in_new_rounded,
            color: primaryBlue.withOpacity(0.5),
            size: 18,
          ),
        ],
      ),
    );
  }

  Widget _paragraph(String text, Color textColor) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: GoogleFonts.manrope(
          fontSize: 14,
          height: 1.5,
          color: textColor.withOpacity(0.9),
        ),
      ),
    );
  }

  // ✅ CORRECTED BULLET METHOD (No extra brackets)
  Widget _bullet(String text, Color primaryBlue, Color subTextColor) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Icon(Icons.circle, size: 6, color: primaryBlue),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: GoogleFonts.manrope(
                fontSize: 14,
                height: 1.4,
                color: subTextColor,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

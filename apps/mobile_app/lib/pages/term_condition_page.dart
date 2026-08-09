import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:medspot/theme.dart';

class TermsScreen extends StatefulWidget {
  const TermsScreen({super.key});

  @override
  State<TermsScreen> createState() => _TermsScreenState();
}

class _TermsScreenState extends State<TermsScreen> {
  // Controller for the scrollable list to track position
  final ScrollController _scrollController = ScrollController();
  double _scrollProgress = 0.0;

  @override
  void initState() {
    super.initState();
    // Listener to update the progress bar based on scroll offset
    _scrollController.addListener(() {
      if (_scrollController.hasClients) {
        setState(() {
          _scrollProgress = (_scrollController.offset / 
            _scrollController.position.maxScrollExtent).clamp(0.0, 1.0);
        });
      }
    });
  }

  @override
  void dispose() {
    // Clean up the controller when the widget is removed
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Detect if the app is currently in dark mode
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    
    // UI Colors based on the active theme
    final Color scaffoldBg = isDark ? const Color(0xFF0F172A) : Colors.white;
    final Color textColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final Color subTextColor = isDark ? Colors.white70 : const Color(0xFF475569);
    final Color cardBg = isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC);
    final Color borderColor = isDark ? Colors.white.withOpacity(0.05) : const Color(0xFFF1F5F9);

    return Scaffold(
      backgroundColor: scaffoldBg,
      appBar: _buildAppBar(context, isDark, scaffoldBg, textColor),
      body: Column(
        children: [
          // Linear indicator at the top showing reading progress
          LinearProgressIndicator(
            value: _scrollProgress,
            backgroundColor: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
            color: AppColors.primary,
            minHeight: 3,
          ),
          Expanded(
            child: Stack(
              children: [
                // Decorative background pattern
                _buildBackgroundPattern(isDark),
                ListView(
                  controller: _scrollController,
                  padding: const EdgeInsets.fromLTRB(24, 32, 24, 40),
                  physics: const BouncingScrollPhysics(),
                  children: [
                    _buildTopHeader(textColor, subTextColor),
                    const SizedBox(height: 32),
                    _buildSection(
                      "01",
                      "User Responsibilities",
                      "Users must provide accurate personal information during registration. You are responsible for account confidentiality. Unauthorized data scraping or fraudulent reservations are strictly prohibited.",
                      textColor,
                      subTextColor,
                    ),
                    _buildPrescriptionSection(isDark, cardBg, borderColor, textColor, subTextColor),
                    _buildSection(
                      "03",
                      "Reservation Policies",
                      "Reservations are valid for 1 hours. Failure to collect within this window results in automatic cancellation. Pharmacies may cancel based on stock levels.",
                      textColor,
                      subTextColor,
                    ),
                    _buildSection(
                      "04",
                      "Privacy & Data",
                      "We value your health data. All personal records are encrypted and used only to facilitate services with licensed pharmacies.",
                      textColor,
                      subTextColor,
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

  // Header without the version/legal tag
  Widget _buildTopHeader(Color textColor, Color subTextColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 16),
        Text(
          "Terms of Service", 
          style: GoogleFonts.plusJakartaSans(
            fontSize: 32, 
            fontWeight: FontWeight.w800, 
            color: textColor, 
            letterSpacing: -1
          )
        ),
        const SizedBox(height: 8),
        Text(
          "Last updated on March 07, 2026", 
          style: TextStyle(color: subTextColor.withOpacity(0.6), fontSize: 14)
        ),
      ],
    );
  }

  // Helper widget to build standard text sections
  Widget _buildSection(String index, String title, String content, Color textColor, Color subTextColor) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                index, 
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14, 
                  fontWeight: FontWeight.w900, 
                  color: AppColors.primary.withOpacity(0.5)
                )
              ),
              const SizedBox(width: 12),
              Text(
                title, 
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 18, 
                  fontWeight: FontWeight.w700, 
                  color: textColor
                )
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            content, 
            textAlign: TextAlign.justify, // Added for clean sentence alignments
            style: TextStyle(color: subTextColor, fontSize: 15, height: 1.6)
          ),
        ],
      ),
    );
  }

  // Specific highlighted card for prescription information
  Widget _buildPrescriptionSection(bool isDark, Color cardBg, Color borderColor, Color textColor, Color subTextColor) {
    return Container(
      margin: const EdgeInsets.only(bottom: 32),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.description_outlined, color: AppColors.primary),
              const SizedBox(width: 12),
              Text(
                "Prescription Requirements", 
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 17, 
                  fontWeight: FontWeight.w700,
                  color: textColor
                )
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            "Regulated medicines require a valid prescription. You must present the physical copy to the pharmacist during pickup.", 
            textAlign: TextAlign.justify, // Added for clean sentence alignments
            style: TextStyle(color: subTextColor, fontSize: 14, height: 1.6)
          ),
        ],
      ),
    );
  }

  // Visual background layer with repeating icons
  Widget _buildBackgroundPattern(bool isDark) {
    return Positioned.fill(
      child: Opacity(
        opacity: isDark ? 0.03 : 0.02, 
        child: GridView.builder(
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 4), 
          itemBuilder: (c, i) => Icon(
            Icons.gavel_rounded, 
            size: 40, 
            color: isDark ? Colors.white : Colors.black
          )
        )
      ),
    );
  }

  // Standard AppBar configuration
  PreferredSizeWidget _buildAppBar(BuildContext context, bool isDark, Color bgColor, Color textColor) {
    return AppBar(
      backgroundColor: bgColor,
      elevation: 0,
      leading: IconButton(
        onPressed: () => Navigator.pop(context), 
        icon: Icon(
          Icons.arrow_back_ios_new_rounded, 
          color: isDark ? Colors.white70 : AppColors.primary, 
          size: 20
        )
      ),
      title: Text(
        "Legal", 
        style: GoogleFonts.plusJakartaSans(
          color: textColor, 
          fontWeight: FontWeight.w700, 
          fontSize: 16
        )
      ),
      centerTitle: true,
    );
  }
}
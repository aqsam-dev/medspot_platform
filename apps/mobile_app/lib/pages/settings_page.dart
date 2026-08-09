import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:medspot/main.dart';
import 'package:medspot/pages/rating_review.dart';
import 'package:provider/provider.dart';
import 'package:overlay_support/overlay_support.dart';
// Ensure these files exist in your project for navigation to work
import 'login_page.dart';
import 'profile_page.dart';
import 'privacy_page.dart';
import 'help_support.dart';

class MedSpotSettings extends StatelessWidget {
  const MedSpotSettings({super.key});

  // Theme Constants
  static const Color primary = Color(0xFF2A4ECA);
  static const Color primaryDark = Color(0xFF1E3A8A);

  // --- LOGOUT DIALOG LOGIC ---
  void _showLogoutDialog(BuildContext context, bool isDark) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          "Logout",
          style: GoogleFonts.manrope(
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : Colors.black,
          ),
        ),
        content: Text(
          "Are you sure you want to logout?",
          style: GoogleFonts.manrope(
            color: isDark
                ? Colors.white70
                : Colors.black87, // Fixed black80 error
          ),
        ),
        actions: [
          TextButton(
            // User chooses NO: Close dialog and stay on Settings
            onPressed: () => Navigator.pop(context),
            child: const Text("No", style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            // User chooses YES: Show sticky notification and navigate to Login
            onPressed: () {
              Navigator.pop(context); // Close dialog

              // Sticky success notification using OverlaySupport
              showOverlayNotification((context) {
                return MessageNotification(
                  message: "Logged out successfully",
                  onReply: () => OverlaySupportEntry.of(context)?.dismiss(),
                );
              });

              // Navigate to Login and clear backstack
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(
                  builder: (context) => const MedSpotLoginPage(),
                ),
                (route) => false,
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            child: const Text(
              "Yes, Logout",
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Accessing the Theme Provider
    final themeProvider = Provider.of<ThemeProvider>(context);
    final bool isDark = themeProvider.isDarkMode;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Stack(
        children: [
          // Medical background pattern
          Positioned.fill(
            child: Opacity(
              opacity: isDark ? 0.01 : 0.03,
              child: Image.network(
                'https://www.transparenttextures.com/patterns/medical-items.png',
                repeat: ImageRepeat.repeat,
              ),
            ),
          ),

          SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(context),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 32, 20, 140),
                  child: Column(
                    children: [
                      _buildSectionHeader("Account & Security"),

                      // Account Tile -> Navigates to Profile
                      _buildSettingsTile(
                        context,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) =>
                                  const PremiumProfileScreen(),
                            ),
                          );
                        },
                        icon: Icons.person_rounded,
                        title: "My profile",
                        subtitle:
                            "Personal info", // Removed health records line
                        gradient: [primary, const Color(0xFF4F70FF)],
                      ),
                      const SizedBox(height: 12),

                      // Privacy Tile -> Navigates to Help Support
                      _buildSettingsTile(
                        context,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const PrivacyPolicyPage(),
                            ),
                          );
                        },
                        icon: Icons.shield_outlined,
                        title: "Privacy",
                        subtitle: "Data & security", // Removed biometric text
                        iconColor: Colors.indigo,
                      ),
                      const SizedBox(height: 32),

                      _buildSectionHeader("App Preferences"),
                      _buildSettingsTile(
                        context,
                        icon: Icons.notifications_active_outlined,
                        title: "Notifications",
                        subtitle: "Alert preferences & sounds",
                        iconColor: Colors.amber[700]!,
                      ),
                      const SizedBox(height: 12),

                      // ✅ Rate & Review Tile with Navigation (Replaced App Language)
                      _buildSettingsTile(
                        context,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const PharmacyReviewScreen(),
                            ),
                          );
                        },
                        icon: Icons.rate_review_rounded,
                        title: "Rate & Review",
                        subtitle: "Share your experience",
                        iconColor: Colors.teal,
                      ),
                      const SizedBox(height: 12),

                      // Dark Theme Toggle
                      _buildSettingsTile(
                        context,
                        icon: isDark
                            ? Icons.dark_mode
                            : Icons.light_mode_outlined,
                        title: "App Theme",
                        subtitle: isDark
                            ? "Dark Mode Active"
                            : "Light Mode Active",
                        iconColor: Colors.deepPurple,
                        trailingWidget: Switch(
                          value: isDark,
                          activeColor: primary,
                          onChanged: (value) =>
                              themeProvider.toggleTheme(value),
                        ),
                      ),
                      const SizedBox(height: 32),

                      _buildSectionHeader("Support"),

                      // Help Tile -> Navigates to Rating Review
                      _buildSettingsTile(
                        context,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const SupportCenterScreen(),
                            ),
                          );
                        },
                        icon: Icons.headset_mic_outlined,
                        title: "Help", // Removed & Feedback
                        subtitle: "24/7 Premium support hub",
                        iconColor: Colors.blueAccent,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Logout Button at the bottom
          _buildBottomButton(context, isDark),
        ],
      ),
    );
  }

  // --- UI COMPONENTS ---

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 60, 24, 32),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [primary, primaryDark],
        ),
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(40)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              GestureDetector(
                onTap: () => Navigator.pop(context),
                child: _buildBlurIcon(Icons.arrow_back_ios_new_rounded),
              ),
              const SizedBox(
                width: 40,
              ), // Maintained layout spacing without star icon
            ],
          ),
          const SizedBox(height: 24),
          Text(
            "Settings",
            style: GoogleFonts.manrope(
              fontSize: 32,
              fontWeight: FontWeight.w800,
              color: Colors.white,
              letterSpacing: -1,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBlurIcon(IconData icon) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, color: Colors.white, size: 20),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 8, bottom: 16),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          color: Color(0xFF94A3B8),
          fontSize: 11,
          fontWeight: FontWeight.w900,
          letterSpacing: 1.5,
        ),
      ),
    );
  }

  Widget _buildSettingsTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    VoidCallback? onTap,
    Color? iconColor,
    List<Color>? gradient,
    String? trailingText,
    Widget? trailingWidget,
    String? badge,
  }) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        margin: const EdgeInsets.only(bottom: 4),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E293B) : Colors.white,
          borderRadius: BorderRadius.circular(28),
          border: Border.all(
            color: isDark
                ? Colors.white.withOpacity(0.05)
                : const Color(0xFFF1F5F9),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors:
                      gradient ??
                      [
                        (iconColor ?? primary).withOpacity(0.1),
                        (iconColor ?? primary).withOpacity(0.2),
                      ],
                ),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(
                icon,
                color: gradient != null ? Colors.white : (iconColor ?? primary),
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
                      color: isDark ? Colors.white : const Color(0xFF1E293B),
                    ),
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            if (trailingWidget != null) trailingWidget,
            if (trailingText != null)
              Text(
                trailingText,
                style: const TextStyle(
                  color: primary,
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
                ),
              ),
            if (badge != null)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  badge,
                  style: const TextStyle(
                    color: Colors.green,
                    fontWeight: FontWeight.w900,
                    fontSize: 9,
                  ),
                ),
              ),
            if (trailingWidget == null)
              const Icon(
                Icons.arrow_forward_ios_rounded,
                color: Color(0xFFCBD5E1),
                size: 14,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomButton(BuildContext context, bool isDark) {
    return Align(
      alignment: Alignment.bottomCenter,
      child: Container(
        padding: const EdgeInsets.all(24),
        color: Theme.of(context).scaffoldBackgroundColor,
        child: ElevatedButton.icon(
          onPressed: () => _showLogoutDialog(context, isDark),
          icon: const Icon(Icons.logout_rounded, size: 20),
          label: const Text(
            "Logout Account",
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
            foregroundColor: Colors.redAccent,
            minimumSize: const Size(double.infinity, 64),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
              side: BorderSide(
                color: isDark
                    ? Colors.red.withOpacity(0.2)
                    : const Color(0xFFFEE2E2),
                width: 1.5,
              ),
            ),
            elevation: 0,
          ),
        ),
      ),
    );
  }
}

// --- STICKY NOTIFICATION COMPONENT ---
class MessageNotification extends StatelessWidget {
  final String message;
  final VoidCallback onReply;

  const MessageNotification({
    super.key,
    required this.message,
    required this.onReply,
  });

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      color: Colors.transparent,
      child: SafeArea(
        child: Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B) : Colors.green,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              const Icon(Icons.check_circle_outline, color: Colors.white),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  message,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 20),
                onPressed: onReply,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

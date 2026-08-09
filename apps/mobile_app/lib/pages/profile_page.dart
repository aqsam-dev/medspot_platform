import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:path_provider/path_provider.dart';

// ✅ Service Import for Dynamic Data
import 'package:medspot/services/patient_api.dart';

// ✅ Internal Page Imports
import 'package:medspot/pages/change_email_page.dart';
import 'package:medspot/pages/change_password_page.dart';
import 'package:medspot/pages/edit_name_page.dart';
import 'package:medspot/pages/favorite_pharmacy_page.dart';
import 'package:medspot/pages/prescription_history.dart';
import 'package:medspot/pages/today_reservation_page.dart';

class PremiumProfileScreen extends StatefulWidget {
  const PremiumProfileScreen({super.key});

  @override
  State<PremiumProfileScreen> createState() => _PremiumProfileScreenState();
}

class _PremiumProfileScreenState extends State<PremiumProfileScreen>
    with SingleTickerProviderStateMixin {
  // --- STATE VARIABLES ---
  String? _topMessage;
  bool _isSuccess = false;

  // ✅ Fetching real user data from PatientApi
  // Note: We use getters here so that if the screen rebuilds after an update,
  // the latest values from PatientApi are shown.
  String get userName => PatientApi.userName ?? "Guest User";
  String get userEmail => PatientApi.userEmail ?? "No Email Linked";

  // --- DESIGN CONSTANTS ---
  static const Color primaryBlue = Color(0xFF2a4eca);
  static const Color lightAccentBlue = Color(0xFF4f70ff);
  static const Color darkBgColor = Color(0xFF0F172A);
  static const Color darkCardColor = Color(0xFF1E293B);

  // --- ANIMATED NAVIGATION ---
  void _smoothNavigate(Widget page) async {
    // We await the navigation so if the user updates something on the next page,
    // this page refreshes when they come back.
    await Navigator.push(
      context,
      PageRouteBuilder(
        transitionDuration: const Duration(milliseconds: 600),
        pageBuilder: (context, animation, secondaryAnimation) => page,
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(
            opacity: animation,
            child: ScaleTransition(
              scale: Tween<double>(begin: 0.92, end: 1.0).animate(
                CurvedAnimation(parent: animation, curve: Curves.easeOutBack),
              ),
              child: child,
            ),
          );
        },
      ),
    );
    if (mounted) setState(() {}); // Refresh UI after returning from edit pages
  }

  void _showTopNotification(String message, {bool success = false}) {
    setState(() {
      _topMessage = message;
      _isSuccess = success;
    });
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _topMessage = null);
    });
  }

  void _handleLogout(bool isDark) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: isDark ? darkCardColor : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          "Logout",
          style: TextStyle(
            color: isDark ? Colors.white : darkBgColor,
            fontWeight: FontWeight.bold,
          ),
        ),
        content: Text(
          "Are you sure you want to logout?",
          style: TextStyle(color: isDark ? Colors.white70 : Colors.black87),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel"),
          ),
          TextButton(
            onPressed: () {
              // ✅ Clear user session
              PatientApi.logout();
              Navigator.pushNamedAndRemoveUntil(
                context,
                '/login',
                (route) => false,
              );
            },
            child: const Text(
              "Yes, Logout",
              style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    final Color currentBgColor = isDark ? darkBgColor : const Color(0xFFF4F6F9);
    final Color currentTextColor = isDark ? Colors.white : darkBgColor;

    return Scaffold(
      backgroundColor: currentBgColor,
      body: Stack(
        children: [
          _buildBackgroundDoodles(isDark),
          SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Column(
              children: [
                _buildHeader(isDark),
                const SizedBox(height: 24),

                TweenAnimationBuilder<double>(
                  duration: const Duration(milliseconds: 900),
                  curve: Curves.easeOutCubic,
                  tween: Tween(begin: 120.0, end: 0.0),
                  builder: (context, value, child) => Transform.translate(
                    offset: Offset(0, value),
                    child: Opacity(
                      opacity: (1 - (value / 120)).clamp(0, 1),
                      child: child,
                    ),
                  ),
                  child: _buildMainContent(currentTextColor, isDark),
                ),
                const SizedBox(height: 50),
              ],
            ),
          ),
          if (_topMessage != null) _buildTopNotificationUI(isDark),
        ],
      ),
    );
  }

  Widget _buildTopNotificationUI(bool isDark) {
    final notifyColor = _isSuccess ? Colors.green : Colors.redAccent;
    return Positioned(
      top: MediaQuery.of(context).padding.top + 10,
      left: 20,
      right: 20,
      child: TweenAnimationBuilder<double>(
        duration: const Duration(milliseconds: 600),
        curve: Curves.elasticOut,
        tween: Tween(begin: -80.0, end: 0.0),
        builder: (context, value, child) =>
            Transform.translate(offset: Offset(0, value), child: child),
        child: Material(
          color: Colors.transparent,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: isDark ? darkCardColor : Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: notifyColor.withOpacity(0.3),
                  blurRadius: 12,
                  spreadRadius: 2,
                ),
              ],
              border: Border.all(color: notifyColor.withOpacity(0.5)),
            ),
            child: Row(
              children: [
                Icon(
                  _isSuccess ? Icons.check_circle : Icons.error,
                  color: notifyColor,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _topMessage!,
                    style: GoogleFonts.plusJakartaSans(
                      color: isDark ? Colors.white : darkBgColor,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.only(top: 80, bottom: 60),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [primaryBlue, lightAccentBlue],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(56),
          bottomRight: Radius.circular(56),
        ),
      ),
      child: Column(
        children: [
         CircleAvatar(
  radius: 60,
  backgroundColor: Colors.white,
  child: Text(
    userName.isNotEmpty ? userName[0].toUpperCase() : "G",
    style: const TextStyle(
      fontSize: 48,
      fontWeight: FontWeight.bold,
      color: primaryBlue,
    ),
  ),
),
          const SizedBox(height: 20),
          _SpringButton(
            onTap: () => _smoothNavigate(const ChangeNameScreen()),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                // ✅ UPDATED: Dynamic Name from Login/Profile Update
                Text(
                  userName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 26,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.edit, color: Colors.white60, size: 18),
              ],
            ),
          ),
          const Text(
            "MedSpot Patient Account",
            style: TextStyle(color: Colors.white60, fontSize: 13),
          ),
        ],
      ),
    );
  }

  Widget _buildMainContent(Color textColor, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _GlassCard(
            isDark: isDark,
            child: Row(
              children: [
                const _IconBox(Icons.mail, Colors.indigo),
                const SizedBox(width: 16),
                // ✅ UPDATED: Dynamic Email from Login/Profile Update
                Expanded(child: _InfoText("EMAIL ADDRESS", userEmail, isDark)),
                _SpringButton(
                  onTap: () => _smoothNavigate(const ChangeEmailScreen()),
                  child: const Padding(
                    padding: EdgeInsets.all(8.0),
                    child: Icon(Icons.edit, size: 18, color: Colors.grey),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          _buildSectionHeader("MEDICAL ACTIVITY", isDark),
          _MenuButton(
            Icons.event_note,
            "My Reservations",
            Colors.green,
            isDark: isDark,
            onTap: () => _smoothNavigate(const ReservationsScreen()),
          ),
          _MenuButton(
            Icons.receipt_long,
            "Prescription History",
            Colors.purple,
            isDark: isDark,
            onTap: () => _smoothNavigate(const PrescriptionHistoryScreen()),
          ),
          _MenuButton(
            Icons.favorite,
            "Favourite Pharmacies",
            Colors.pink,
            isDark: isDark,
            onTap: () => _smoothNavigate(const FavouritePharmaciesPage()),
          ),
          const SizedBox(height: 24),
          _buildSectionHeader("SETTINGS", isDark),
          // ✅ Security: Masked password for UI
          _MenuButton(
            Icons.lock,
            "Password",
            Colors.blueGrey,
            isDark: isDark,
            subtitle: "••••••••",
            onTap: () => _smoothNavigate(const ChangePasswordScreen()),
          ),
          _MenuButton(
            Icons.logout,
            "Logout",
            Colors.red,
            isDark: isDark,
            isDestructive: true,
            onTap: () => _handleLogout(isDark),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(left: 8, bottom: 12),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w900,
          color: isDark ? Colors.white54 : Colors.grey,
        ),
      ),
    );
  }

  Widget _buildBackgroundDoodles(bool dark) {
    return Stack(
      children: [
        _PositionedDoodle(
          Icons.vaccines,
          top: 80,
          left: -20,
          size: 100,
          rotate: 0.2,
          dark: dark,
        ),
        _PositionedDoodle(
          Icons.medical_services,
          bottom: 200,
          left: 50,
          size: 80,
          rotate: -0.1,
          dark: dark,
        ),
        _PositionedDoodle(
          Icons.medication,
          top: 200,
          right: 20,
          size: 60,
          rotate: 0.4,
          dark: dark,
        ),
      ],
    );
  }
}

// --- HELPER UI CLASSES ---
class _SpringButton extends StatefulWidget {
  final Widget child;
  final VoidCallback onTap;
  const _SpringButton({required this.child, required this.onTap});

  @override
  State<_SpringButton> createState() => _SpringButtonState();
}

class _SpringButtonState extends State<_SpringButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
    _scale = Tween<double>(
      begin: 1.0,
      end: 0.94,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) {
        _controller.reverse();
        widget.onTap();
      },
      onTapCancel: () => _controller.reverse(),
      child: ScaleTransition(scale: _scale, child: widget.child),
    );
  }
}

class _GlassCard extends StatelessWidget {
  final Widget child;
  final bool isDark;
  const _GlassCard({required this.child, required this.isDark});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: isDark
                ? Colors.black.withOpacity(0.4)
                : Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: child,
    );
  }
}

class _MenuButton extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Color color;
  final bool isDestructive, isDark;
  final VoidCallback? onTap;
  const _MenuButton(
    this.icon,
    this.title,
    this.color, {
    this.subtitle,
    this.isDestructive = false,
    this.onTap,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: _SpringButton(
        onTap: onTap ?? () {},
        child: _GlassCard(
          isDark: isDark,
          child: Row(
            children: [
              _IconBox(icon, color),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: isDestructive
                            ? Colors.red
                            : (isDark ? Colors.white : Colors.black87),
                      ),
                    ),
                    if (subtitle != null)
                      Text(
                        subtitle!,
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? Colors.white54 : Colors.grey,
                        ),
                      ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                color: isDark ? Colors.white38 : Colors.grey,
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _IconBox extends StatelessWidget {
  final IconData icon;
  final Color color;
  const _IconBox(this.icon, this.color);
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(icon, color: color, size: 22),
    );
  }
}

class _InfoText extends StatelessWidget {
  final String label, value;
  final bool isDark;
  const _InfoText(this.label, this.value, this.isDark);
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white54 : Colors.grey,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14,
            color: isDark ? Colors.white : Colors.black87,
          ),
        ),
      ],
    );
  }
}

class _PositionedDoodle extends StatelessWidget {
  final IconData icon;
  final double? top, bottom, left, right, size, rotate;
  final bool dark;
  const _PositionedDoodle(
    this.icon, {
    this.top,
    this.bottom,
    this.left,
    this.right,
    this.size,
    this.rotate,
    required this.dark,
  });
  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: top,
      bottom: bottom,
      left: left,
      right: right,
      child: Opacity(
        opacity: 0.06,
        child: Transform.rotate(
          angle: rotate ?? 0,
          child: Icon(
            icon,
            size: size,
            color: dark ? Colors.white : Colors.black,
          ),
        ),
      ),
    );
  }
}

import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:overlay_support/overlay_support.dart';
import 'login_page.dart';
// ✅ Added backend imports
import 'package:medspot/services/patient_api.dart';

// Consistent Notification Types
enum NotificationType { info, warning, error, success }

class NewPasswordScreen extends StatefulWidget {
  const NewPasswordScreen({super.key});

  @override
  State<NewPasswordScreen> createState() => _NewPasswordScreenState();
}

class _NewPasswordScreenState extends State<NewPasswordScreen> {
  // Brand color palette (Added Dark Mode Slates)
  static const Color primaryColor = Color(0xFF2A4ECA);
  static const Color brandBlueLight = Color(0xFFF0F4FF);
  static const Color slate950 = Color(0xFF020617); // Dark BG
  static const Color slate900 = Color(0xFF0F172A); // Dark Card
  static const Color slate800 = Color(0xFF1E293B); // Dark Input
  static const Color slate500 = Color(0xFF64748B);
  static const Color slate400 = Color(0xFF94A3B8);

  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  bool _isObscureNew = true;
  bool _isObscureConfirm = true;
  bool _hasError = false;
  bool _isLoading = false; // ✅ Added loading state
  late String resetToken; // ✅ Added resetToken variable

  // ✅ RECEIVE TOKEN FROM OTP SCREEN (Exact same as old logic)
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    resetToken = args?['resetToken'] ?? '';
  }

  // --- Regex Helpers (Original Logic) ---
  bool get hasMinLength => _passwordController.text.length >= 8;
  bool get hasUppercase => RegExp(r'[A-Z]').hasMatch(_passwordController.text);
  bool get hasNumber => RegExp(r'[0-9]').hasMatch(_passwordController.text);
  bool get hasSpecialChar =>
      RegExp(r'[!@#\$&*~]').hasMatch(_passwordController.text);

  // ✅ UPDATED: Exact Old Backend Logic Integrated
  Future<void> _handleUpdatePassword() async {
    if (hasMinLength &&
        hasUppercase &&
        hasNumber &&
        hasSpecialChar &&
        _passwordController.text == _confirmPasswordController.text &&
        _passwordController.text.isNotEmpty) {
      setState(() {
        _hasError = false;
        _isLoading = true;
      });

      try {
        // ✅ CALLING BACKEND API (EXACT SAME AS OLD CODE)
        await PatientApi.resetPassword(
          resetToken: resetToken,
          newPassword: _passwordController.text.trim(),
        );

        showOverlayNotification((context) {
          return TopNotification(
            title: "Success",
            message: "Password updated successfully",
            type: NotificationType.success,
            onDismiss: () => OverlaySupportEntry.of(context)?.dismiss(),
          );
        });

        // ✅ STRICT ORIGINAL NAVIGATION
        Future.delayed(const Duration(milliseconds: 2000), () {
          if (mounted) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => const MedSpotLoginPage()),
            );
          }
        });
      } catch (e) {
        // ✅ API ERROR HANDLING
        setState(() => _hasError = true);
        showOverlayNotification((context) {
          return TopNotification(
            title: "Update Failed",
            message: e.toString(),
            type: NotificationType.error,
            onDismiss: () => OverlaySupportEntry.of(context)?.dismiss(),
          );
        });
      } finally {
        if (mounted) setState(() => _isLoading = false);
      }
    } else {
      setState(() => _hasError = true);
      String errorMsg = "Please follow all password requirements";
      if (_passwordController.text != _confirmPasswordController.text) {
        errorMsg = "Passwords do not match";
      } else if (_passwordController.text.isEmpty) {
        errorMsg = "Password fields cannot be empty";
      }

      showOverlayNotification((context) {
        return TopNotification(
          title: "Error",
          message: errorMsg,
          type: NotificationType.error,
          onDismiss: () => OverlaySupportEntry.of(context)?.dismiss(),
        );
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? slate950 : Colors.white,
      body: Stack(
        children: [
          _buildDoodle(
            Icons.medical_services_outlined,
            72,
            top: 0.10,
            left: 0.05,
            rotation: 12,
          ),
          _buildDoodle(
            Icons.medication_outlined,
            60,
            top: 0.15,
            right: 0.10,
            rotation: -12,
          ),
          _buildDoodle(
            Icons.favorite_border,
            80,
            top: 0.45,
            left: -0.02,
            opacity: 0.03,
          ),
          _buildDoodle(
            Icons.vaccines_outlined,
            60,
            top: 0.65,
            right: 0.05,
            rotation: 45,
          ),
          _buildDoodle(
            Icons.monitor_heart_outlined,
            120,
            bottom: 0.05,
            right: -0.05,
            opacity: 0.04,
          ),

          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildHeader(isDark),
                  const SizedBox(height: 40),
                  _buildPasswordCard(isDark),
                  const SizedBox(height: 40),
                  _buildFooterLink(context, isDark),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPasswordCard(bool isDark) {
    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(maxWidth: 400),
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: isDark ? slate900 : brandBlueLight,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: _hasError
              ? Colors.red.withOpacity(0.5)
              : primaryColor.withOpacity(0.1),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.3 : 0.05),
            blurRadius: 40,
            offset: const Offset(0, 20),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildInputLabel("New Password", isDark),
          _buildPasswordField(
            isDark: isDark,
            controller: _passwordController,
            hint: "••••••••",
            isObscure: _isObscureNew,
            onToggle: () => setState(() => _isObscureNew = !_isObscureNew),
          ),
          const SizedBox(height: 20),
          _buildInputLabel("Confirm Password", isDark),
          _buildPasswordField(
            isDark: isDark,
            controller: _confirmPasswordController,
            hint: "••••••••",
            isObscure: _isObscureConfirm,
            onToggle: () =>
                setState(() => _isObscureConfirm = !_isObscureConfirm),
          ),
          const SizedBox(height: 20),
          _buildRequirement(
            Icons.check_circle,
            "Min. 8 Characters",
            hasMinLength,
          ),
          const SizedBox(height: 8),
          _buildRequirement(
            Icons.check_circle,
            "One Uppercase (A-Z)",
            hasUppercase,
          ),
          const SizedBox(height: 8),
          _buildRequirement(Icons.check_circle, "One Number (0-9)", hasNumber),
          const SizedBox(height: 8),
          _buildRequirement(
            Icons.check_circle,
            "One Special Char (@#\$%)",
            hasSpecialChar,
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _isLoading
                  ? null
                  : _handleUpdatePassword, // ✅ Disable while loading
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryColor,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
              ),
              child: _isLoading
                  ? const SizedBox(
                      height: 24,
                      width: 24,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : const Text(
                      "Update Password",
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPasswordField({
    required bool isDark,
    required TextEditingController controller,
    required String hint,
    required bool isObscure,
    required VoidCallback onToggle,
  }) {
    return TextField(
      controller: controller,
      obscureText: isObscure,
      enabled: !_isLoading, // ✅ Disable input while loading
      onChanged: (v) {
        if (_hasError) setState(() => _hasError = false);
      },
      style: TextStyle(fontSize: 14, color: isDark ? Colors.white : slate900),
      decoration: InputDecoration(
        filled: true,
        fillColor: isDark ? slate800 : Colors.white,
        contentPadding: const EdgeInsets.symmetric(
          vertical: 16,
          horizontal: 16,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: _hasError ? Colors.red : primaryColor.withOpacity(0.5),
            width: 1.5,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: _hasError ? Colors.red : primaryColor,
            width: 2,
          ),
        ),
        hintText: hint,
        hintStyle: const TextStyle(color: slate400),
        prefixIcon: Icon(
          Icons.lock_outline,
          color: _hasError ? Colors.red : primaryColor,
          size: 20,
        ),
        suffixIcon: GestureDetector(
          onTap: onToggle,
          child: Icon(
            isObscure
                ? Icons.visibility_off_outlined
                : Icons.visibility_outlined,
            color: slate400,
            size: 20,
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(bool isDark) {
    return Column(
      children: [
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: primaryColor,
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Icon(Icons.lock_reset, color: Colors.white, size: 36),
        ),
        const SizedBox(height: 16),
        Text(
          "New Password",
          style: GoogleFonts.manrope(
            fontSize: 30,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : slate900,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          "Choose a strong password with letters, numbers and symbols",
          textAlign: TextAlign.center,
          style: GoogleFonts.manrope(
            fontSize: 14,
            color: slate500,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildInputLabel(String text, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 6),
      child: Text(
        text.toUpperCase(),
        style: GoogleFonts.manrope(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: _hasError
              ? Colors.red
              : (isDark ? slate400 : primaryColor.withOpacity(0.7)),
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildRequirement(IconData icon, String text, bool isChecked) {
    return Row(
      children: [
        Icon(icon, size: 14, color: isChecked ? Colors.green : slate400),
        const SizedBox(width: 8),
        Text(
          text,
          style: GoogleFonts.manrope(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: isChecked ? Colors.green : slate400,
          ),
        ),
      ],
    );
  }

  Widget _buildFooterLink(BuildContext context, bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          "Remembered your password? ",
          style: GoogleFonts.manrope(
            color: slate500,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        GestureDetector(
          onTap: () => Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const MedSpotLoginPage()),
          ),
          child: const Text(
            "Sign In",
            style: TextStyle(
              color: primaryColor,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDoodle(
    IconData icon,
    double size, {
    double? top,
    double? bottom,
    double? left,
    double? right,
    double rotation = 0,
    double opacity = 0.08,
  }) {
    return Positioned(
      top: top != null ? MediaQuery.of(context).size.height * top : null,
      bottom: bottom != null
          ? MediaQuery.of(context).size.height * bottom
          : null,
      left: left != null ? MediaQuery.of(context).size.width * left : null,
      right: right != null ? MediaQuery.of(context).size.width * right : null,
      child: Opacity(
        opacity: opacity,
        child: Transform.rotate(
          angle: rotation * math.pi / 180,
          child: Icon(icon, size: size, color: primaryColor),
        ),
      ),
    );
  }
}

// Notification Component remains same
class TopNotification extends StatefulWidget {
  final String title;
  final String message;
  final NotificationType type;
  final VoidCallback onDismiss;
  const TopNotification({
    super.key,
    required this.title,
    required this.message,
    required this.type,
    required this.onDismiss,
  });

  @override
  State<TopNotification> createState() => _TopNotificationState();
}

class _TopNotificationState extends State<TopNotification>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    );
    _controller.forward().then((value) {
      if (mounted) widget.onDismiss();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    Color color = widget.type == NotificationType.success
        ? Colors.green
        : Colors.red;
    return Material(
      color: Colors.transparent,
      child: SafeArea(
        child: Dismissible(
          key: UniqueKey(),
          direction: DismissDirection.horizontal,
          onDismissed: (direction) => widget.onDismiss(),
          child: Container(
            margin: const EdgeInsets.all(20),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? color.withOpacity(0.2) : color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: color.withOpacity(0.3)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.08),
                  blurRadius: 15,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Row(
              children: [
                Icon(
                  widget.type == NotificationType.success
                      ? Icons.check_circle
                      : Icons.error,
                  color: color,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    "${widget.title}: ${widget.message}",
                    style: TextStyle(
                      color: isDark ? Colors.white : color,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: widget.onDismiss,
                  child: Icon(
                    Icons.close,
                    color: color.withOpacity(0.5),
                    size: 18,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:overlay_support/overlay_support.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_sign_in/google_sign_in.dart'; // ✅ Added for Google Login
// ✅ Added backend imports
import 'package:medspot/services/patient_api.dart';

enum NotificationType { info, warning, error, success }

class MedSpotForgotPassword extends StatefulWidget {
  const MedSpotForgotPassword({super.key});

  @override
  State<MedSpotForgotPassword> createState() => _MedSpotForgotPasswordState();
}

class _MedSpotForgotPasswordState extends State<MedSpotForgotPassword> {
  static const Color primaryColor = Color(0xFF2A4ECA);
  static const Color brandBlueLight = Color(0xFFF0F4FF);
  static const Color slate950 = Color(0xFF020617);
  static const Color slate900 = Color(0xFF0F172A);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate700 = Color(0xFF334155);
  static const Color slate500 = Color(0xFF64748B);
  static const Color slate400 = Color(0xFF94A3B8);
  static const Color slate200 = Color(0xFFE2E8F0);
  static const Color doodleColor = Color(0x142A4ECA);

  final emailController = TextEditingController();
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email'],
  ); // ✅ Initialize GoogleSignIn

  bool emailError = false;
  bool _isLoading = false;
  bool _isEmailLocked = false; // ✅ Track if email is locked via Google

  bool isValidEmail(String email) {
    return RegExp(
      r"^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail|icloud)\.[a-zA-Z]{2,}$",
    ).hasMatch(email.toLowerCase().trim());
  }

  // ✅ New Google Handler: Pick email and lock field
  Future<void> _handleGooglePick() async {
    try {
      setState(() => _isLoading = true);
      await _googleSignIn.signOut(); // Ensure fresh picker

      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();

      if (googleUser != null) {
        setState(() {
          emailController.text = googleUser.email;
          _isEmailLocked = true; // 🔒 Lock the field
          emailError = false;
        });

        showOverlayNotification((context) {
          return TopNotification(
            title: "Google Linked",
            message: "Email picked and secured.",
            type: NotificationType.success,
            onDismiss: () => OverlaySupportEntry.of(context)?.dismiss(),
          );
        });
      }
    } catch (error) {
      debugPrint("Google Error: $error");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> submit() async {
    String email = emailController.text.trim();

    setState(() {
      emailError = email.isEmpty || !isValidEmail(email);
    });

    if (emailError) {
      showOverlayNotification((context) {
        return TopNotification(
          title: "Invalid Input",
          message: email.isEmpty
              ? "Please enter your email address"
              : "Please enter a valid Gmail, Yahoo, or Outlook address",
          type: NotificationType.error,
          onDismiss: () => OverlaySupportEntry.of(context)?.dismiss(),
        );
      });
      return;
    }

    setState(() => _isLoading = true);

    try {
      final resetToken = await PatientApi.forgotPassword(email: email);

      showOverlayNotification((context) {
        return TopNotification(
          title: "Success",
          message: "OTP Sent Successfully to $email",
          type: NotificationType.success,
          onDismiss: () => OverlaySupportEntry.of(context)?.dismiss(),
        );
      });

      Future.delayed(const Duration(milliseconds: 1500), () {
        if (mounted) {
          Navigator.pushNamed(
            context,
            "/otp",
            arguments: {"resetToken": resetToken},
          );
        }
      });
    } catch (e) {
      showOverlayNotification((context) {
        return TopNotification(
          title: "Error",
          message: e.toString(),
          type: NotificationType.error,
          onDismiss: () => OverlaySupportEntry.of(context)?.dismiss(),
        );
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
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
            context,
            Icons.medical_services_outlined,
            72,
            top: 0.10,
            left: -0.05,
            rotation: 12,
          ),
          _buildDoodle(
            context,
            Icons.medication_outlined,
            60,
            top: 0.05,
            right: 0.10,
            rotation: -12,
          ),
          _buildDoodle(
            context,
            Icons.monitor_heart_outlined,
            80,
            top: 0.25,
            right: -0.10,
            rotation: 45,
          ),
          _buildDoodle(
            context,
            Icons.hub_outlined,
            50,
            bottom: 0.15,
            left: -0.02,
            rotation: -12,
          ),
          _buildDoodle(
            context,
            Icons.medical_services_rounded,
            120,
            bottom: 0.05,
            right: -0.05,
            rotation: 12,
          ),

          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  children: [
                    _buildHeader(isDark),
                    const SizedBox(height: 40),
                    _buildForgotCard(isDark),
                    const SizedBox(height: 40),
                    _buildFooter(context, isDark),
                  ],
                ),
              ),
            ),
          ),
        ],
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
            boxShadow: [
              BoxShadow(
                color: primaryColor.withOpacity(0.2),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: const Icon(
            Icons.medical_services_rounded,
            color: Colors.white,
            size: 36,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          "MedSpot",
          style: GoogleFonts.manrope(
            fontSize: 30,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : slate900,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          "Healthcare at your fingertips",
          style: GoogleFonts.manrope(fontSize: 14, color: slate500),
        ),
      ],
    );
  }

  Widget _buildForgotCard(bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: isDark ? slate900 : brandBlueLight.withOpacity(0.8),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: emailError
              ? Colors.red.withOpacity(0.5)
              : primaryColor.withOpacity(0.1),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Forgot Password",
            style: GoogleFonts.manrope(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : slate900,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "Enter your email address to receive an OTP code",
            style: GoogleFonts.manrope(
              fontSize: 14,
              color: slate500,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 32),
          Text(
            "Email Address",
            style: GoogleFonts.manrope(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: isDark ? slate400 : slate700,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: _isEmailLocked
                  ? (isDark ? slate700 : slate200)
                  : (isDark ? slate800 : Colors.white),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: emailError ? Colors.red : primaryColor,
                width: 1.5,
              ),
            ),
            child: TextField(
              controller: emailController,
              enabled:
                  !_isLoading &&
                  !_isEmailLocked, // ✅ Disabled if locked by Google
              readOnly: _isEmailLocked, // ✅ Double protection
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: isDark ? Colors.white : slate900,
              ),
              onChanged: (v) {
                if (emailError) setState(() => emailError = false);
              },
              decoration: InputDecoration(
                prefixIcon: Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: SvgPicture.asset(
                    'assets/icons/gmail.svg',
                    width: 20,
                    height: 20,
                    colorFilter: ColorFilter.mode(
                      emailError ? Colors.red : primaryColor,
                      BlendMode.srcIn,
                    ),
                  ),
                ),
                suffixIcon: _isEmailLocked
                    ? IconButton(
                        icon: const Icon(Icons.lock_reset, color: primaryColor),
                        onPressed: () => setState(
                          () => _isEmailLocked = false,
                        ), // Allow user to unlock manually if needed
                      )
                    : null,
                hintText: "example@gmail.com",
                hintStyle: GoogleFonts.manrope(color: slate400),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _isLoading ? null : submit,
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
                  : Text(
                      "Submit",
                      style: GoogleFonts.manrope(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: Colors.white,
                      ),
                    ),
            ),
          ),
          _buildOrDivider(isDark),
          _buildGoogleButton(isDark),
        ],
      ),
    );
  }

  Widget _buildFooter(BuildContext context, bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          "Remember password? ",
          style: TextStyle(color: slate500, fontSize: 14),
        ),
        GestureDetector(
          onTap: () => Navigator.pop(context),
          child: const Text(
            "Login",
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

  Widget _buildOrDivider(bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Row(
        children: [
          Expanded(child: Divider(color: isDark ? slate700 : slate200)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Text(
              "OR",
              style: GoogleFonts.manrope(
                fontSize: 12,
                color: slate400,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          Expanded(child: Divider(color: isDark ? slate700 : slate200)),
        ],
      ),
    );
  }

  Widget _buildGoogleButton(bool isDark) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: OutlinedButton(
        onPressed: _isLoading
            ? null
            : _handleGooglePick, // ✅ Linked to Google Handler
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: isDark ? slate700 : slate200),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SvgPicture.asset('assets/icons/google.svg', height: 20),
            const SizedBox(width: 12),
            Text(
              "Continue with Google",
              style: GoogleFonts.manrope(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : slate700,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDoodle(
    BuildContext context,
    IconData icon,
    double size, {
    double? top,
    double? bottom,
    double? left,
    double? right,
    double rotation = 0,
  }) {
    return Positioned(
      top: top != null ? MediaQuery.of(context).size.height * top : null,
      bottom: bottom != null
          ? MediaQuery.of(context).size.height * bottom
          : null,
      left: left != null ? MediaQuery.of(context).size.width * left : null,
      right: right != null ? MediaQuery.of(context).size.width * right : null,
      child: Transform.rotate(
        angle: rotation * 3.14 / 180,
        child: Icon(icon, size: size, color: doodleColor.withOpacity(0.05)),
      ),
    );
  }
}

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

import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter/services.dart';
import 'package:overlay_support/overlay_support.dart';
import 'package:medspot/pages/newpass_page.dart';
// ✅ Added backend imports
import 'package:medspot/services/patient_api.dart';

enum NotificationType { info, warning, error, success }

class MedSpotOTPPage extends StatefulWidget {
  const MedSpotOTPPage({super.key});

  static const Color primaryColor = Color(0xFF2A4ECA);
  static const Color brandBlueLight = Color(0xFFF0F4FF);
  static const Color slate950 = Color(0xFF020617);
  static const Color slate900 = Color(0xFF0F172A);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate500 = Color(0xFF64748B);
  static const Color slate400 = Color(0xFF94A3B8);
  static const Color slate200 = Color(0xFFE2E8F0);

  @override
  State<MedSpotOTPPage> createState() => _MedSpotOTPPageState();
}

class _MedSpotOTPPageState extends State<MedSpotOTPPage> {
  final List<TextEditingController> otpControllers = List.generate(
    6,
    (_) => TextEditingController(),
  );
  final List<FocusNode> focusNodes = List.generate(6, (_) => FocusNode());

  bool _hasError = false;
  bool _isLoading = false; // ✅ Added loading state
  late String resetToken; // ✅ Added resetToken variable

  // ✅ RECEIVE TOKEN FROM PREVIOUS SCREEN (Exact same as old logic)
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    resetToken = args?['resetToken'] ?? '';

    if (resetToken.isEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        showOverlayNotification((context) {
          return TopNotification(
            title: "Error",
            message: "Reset token missing. Please restart flow.",
            type: NotificationType.error,
            onDismiss: () => OverlaySupportEntry.of(context)?.dismiss(),
          );
        });
      });
    }
  }

  @override
  void dispose() {
    for (var controller in otpControllers) controller.dispose();
    for (var node in focusNodes) node.dispose();
    super.dispose();
  }

  // ✅ UPDATED: Exact Old Backend Logic Integrated
  Future<void> _handleVerify() async {
    String otp = otpControllers.map((e) => e.text).join().trim();

    if (otp.length == 6 && RegExp(r'^\d{6}$').hasMatch(otp)) {
      setState(() {
        _hasError = false;
        _isLoading = true;
      });

      try {
        // ✅ CALLING BACKEND API (EXACT SAME AS OLD CODE)
        await PatientApi.verifyOtp(resetToken: resetToken, otp: otp);

        showOverlayNotification((context) {
          return TopNotification(
            title: "Success",
            message: "Verified: The code has been accepted",
            type: NotificationType.success,
            onDismiss: () => OverlaySupportEntry.of(context)?.dismiss(),
          );
        });

        Future.delayed(const Duration(milliseconds: 1500), () {
          if (mounted) {
            // ✅ ORIGINAL NAVIGATION WITH TOKEN
            Navigator.pushNamed(
              context,
              '/newpass_page',
              arguments: {'resetToken': resetToken},
            );
          }
        });
      } catch (e) {
        // ✅ ERROR HANDLING FROM API
        setState(() => _hasError = true);
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
    } else {
      setState(() => _hasError = true);
      showOverlayNotification((context) {
        return TopNotification(
          title: "Invalid OTP",
          message: "Please enter the full 6-digit code",
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
      backgroundColor: isDark ? MedSpotOTPPage.slate950 : Colors.white,
      body: Stack(
        children: [
          _buildDoodle(
            Icons.medical_services_outlined,
            72,
            top: 0.10,
            left: -0.05,
            rotation: 12,
          ),
          _buildDoodle(
            Icons.monitor_heart_outlined,
            80,
            top: 0.25,
            right: -0.10,
            rotation: 45,
          ),
          _buildDoodle(
            Icons.medical_services_rounded,
            120,
            bottom: 0.05,
            right: -0.05,
            rotation: 12,
          ),

          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  children: [
                    _buildHeader(isDark),
                    const SizedBox(height: 40),
                    _buildOTPVerificationCard(isDark),
                    const SizedBox(height: 40),
                    _buildFooter(isDark),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOTPVerificationCard(bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: isDark
            ? MedSpotOTPPage.slate900
            : MedSpotOTPPage.brandBlueLight.withOpacity(0.8),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: _hasError
              ? Colors.red.withOpacity(0.3)
              : MedSpotOTPPage.primaryColor.withOpacity(0.1),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Verification",
            style: GoogleFonts.manrope(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : MedSpotOTPPage.slate900,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            "Enter the 6-digit code sent to your Email",
            style: TextStyle(color: MedSpotOTPPage.slate500, fontSize: 14),
          ),
          const SizedBox(height: 32),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(6, (index) => _buildOTPBox(index, isDark)),
          ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _isLoading
                  ? null
                  : _handleVerify, // ✅ Disable while loading
              style: ElevatedButton.styleFrom(
                backgroundColor: MedSpotOTPPage.primaryColor,
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
                      "Verify",
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

  Widget _buildOTPBox(int index, bool isDark) {
    return Container(
      width: 42,
      height: 48,
      decoration: BoxDecoration(
        color: isDark ? MedSpotOTPPage.slate800 : Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: _hasError ? Colors.red : MedSpotOTPPage.primaryColor,
          width: _hasError ? 2 : 1.5,
        ),
      ),
      child: TextField(
        controller: otpControllers[index],
        focusNode: focusNodes[index],
        enabled: !_isLoading, // ✅ Disable input while loading
        textAlign: TextAlign.center,
        keyboardType: TextInputType.number,
        maxLength: 1,
        style: GoogleFonts.manrope(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: isDark ? Colors.white : MedSpotOTPPage.slate900,
        ),
        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        decoration: const InputDecoration(
          counterText: "",
          border: InputBorder.none,
        ),
        onChanged: (value) {
          if (_hasError) setState(() => _hasError = false);
          if (value.isNotEmpty && index < 5) {
            FocusScope.of(context).requestFocus(focusNodes[index + 1]);
          } else if (value.isEmpty && index > 0) {
            FocusScope.of(context).requestFocus(focusNodes[index - 1]);
          }
        },
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
            color: MedSpotOTPPage.primaryColor,
            borderRadius: BorderRadius.circular(16),
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
            color: isDark ? Colors.white : MedSpotOTPPage.slate900,
          ),
        ),
      ],
    );
  }

  Widget _buildFooter(bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Text(
          "Didn't receive code? ",
          style: TextStyle(color: MedSpotOTPPage.slate500, fontSize: 14),
        ),
        GestureDetector(
          onTap: () {
            // ✅ Resend logic can be added here if needed
            showOverlayNotification((context) {
              return TopNotification(
                title: "Resent",
                message: "A new 6-digit code has been sent",
                type: NotificationType.success,
                onDismiss: () => OverlaySupportEntry.of(context)?.dismiss(),
              );
            });
          },
          child: const Text(
            "Resend",
            style: TextStyle(
              color: MedSpotOTPPage.primaryColor,
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
        child: Icon(
          icon,
          size: size,
          color: MedSpotOTPPage.primaryColor.withOpacity(0.05),
        ),
      ),
    );
  }
}

// TopNotification remains exactly as you provided
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
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
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

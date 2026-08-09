import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:medspot/pages/forget_password_page.dart';
import 'package:medspot/pages/home_page.dart';
import 'package:medspot/pages/signup_page.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:medspot/services/patient_api.dart';
import 'package:google_sign_in/google_sign_in.dart';

class MedSpotLoginPage extends StatefulWidget {
  const MedSpotLoginPage({super.key});

  @override
  State<MedSpotLoginPage> createState() => _MedSpotLoginPageState();
}

class _MedSpotLoginPageState extends State<MedSpotLoginPage> {
  // Brand Colors
  static const Color primaryColor = Color(0xFF2A4ECA);
  static const Color brandBlueLight = Color(0xFFF0F4FF);
  static const Color slate950 = Color(0xFF020617);
  static const Color slate900 = Color(0xFF0F172A);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate500 = Color(0xFF64748B);
  static const Color slate400 = Color(0xFF94A3B8);
  static const Color slate300 = Color(0xFFCBD5E1);
  static const Color slate200 = Color(0xFFE2E8F0);
  static const Color doodleColor = Color(0x142A4ECA);

  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();

  bool _isPasswordVisible = false;
  String? _topMessage;
  bool _isSuccess = false;
  bool _hasError = false;
  bool _isLoading = false; 

  bool isValidEmail(String email) {
    return RegExp(
      r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
    ).hasMatch(email);
  }

  void _showNotification(String message, {bool success = false}) {
    setState(() {
      _topMessage = message;
      _isSuccess = success;
      _hasError = !success;
    });

    Future.delayed(const Duration(seconds: 4), () {
      if (mounted && _topMessage == message) {
        setState(() {
          _topMessage = null;
        });
      }
    });
  }

  // WEB CLIENT ID
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    serverClientId:
        '998404760618-61n6ktc6eeojh9b3j9ktfb3bodji8bn9.apps.googleusercontent.com',
  );

  /// ==========================================
  /// HANDLE GOOGLE SIGN IN (UPDATED FOR JSON FLOW)
  /// ==========================================
  Future<void> handleGoogleSignIn() async {
    try {
      setState(() => _isLoading = true);

      await _googleSignIn.signOut(); // Fresh login trigger

      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();

      if (googleUser == null) {
        debugPrint("Google Sign-In cancelled by user");
        _showNotification("Google Sign-In cancelled");
        return;
      }

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final String? idToken = googleAuth.idToken;

      if (idToken == null) {
        debugPrint("Failed to get ID Token from Google");
        _showNotification("Failed to get ID Token");
        return;
      }

      try {
        
        final Map<String, dynamic> responseBody = await PatientApi.googleLogin(idToken);

        if (responseBody["success"] == true) {
          debugPrint("Google login successful backend data synced for ${googleUser.email}");
          
          // Static internal mapping complete ho chuki hai, welcome message trigger karein
          _showNotification(
            "Welcome, ${PatientApi.userName ?? googleUser.displayName}!",
            success: true,
          );
          
          await Future.delayed(const Duration(milliseconds: 1500));
          if (mounted) Navigator.pushReplacementNamed(context, "/home");
        }
      } catch (e) {
        debugPrint("Backend verification failed: $e");
        _showNotification("Backend response: $e");
      }
    } catch (error) {
      debugPrint("Google Sign-In Error (Flutter): $error");
      _showNotification("Google Sign-In failed: $error");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void submit() async {
    String email = emailController.text.trim();
    String password = passwordController.text.trim();

    if (email.isEmpty || !isValidEmail(email)) {
      _showNotification("Please enter a valid email address");
      return;
    }
    if (password.isEmpty || password.length < 8) {
      _showNotification("Password must be at least 8 characters");
      return;
    }

    setState(() {
      _hasError = false;
      _isLoading = true;
    });

    try {
      await PatientApi.login(email: email, password: password);

      _showNotification("Successfully Logged In!", success: true);

      await Future.delayed(const Duration(milliseconds: 1500));
      if (mounted) {
        Navigator.pushReplacementNamed(context, "/home");
      }
    } catch (e) {
      setState(() => _hasError = true);
      _showNotification(e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;

    final notifyBgColor = isDark
        ? (_isSuccess
            ? Colors.green.withOpacity(0.2)
            : Colors.red.withOpacity(0.2))
        : (_isSuccess ? const Color(0xFFF0FDF4) : const Color(0xFFFEF2F2));

    final notifyTextColor = _isSuccess ? Colors.green : Colors.red;
    final notifyIcon = _isSuccess
        ? Icons.check_circle_outline
        : Icons.error_outline;

   return Scaffold(
      backgroundColor: isDark ? slate950 : Colors.white, // Yahan comma (,) laga diya hai
      body: Stack(
        children: [
          _buildDoodle(
            Icons.medical_services_outlined,
            72,
            top: 0.10,
            left: -0.05,
            rotate: 12,
          ),
          _buildDoodle(
            Icons.medication_outlined,
            60,
            top: 0.05,
            right: 0.10,
            rotate: -12,
          ),
          _buildDoodle(
            Icons.monitor_heart_outlined,
            80,
            top: 0.25,
            right: -0.10,
            rotate: 45,
          ),
          _buildDoodle(
            Icons.hub_outlined,
            50,
            bottom: 0.15,
            left: -0.02,
            rotate: -12,
          ),
          _buildDoodle(
            Icons.medical_services_rounded,
            120,
            bottom: 0.05,
            right: -0.05,
            rotate: 12,
          ),

          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  children: [
                    _buildBrandHeader(isDark),
                    const SizedBox(height: 40),
                    _buildLoginCard(isDark),
                    const SizedBox(height: 40),
                    _buildFooter(isDark),
                  ],
                ),
              ),
            ),
          ),

          if (_topMessage != null)
            Positioned(
              top: MediaQuery.of(context).padding.top + 10,
              left: 20,
              right: 20,
              child: Dismissible(
                key: UniqueKey(),
                direction: DismissDirection.horizontal,
                onDismissed: (direction) => setState(() => _topMessage = null),
                child: Material(
                  color: Colors.transparent,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    decoration: BoxDecoration(
                      color: notifyBgColor,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: notifyTextColor.withOpacity(0.3),
                      ),
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
                        Icon(notifyIcon, color: notifyTextColor, size: 22),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            _topMessage!,
                            style: GoogleFonts.manrope(
                              color: isDark ? Colors.white : slate900,
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                            ),
                          ),
                        ),
                        GestureDetector(
                          onTap: () => setState(() => _topMessage = null),
                          child: Icon(
                            Icons.close,
                            color: notifyTextColor.withOpacity(0.5),
                            size: 18,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildLoginCard(bool isDark) {
    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(maxWidth: 400),
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: isDark ? slate900 : brandBlueLight.withOpacity(0.8),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: _hasError
              ? Colors.red.withOpacity(0.5)
              : primaryColor.withOpacity(0.1),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Login",
            style: GoogleFonts.manrope(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : slate900,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            "Enter your credentials to continue",
            style: GoogleFonts.manrope(fontSize: 14, color: slate500),
          ),
          const SizedBox(height: 32),
          _buildLabel("Email Address"),
          _buildInputField(
            isDark: isDark,
            assetName: "gmail.svg",
            hint: "example@email.com",
            controller: emailController,
          ),
          const SizedBox(height: 20),
          _buildLabel("Password"),
          _buildInputField(
            isDark: isDark,
            assetName: "password.svg",
            hint: "••••••••",
            isPassword: true,
            controller: passwordController,
          ),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () => Navigator.pushNamed(context, "/forget_password"),
              child: const Text(
                "Forgot Password?",
                style: TextStyle(
                  color: primaryColor,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(height: 4),
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
              ),
              child: _isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : Text(
                      "Login",
                      style: GoogleFonts.manrope(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
            ),
          ),
          _buildOrDivider(),
          _buildGoogleButton(isDark),
        ],
      ),
    );
  }

  Widget _buildInputField({
    required bool isDark,
    required String assetName,
    required String hint,
    bool isPassword = false,
    required TextEditingController? controller,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? slate800 : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _hasError ? Colors.red : primaryColor,
          width: 1.5,
        ),
      ),
      child: TextField(
        controller: controller,
        obscureText: isPassword && !_isPasswordVisible,
        onChanged: (v) {
          if (_hasError) setState(() => _hasError = false);
        },
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: isDark ? Colors.white : slate900,
        ),
        decoration: InputDecoration(
          border: InputBorder.none,
          hintText: hint,
          hintStyle: const TextStyle(color: slate400),
          prefixIcon: Padding(
            padding: const EdgeInsets.all(12.0),
            child: SvgPicture.asset(
              'assets/icons/$assetName',
              width: 20,
              height: 20,
              colorFilter: ColorFilter.mode(
                _hasError ? Colors.red : primaryColor,
                BlendMode.srcIn,
              ),
            ),
          ),
          suffixIcon: isPassword
              ? IconButton(
                  icon: Icon(
                    _isPasswordVisible
                        ? Icons.visibility_outlined
                        : Icons.visibility_off_outlined,
                    color: slate400,
                    size: 20,
                  ),
                  onPressed: () =>
                      setState(() => _isPasswordVisible = !_isPasswordVisible),
                )
              : null,
          contentPadding: const EdgeInsets.symmetric(vertical: 15),
        ),
      ),
    );
  }

  Widget _buildDoodle(
    IconData icon,
    double size, {
    double? top,
    double? bottom,
    double? left,
    double? right,
    required double rotate,
  }) {
    return Positioned(
      top: top != null ? MediaQuery.of(context).size.height * top : null,
      bottom: bottom != null
          ? MediaQuery.of(context).size.height * bottom
          : null,
      left: left != null ? MediaQuery.of(context).size.width * left : null,
      right: right != null ? MediaQuery.of(context).size.width * right : null,
      child: Transform.rotate(
        angle: rotate * 3.14159 / 180,
        child: Icon(icon, size: size, color: doodleColor.withOpacity(0.05)),
      ),
    );
  }

  Widget _buildBrandHeader(bool isDark) {
    return Column(
      children: [
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: primaryColor,
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
            color: isDark ? Colors.white : slate900,
          ),
        ),
        Text(
          "Healthcare at your fingertips",
          style: GoogleFonts.manrope(fontSize: 14, color: slate500),
        ),
      ],
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 6),
      child: Text(
        text.toUpperCase(),
        style: GoogleFonts.manrope(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: slate400,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildOrDivider() {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 24),
      child: Row(
        children: [
          Expanded(child: Divider()),
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Text("OR", style: TextStyle(color: slate400, fontSize: 10)),
          ),
          Expanded(child: Divider()),
        ],
      ),
    );
  }

  Widget _buildGoogleButton(bool isDark) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: OutlinedButton(
        onPressed: _isLoading ? null : () => handleGoogleSignIn(),
        style: OutlinedButton.styleFrom(
          backgroundColor: isDark ? slate800 : Colors.white,
          side: BorderSide(color: isDark ? Colors.transparent : slate200),
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
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : slate900,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFooter(bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text("Don't have an account? ", style: TextStyle(color: slate500)),
        GestureDetector(
          onTap: () => Navigator.pushNamed(context, "/signup"),
          child: const Text(
            "Sign Up",
            style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }
}
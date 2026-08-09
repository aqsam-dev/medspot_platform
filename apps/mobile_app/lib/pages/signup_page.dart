import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:medspot/services/patient_api.dart'; // Ensure this path is correct

class Medspotsignup extends StatefulWidget {
  const Medspotsignup({super.key});

  @override
  State<Medspotsignup> createState() => _MedspotsignupState();
}

class _MedspotsignupState extends State<Medspotsignup> with TickerProviderStateMixin {
  // Brand Color Palette
  static const Color primaryColor = Color(0xFF2A4ECA);
  static const Color brandBlueLight = Color(0xFFF0F4FF);
  static const Color slate950 = Color(0xFF020617);
  static const Color slate900 = Color(0xFF0F172A);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate700 = Color(0xFF334155);
  static const Color slate500 = Color(0xFF64748B);
  static const Color slate400 = Color(0xFF94A3B8);
  static const Color slate300 = Color(0xFFCBD5E1);
  static const Color slate200 = Color(0xFFE2E8F0);
  static const Color doodleColor = Color(0x142A4ECA);

  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  
  // Google Sign In Instance
  final GoogleSignIn _googleSignIn = GoogleSignIn(scopes: ['email']);

  late AnimationController _floatingController;
  double _buttonScale = 1.0;
  bool _passwordVisible = false;
  bool _confirmVisible = false;
  bool _acceptedTerms = false; 
  String? _topMessage;
  bool _isSuccess = false;
  bool _hasError = false;
  bool _isLoading = false;
  bool _isEmailReadOnly = false;

  @override
  void initState() {
    super.initState();
    _floatingController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    )..repeat();
  }

  @override
  void dispose() {
    _floatingController.dispose();
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  // --- Logic Helpers ---

  bool isValidName(String name) => RegExp(r"^[A-Za-z ]{3,}$").hasMatch(name.trim());

  bool isValidEmail(String email) {
    return RegExp(
      r"^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail|icloud)\.[a-zA-Z]{2,}$",
    ).hasMatch(email.toLowerCase().trim());
  }

  bool isStrongPassword(String pass) => RegExp(
    r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#\$&*~]).{8,}$',
  ).hasMatch(pass.trim());

  void _showNotification(String message, {bool success = false}) {
    if (!mounted) return;
    setState(() {
      _topMessage = message;
      _isSuccess = success;
      _hasError = !success;
    });
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted && _topMessage == message) {
        setState(() => _topMessage = null);
      }
    });
  }

  Future<void> _handleGoogleSignup() async {
    try {
      setState(() => _isLoading = true);
      await _googleSignIn.signOut(); // Clear previous session

      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();

      if (googleUser == null) {
        _showNotification("Google Sign-In cancelled");
        return;
      }

      // Autofill fields with Google Data
      setState(() {
        _nameController.text = googleUser.displayName ?? "";
        _emailController.text = googleUser.email;
        _isEmailReadOnly = true; // Lock email field to prevent tampering
      });

      _showNotification("Google account linked!", success: true);
    } catch (error) {
      debugPrint("Google Signup Error: $error");
      _showNotification("Google Sign-In failed");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _submit() async {
    setState(() => _buttonScale = 0.95);
    await Future.delayed(const Duration(milliseconds: 100));
    setState(() => _buttonScale = 1.0);

    String name = _nameController.text.trim();
    String email = _emailController.text.trim();
    String password = _passwordController.text.trim();
    String confirm = _confirmController.text.trim();

    if (name.isEmpty || !isValidName(name)) {
      _showNotification("Please enter a valid Full Name (min 3 chars)");
      return;
    }
    if (email.isEmpty || !isValidEmail(email)) {
      _showNotification("Please enter a valid Email Address");
      return;
    }
    if (!isStrongPassword(password)) {
      _showNotification("Password needs: Uppercase, Number & Symbol");
      return;
    }
    if (password != confirm) {
      _showNotification("Passwords do not match!");
      return;
    }
    if (!_acceptedTerms) {
      _showNotification("accept all terms and conditions");
      return;
    }

    setState(() {
      _isLoading = true;
      _hasError = false;
    });

    try {
      await PatientApi.register(name: name, email: email, password: password);
      _showNotification("Account created successfully!", success: true);
      await Future.delayed(const Duration(milliseconds: 2000));
      if (mounted) Navigator.pushReplacementNamed(context, "/login");
    } catch (e) {
      _showNotification(e.toString(), success: false);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // --- UI Components ---

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    final notifyBgColor = isDark
        ? (_isSuccess ? Colors.green.withOpacity(0.2) : Colors.red.withOpacity(0.2))
        : (_isSuccess ? const Color(0xFFF0FDF4) : const Color(0xFFFEF2F2));
    final notifyTextColor = _isSuccess ? Colors.green : Colors.red;
    final notifyIcon = _isSuccess ? Icons.check_circle_outline : Icons.error_outline;

    return Scaffold(
      backgroundColor: isDark ? slate950 : Colors.white,
      body: Stack(
        children: [
          _buildDoodle(Icons.medical_services_outlined, 72, top: 0.10, left: -0.05, rotate: 12),
          _buildDoodle(Icons.medication_outlined, 60, top: 0.05, right: 0.10, rotate: -12),
          _buildDoodle(Icons.monitor_heart_outlined, 80, top: 0.25, right: -0.10, rotate: 45),
          _buildDoodle(Icons.hub_outlined, 50, bottom: 0.15, left: -0.02, rotate: -12),
          _buildDoodle(Icons.medical_services_rounded, 120, bottom: 0.05, right: -0.05, rotate: 12),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
                child: Column(
                  children: [
                    _brandHeader(isDark),
                    const SizedBox(height: 32),
                    _signUpCard(isDark),
                    const SizedBox(height: 24),
                    _footer(isDark),
                  ],
                ),
              ),
            ),
          ),
          if (_topMessage != null) _buildTopNotification(notifyBgColor, notifyTextColor, notifyIcon, isDark),
        ],
      ),
    );
  }

  Widget _signUpCard(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: isDark ? slate900 : brandBlueLight.withOpacity(0.8),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: _hasError ? Colors.red.withOpacity(0.5) : primaryColor.withOpacity(0.1),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Create Account",
            style: GoogleFonts.manrope(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : slate900,
            ),
          ),
          const SizedBox(height: 24),
          _buildInputLabel("Full Name"),
          _buildInputField(isDark, "user.svg", "John Doe", controller: _nameController),
          const SizedBox(height: 16),
          _buildInputLabel("Email Address"),
          _buildInputField(
            isDark,
            "gmail.svg",
            "name@example.com",
            controller: _emailController,
            readOnly: _isEmailReadOnly,
          ),
          const SizedBox(height: 16),
          _buildInputLabel("Password"),
          _buildInputField(
            isDark,
            "password.svg",
            "••••••••",
            controller: _passwordController,
            isPassword: true,
            visible: _passwordVisible,
            onToggle: () => setState(() => _passwordVisible = !_passwordVisible),
          ),
          const SizedBox(height: 16),
          _buildInputLabel("Confirm Password"),
          _buildInputField(
            isDark,
            "password.svg",
            "••••••••",
            controller: _confirmController,
            isPassword: true,
            visible: _confirmVisible,
            onToggle: () => setState(() => _confirmVisible = !_confirmVisible),
          ),
          const SizedBox(height: 16),
          Theme(
            data: ThemeData(
              unselectedWidgetColor: isDark ? slate400 : slate500,
            ),
            child: CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              title: GestureDetector(
                onTap: () {
                  // Navigates to the terms screen so user can read them
                  Navigator.pushNamed(context, "/term_condition");
                },
                child: Text(
                  "Accept all terms and conditions",
                  style: GoogleFonts.manrope(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: primaryColor, // Made clickable text stand out visually
                    decoration: TextDecoration.underline,
                  ),
                ),
              ),
              value: _acceptedTerms,
              activeColor: primaryColor,
              checkColor: Colors.white,
              dense: true,
              controlAffinity: ListTileControlAffinity.leading,
              onChanged: (bool? value) {
                setState(() {
                  _acceptedTerms = value ?? false;
                });
              },
            ),
          ),
          const SizedBox(height: 16),
          _primaryButton(),
          _buildOrDivider(),
          _buildGoogleButton(isDark),
        ],
      ),
    );
  }

  Widget _buildInputField(
    bool isDark,
    String icon,
    String hint, {
    required TextEditingController controller,
    bool isPassword = false,
    bool? visible,
    VoidCallback? onToggle,
    bool readOnly = false,
  }) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      decoration: BoxDecoration(
        color: readOnly ? (isDark ? slate700 : slate200) : (isDark ? slate800 : Colors.white),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _hasError ? Colors.red : primaryColor.withOpacity(0.3),
          width: 1.5,
        ),
      ),
      child: TextField(
        controller: controller,
        readOnly: readOnly,
        obscureText: isPassword && !(visible ?? false),
        onChanged: (v) {
          if (_hasError) setState(() => _hasError = false);
        },
        style: TextStyle(color: isDark ? Colors.white : slate900),
        decoration: InputDecoration(
          prefixIcon: Padding(
            padding: const EdgeInsets.all(12.0),
            child: SvgPicture.asset(
              'assets/icons/$icon',
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
                    (visible ?? false) ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                    color: slate400,
                    size: 20,
                  ),
                  onPressed: onToggle,
                )
              : (readOnly ? const Icon(Icons.lock_outline, size: 18, color: slate400) : null),
          hintText: hint,
          hintStyle: const TextStyle(color: slate400),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 15),
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
        onPressed: _isLoading ? null : _handleGoogleSignup,
        style: OutlinedButton.styleFrom(
          backgroundColor: isDark ? slate800 : Colors.white,
          side: BorderSide(color: isDark ? Colors.transparent : slate200),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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

  Widget _brandHeader(bool isDark) {
    return Column(
      children: [
        Hero(
          tag: 'brand-logo',
          child: Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: primaryColor,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: primaryColor.withOpacity(0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: const Icon(Icons.medical_services_rounded, color: Colors.white, size: 36),
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

  Widget _buildInputLabel(String text) {
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

  Widget _primaryButton() {
    return AnimatedScale(
      scale: _buttonScale,
      duration: const Duration(milliseconds: 100),
      child: SizedBox(
        width: double.infinity,
        height: 56,
        child: ElevatedButton(
          onPressed: _isLoading ? null : _submit,
          style: ElevatedButton.styleFrom(
            backgroundColor: primaryColor,
            elevation: 2,
            shadowColor: primaryColor.withOpacity(0.4),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: _isLoading
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                )
              : Text(
                  "Sign Up",
                  style: GoogleFonts.manrope(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
        ),
      ),
    );
  }

  Widget _footer(bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text("Already have an account? ", style: TextStyle(color: slate500)),
        GestureDetector(
          onTap: () => Navigator.pop(context),
          child: const Text(
            "Sign In",
            style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }

  Widget _buildDoodle(IconData icon, double size, {double? top, double? bottom, double? left, double? right, required double rotate}) {
    return AnimatedBuilder(
      animation: _floatingController,
      builder: (context, child) {
        double offset = math.sin(_floatingController.value * 2 * math.pi) * 8;
        return Positioned(
          top: top != null ? (MediaQuery.of(context).size.height * top) + offset : null,
          bottom: bottom != null ? (MediaQuery.of(context).size.height * bottom) + offset : null,
          left: left != null ? (MediaQuery.of(context).size.width * left) + (offset * 0.5) : null,
          right: right != null ? (MediaQuery.of(context).size.width * right) + (offset * 0.5) : null,
          child: child!,
        );
      },
      child: Transform.rotate(
        angle: rotate * math.pi / 180,
        child: Icon(icon, size: size, color: doodleColor.withOpacity(0.05)),
      ),
    );
  }

  Widget _buildTopNotification(Color bgColor, Color textColor, IconData icon, bool isDark) {
    return Positioned(
      top: MediaQuery.of(context).padding.top + 10,
      left: 20,
      right: 20,
      child: Dismissible(
        key: UniqueKey(),
        direction: DismissDirection.horizontal,
        onDismissed: (_) => setState(() => _topMessage = null),
        child: Material(
          color: Colors.transparent,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: textColor.withOpacity(0.3)),
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
                Icon(icon, color: textColor, size: 22),
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
                  child: Icon(Icons.close, color: textColor.withOpacity(0.5), size: 18),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
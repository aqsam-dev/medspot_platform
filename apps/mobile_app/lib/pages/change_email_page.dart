import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:medspot/services/patient_api.dart';

class ChangeEmailScreen extends StatefulWidget {
  const ChangeEmailScreen({super.key});

  @override
  State<ChangeEmailScreen> createState() => _ChangeEmailScreenState();
}

class _ChangeEmailScreenState extends State<ChangeEmailScreen> {
  // Brand Colors (Adaptive Palette)
  static const Color primaryColor = Color(0xFF2A4ECA);
  static const Color slate950 = Color(0xFF020617);
  static const Color slate900 = Color(0xFF0F172A);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate500 = Color(0xFF64748B);
  static const Color slate400 = Color(0xFF94A3B8);
  static const Color slate300 = Color(0xFFCBD5E1);
  static const Color brandBlueLight = Color(0xFFF0F4FF);

  // ✅ Controllers initialized with current email
  late TextEditingController _emailController;
  final _passwordController = TextEditingController();

  bool _passwordVisible = false;
  String? _topMessage;
  bool _isSuccess = false;
  bool _isLoading = false; // ✅ Loading state

  @override
  void initState() {
    super.initState();
    // Pre-fill current email
    _emailController = TextEditingController(text: PatientApi.userEmail);
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  // --- VALIDATION ---
  bool isValidEmail(String email) {
    return RegExp(
      r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
    ).hasMatch(email.trim());
  }

  // --- NOTIFICATION SYSTEM ---
  void _showNotification(String message, {bool success = false}) {
    if (!mounted) return;
    setState(() {
      _topMessage = message;
      _isSuccess = success;
    });

    if (success) {
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          Navigator.pop(context, true); // ✅ Return true to refresh profile
        }
      });
    } else {
      Future.delayed(const Duration(seconds: 4), () {
        if (mounted && _topMessage == message)
          setState(() => _topMessage = null);
      });
    }
  }

  // ✅ HANDLER WITH API LOGIC
  Future<void> _handleUpdate() async {
    String email = _emailController.text.trim();
    String password = _passwordController.text.trim();

    if (email.isEmpty || !isValidEmail(email)) {
      _showNotification("Please enter a valid email address");
      return;
    }
    if (password.isEmpty) {
      _showNotification("Please enter your current password");
      return;
    }

    setState(() => _isLoading = true);

    try {
      // ✅ API call for updating profile email
      // Note: We use the same updateProfile method or specialized email update
      await PatientApi.updateProfile(
        newName: PatientApi.userName ?? "",
        newEmail: email,
      );
    PatientApi.userEmail = email;

_showNotification("Email updated successfully!", success: true);

      _showNotification("Email updated successfully!", success: true);
    } catch (e) {
      _showNotification(e.toString(), success: false);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;

    final notifyBgColor = _isSuccess
        ? (isDark ? Colors.green.withOpacity(0.15) : const Color(0xFFF0FDF4))
        : (isDark ? Colors.red.withOpacity(0.15) : const Color(0xFFFEF2F2));

    final notifyTextColor = _isSuccess
        ? (isDark ? Colors.green.shade400 : Colors.green.shade700)
        : (isDark ? Colors.redAccent.shade100 : Colors.redAccent);

    return Scaffold(
      backgroundColor: isDark ? slate950 : Colors.white,
      body: Stack(
        children: [
          _buildBackgroundDoodles(isDark),
          SafeArea(
            child: Stack(
              children: [
                Column(
                  children: [
                    _buildAppBar(context, isDark),
                    Expanded(
                      child: Center(
                        child: SingleChildScrollView(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: _buildEmailCard(isDark),
                        ),
                      ),
                    ),
                  ],
                ),

                if (_topMessage != null)
                  Positioned(
                    top: 20,
                    left: 20,
                    right: 20,
                    child: Dismissible(
                      key: UniqueKey(),
                      direction: DismissDirection.horizontal,
                      onDismissed: (_) => setState(() => _topMessage = null),
                      child: Material(
                        elevation: 8,
                        shadowColor: Colors.black.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                        color: isDark ? slate900 : Colors.white,
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
                          ),
                          child: Row(
                            children: [
                              Icon(
                                _isSuccess
                                    ? Icons.check_circle_rounded
                                    : Icons.error_rounded,
                                color: notifyTextColor,
                                size: 22,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  _topMessage!,
                                  style: GoogleFonts.manrope(
                                    color: notifyTextColor,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                              GestureDetector(
                                onTap: () => setState(() => _topMessage = null),
                                child: Icon(
                                  Icons.close,
                                  color: notifyTextColor.withOpacity(0.6),
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
          ),
        ],
      ),
    );
  }

  Widget _buildAppBar(BuildContext context, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      child: Row(
        children: [
          IconButton(
            icon: Icon(
              Icons.chevron_left_rounded,
              color: isDark ? Colors.white : slate900,
              size: 32,
            ),
            onPressed: () => Navigator.pop(context),
          ),
          Expanded(
            child: Text(
              "Change Email",
              textAlign: TextAlign.center,
              style: GoogleFonts.manrope(
                color: isDark ? Colors.white : slate900,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 48),
        ],
      ),
    );
  }

  Widget _buildEmailCard(bool isDark) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 400),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? slate900 : brandBlueLight.withOpacity(0.7),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? slate800 : primaryColor.withOpacity(0.1),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(child: _buildHeroIcon()),
          const SizedBox(height: 24),
          Center(
            child: Text(
              "Update your email",
              style: GoogleFonts.manrope(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : slate900,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "Enter your new email address and confirm your identity to sync your account across devices.",
            textAlign: TextAlign.center,
            style: GoogleFonts.manrope(
              color: slate500,
              fontSize: 14,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 32),

          _buildInputLabel("NEW EMAIL ADDRESS"),
          _buildInputField(
            isDark: isDark,
            hint: "name@example.com",
            icon: Icons.email_outlined,
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
          ),

          const SizedBox(height: 20),

          _buildInputLabel("CONFIRM PASSWORD"),
          _buildInputField(
            isDark: isDark,
            hint: "••••••••",
            icon: Icons.lock_outline_rounded,
            controller: _passwordController,
            isPassword: true,
            visible: _passwordVisible,
            onToggle: () =>
                setState(() => _passwordVisible = !_passwordVisible),
          ),

          const SizedBox(height: 32),
          _buildSubmitButton(),
          const SizedBox(height: 16),
          Center(
            child: TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(
                "Cancel and go back",
                style: GoogleFonts.manrope(
                  color: isDark ? slate400 : slate500,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputField({
    required bool isDark,
    required String hint,
    required IconData icon,
    required TextEditingController controller,
    bool isPassword = false,
    bool? visible,
    VoidCallback? onToggle,
    TextInputType? keyboardType,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? slate800 : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: primaryColor.withOpacity(isDark ? 0.5 : 1.0),
          width: 1.5,
        ),
      ),
      child: TextField(
        controller: controller,
        obscureText: isPassword && !(visible ?? false),
        keyboardType: keyboardType,
        style: GoogleFonts.manrope(
          color: isDark ? Colors.white : slate900,
          fontWeight: FontWeight.w600,
        ),
        decoration: InputDecoration(
          prefixIcon: Icon(icon, color: primaryColor, size: 22),
          suffixIcon: isPassword
              ? IconButton(
                  icon: Icon(
                    (visible ?? false)
                        ? Icons.visibility_rounded
                        : Icons.visibility_off_rounded,
                    color: isDark ? slate500 : slate300,
                    size: 20,
                  ),
                  onPressed: onToggle,
                )
              : null,
          hintText: hint,
          hintStyle: GoogleFonts.manrope(
            color: isDark ? slate500 : slate300,
            fontWeight: FontWeight.normal,
          ),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            vertical: 15,
            horizontal: 16,
          ),
        ),
      ),
    );
  }

  Widget _buildHeroIcon() {
    return Stack(
      alignment: Alignment.center,
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: primaryColor.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
        ),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [primaryColor, Color(0xFF1A34A8)],
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: primaryColor.withOpacity(0.3),
                blurRadius: 15,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: const Icon(
            Icons.alternate_email_rounded,
            color: Colors.white,
            size: 40,
          ),
        ),
      ],
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      height: 58,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _handleUpdate,
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 4,
          shadowColor: primaryColor.withOpacity(0.4),
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
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    "Update Email",
                    style: GoogleFonts.manrope(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Icon(Icons.arrow_forward_rounded, size: 20),
                ],
              ),
      ),
    );
  }

  Widget _buildInputLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 6),
      child: Text(
        text,
        style: GoogleFonts.manrope(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: slate400,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildBackgroundDoodles(bool isDark) {
    final Color doodleColor = isDark
        ? primaryColor.withOpacity(0.05)
        : primaryColor.withOpacity(0.08);
    return Stack(
      children: [
        _Doodle(
          icon: Icons.alternate_email_rounded,
          top: 60,
          left: 30,
          size: 120,
          color: doodleColor,
        ),
        _Doodle(
          icon: Icons.security_rounded,
          bottom: 120,
          right: 20,
          size: 100,
          color: doodleColor,
        ),
        _Doodle(
          icon: Icons.shield_moon_outlined,
          top: 400,
          left: -20,
          size: 80,
          color: doodleColor,
        ),
      ],
    );
  }
}

class _Doodle extends StatelessWidget {
  final IconData icon;
  final double? top, bottom, left, right;
  final double size;
  final Color color;
  const _Doodle({
    required this.icon,
    this.top,
    this.bottom,
    this.left,
    this.right,
    required this.size,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: top,
      bottom: bottom,
      left: left,
      right: right,
      child: Icon(icon, size: size, color: color),
    );
  }
}

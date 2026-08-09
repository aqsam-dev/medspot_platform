import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:medspot/services/patient_api.dart'; 

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  // Brand Colors
  static const Color primaryColor = Color(0xFF2A4ECA);
  static const Color slate950 = Color(0xFF020617);
  static const Color slate900 = Color(0xFF0F172A);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate500 = Color(0xFF64748B);
  static const Color slate400 = Color(0xFF94A3B8);
  static const Color slate300 = Color(0xFFCBD5E1);
  static const Color brandBlueLight = Color(0xFFF0F4FF);

  // Controllers
  final _currentController = TextEditingController();
  final _newController = TextEditingController();
  final _confirmController = TextEditingController();

  // States
  bool _currentVisible = false;
  bool _newVisible = false;
  bool _confirmVisible = false;
  bool _isLoading = false; // ✅ Loading state for API call
  String? _topMessage;
  bool _isSuccess = false;

  @override
  void dispose() {
    _currentController.dispose();
    _newController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  // Validation Logic
  bool isStrongPassword(String pass) => RegExp(
    r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#\$&*~]).{8,}$',
  ).hasMatch(pass.trim());

  // --- NOTIFICATION SYSTEM ---
  void _showNotification(String message, {bool success = false}) {
    if (!mounted) return;
    setState(() {
      _topMessage = message;
      _isSuccess = success;
    });

    if (success) {
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) Navigator.pop(context);
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
    String current = _currentController.text.trim();
    String newPass = _newController.text.trim();
    String confirm = _confirmController.text.trim();

    // Field Validations
    if (current.isEmpty) {
      _showNotification("Please enter your current password");
      return;
    }
    if (!isStrongPassword(newPass)) {
      _showNotification("Include Uppercase, Number & Symbol");
      return;
    }
    if (newPass != confirm) {
      _showNotification("Passwords do not match!");
      return;
    }
    if (current == newPass) {
      _showNotification("New password cannot be same as old");
      return;
    }

    setState(() => _isLoading = true);

    try {
      // ✅ Call your API function
      await PatientApi.updatePassword(
        currentPassword: current,
        newPassword: newPass,
      );

      _showNotification("Password updated successfully!", success: true);
    } catch (e) {
      // Show specific error from backend
      _showNotification(e.toString().replaceAll('Exception: ', ''));
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
                SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    children: [
                      _buildAppBar(context, isDark),
                      const SizedBox(height: 20),
                      _buildHeroSection(isDark),
                      const SizedBox(height: 32),
                      _buildPasswordCard(isDark),
                      const SizedBox(height: 32),
                      _primaryButton(),
                      const SizedBox(height: 40),
                    ],
                  ),
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
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: Icon(
              Icons.chevron_left_rounded,
              color: isDark ? Colors.white : slate900,
              size: 30,
            ),
            onPressed: () => Navigator.pop(context),
          ),
          Text(
            "Change Password",
            style: GoogleFonts.manrope(
              fontWeight: FontWeight.bold,
              fontSize: 18,
              color: isDark ? Colors.white : slate900,
            ),
          ),
          const SizedBox(width: 48),
        ],
      ),
    );
  }

  Widget _buildHeroSection(bool isDark) {
    return Column(
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: primaryColor,
            borderRadius: BorderRadius.circular(22),
            boxShadow: [
              BoxShadow(
                color: primaryColor.withOpacity(0.3),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: const Icon(
            Icons.lock_reset_rounded,
            color: Colors.white,
            size: 40,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          "Update Security",
          style: GoogleFonts.manrope(
            fontSize: 26,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : slate900,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          "Keep your account safe with a strong password",
          textAlign: TextAlign.center,
          style: GoogleFonts.manrope(color: slate500, fontSize: 14),
        ),
      ],
    );
  }

  Widget _buildPasswordCard(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? slate900 : brandBlueLight.withOpacity(0.7),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? slate800 : primaryColor.withOpacity(0.1),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildInputLabel("CURRENT PASSWORD"),
          _buildInputField(
            isDark,
            Icons.lock_open_rounded,
            "••••••••",
            _currentController,
            isPassword: true,
            visible: _currentVisible,
            onToggle: () => setState(() => _currentVisible = !_currentVisible),
          ),

          const SizedBox(height: 20),
          _buildInputLabel("NEW PASSWORD"),
          _buildInputField(
            isDark,
            Icons.lock_outline_rounded,
            "••••••••",
            _newController,
            isPassword: true,
            visible: _newVisible,
            onToggle: () => setState(() => _newVisible = !_newVisible),
          ),

          const SizedBox(height: 20),
          _buildInputLabel("CONFIRM NEW PASSWORD"),
          _buildInputField(
            isDark,
            Icons.verified_user_outlined,
            "••••••••",
            _confirmController,
            isPassword: true,
            visible: _confirmVisible,
            onToggle: () => setState(() => _confirmVisible = !_confirmVisible),
          ),

          const SizedBox(height: 20),
          _buildRequirementBox(isDark),
        ],
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

  Widget _buildInputField(
    bool isDark,
    IconData icon,
    String hint,
    TextEditingController controller, {
    bool isPassword = false,
    bool? visible,
    VoidCallback? onToggle,
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
        style: GoogleFonts.manrope(
          fontWeight: FontWeight.w600,
          color: isDark ? Colors.white : slate900,
        ),
        decoration: InputDecoration(
          prefixIcon: Icon(icon, color: primaryColor, size: 22),
          suffixIcon: isPassword
              ? IconButton(
                  icon: Icon(
                    (visible ?? false)
                        ? Icons.visibility_outlined
                        : Icons.visibility_off_outlined,
                    color: isDark ? slate400 : slate300,
                    size: 20,
                  ),
                  onPressed: onToggle,
                )
              : null,
          hintText: hint,
          hintStyle: GoogleFonts.manrope(color: isDark ? slate500 : slate300),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 15),
        ),
      ),
    );
  }

  Widget _buildRequirementBox(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? slate800.withOpacity(0.5) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? slate800 : primaryColor.withOpacity(0.1),
        ),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline_rounded, color: primaryColor, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              "Must be 8+ characters with Uppercase, Number & Symbol",
              style: GoogleFonts.manrope(
                color: isDark ? slate400 : slate500,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _primaryButton() {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _handleUpdate,
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 4,
          shadowColor: primaryColor.withOpacity(0.3),
        ),
        child: _isLoading
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 3,
                ),
              )
            : Text(
                "Update Password",
                style: GoogleFonts.manrope(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
      ),
    );
  }

  Widget _buildBackgroundDoodles(bool isDark) {
    final doodleColor = isDark
        ? primaryColor.withOpacity(0.05)
        : const Color(0x142A4ECA);
    return Stack(
      children: [
        _DoodleIcon(
          icon: Icons.monitor_heart_outlined,
          top: 0.1,
          left: 0.05,
          rotate: 15,
          color: doodleColor,
        ),
        _DoodleIcon(
          icon: Icons.shield_outlined,
          bottom: 0.2,
          right: 0.05,
          rotate: -15,
          color: doodleColor,
        ),
        _DoodleIcon(
          icon: Icons.lock_outline_rounded,
          top: 0.4,
          left: -0.05,
          rotate: 45,
          color: doodleColor,
        ),
      ],
    );
  }
}

class _DoodleIcon extends StatelessWidget {
  final IconData icon;
  final double? top, bottom, left, right;
  final double rotate;
  final Color color;
  const _DoodleIcon({
    required this.icon,
    this.top,
    this.bottom,
    this.left,
    this.right,
    this.rotate = 0,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: top != null ? MediaQuery.of(context).size.height * top! : null,
      bottom: bottom != null
          ? MediaQuery.of(context).size.height * bottom!
          : null,
      left: left != null ? MediaQuery.of(context).size.width * left! : null,
      right: right != null ? MediaQuery.of(context).size.width * right! : null,
      child: Transform.rotate(
        angle: rotate * 3.14159 / 180,
        child: Icon(icon, size: 80, color: color),
      ),
    );
  }
}

import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:medspot/services/patient_api.dart'; // ✅ API Import kiya

class ChangeNameScreen extends StatefulWidget {
  const ChangeNameScreen({super.key});

  @override
  State<ChangeNameScreen> createState() => _ChangeNameScreenState();
}

class _ChangeNameScreenState extends State<ChangeNameScreen> {
  // --- Branding Colors ---
  static const Color primaryBlue = Color(0xFF2A4ECA);
  static const Color slate950 = Color(0xFF020617);
  static const Color slate900 = Color(0xFF0F172A);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate500 = Color(0xFF64748B);
  static const Color slate400 = Color(0xFF94A3B8);

  // ✅ Controllers initialized with current stored name
  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;

  String? _topMessage;
  bool _isSuccess = false;
  bool _isLoading = false; // ✅ Loading state for API call

  @override
  void initState() {
    super.initState();
    // Phele se maujood naam ko split karke fill karna (Maria Ejaz -> Maria, Ejaz)
    List<String> nameParts = (PatientApi.userName ?? "User Name").split(" ");
    _firstNameController = TextEditingController(
      text: nameParts.isNotEmpty ? nameParts[0] : "",
    );
    _lastNameController = TextEditingController(
      text: nameParts.length > 1 ? nameParts.sublist(1).join(" ") : "",
    );
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    super.dispose();
  }

  void _showNotification(String message, {bool success = false}) {
    if (!mounted) return;
    setState(() {
      _topMessage = message;
      _isSuccess = success;
    });

    Future.delayed(Duration(seconds: success ? 2 : 4), () {
      if (mounted && _topMessage == message) {
        if (success) {
          // ✅ Success par wapas bhej rahe hain true flag ke saath
          Navigator.of(context).pop(true);
        } else {
          setState(() => _topMessage = null);
        }
      }
    });
  }

  // ✅ Updated logic to call Backend API
  Future<void> _handleSave() async {
    String first = _firstNameController.text.trim();
    String last = _lastNameController.text.trim();
    String fullNewName = "$first $last";

    if (first.length < 3 || last.length < 3) {
      _showNotification("Names must be at least 3 characters");
      return;
    }

    setState(() => _isLoading = true);

    try {
      // ✅ PatientApi call to update database
      // Note: Make sure updateProfile method exists in your PatientApi
      await PatientApi.updateProfile(
        newName: fullNewName,
        newEmail:
            PatientApi.userEmail ?? "", // Keeping email same during name change
      );

      _showNotification("Profile updated successfully!", success: true);
    } catch (e) {
      _showNotification(e.toString(), success: false);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    final Color bgColor = isDark ? slate950 : Colors.white;
    final Color cardColor = isDark
        ? slate900
        : const Color(0xFFF0F4FF).withOpacity(0.7);
    final Color textColor = isDark ? Colors.white : const Color(0xFF0F172A);

    return Scaffold(
      backgroundColor: bgColor,
      body: Stack(
        children: [
          _buildBackgroundDoodles(isDark),
          SafeArea(
            child: Column(
              children: [
                _buildAppBar(context, textColor),
                Expanded(
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 24,
                    ),
                    child: _buildPremiumCard(isDark, cardColor, textColor),
                  ),
                ),
                _buildEncryptionFooter(isDark),
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
                child: _buildTopNotification(isDark),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTopNotification(bool isDark) {
    final notifyBgColor = _isSuccess
        ? (isDark ? const Color(0xFF064E3B) : const Color(0xFFF0FDF4))
        : (isDark ? const Color(0xFF7F1D1D) : const Color(0xFFFEF2F2));

    final notifyTextColor = _isSuccess
        ? (isDark ? Colors.greenAccent : Colors.green.shade700)
        : (isDark ? Colors.redAccent.shade100 : Colors.redAccent);

    return Material(
      elevation: 8,
      shadowColor: Colors.black.withOpacity(0.2),
      borderRadius: BorderRadius.circular(12),
      color: Colors.transparent,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isDark
              ? (_isSuccess ? const Color(0xFF064E3B) : const Color(0xFF451A1A))
              : notifyBgColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: notifyTextColor.withOpacity(0.3)),
        ),
        child: Row(
          children: [
            Icon(
              _isSuccess ? Icons.check_circle_rounded : Icons.error_rounded,
              color: notifyTextColor,
              size: 22,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                _topMessage!,
                style: GoogleFonts.manrope(
                  color: isDark ? Colors.white : notifyTextColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ),
            GestureDetector(
              onTap: () => setState(() => _topMessage = null),
              child: Icon(
                Icons.close,
                color: isDark
                    ? Colors.white54
                    : notifyTextColor.withOpacity(0.5),
                size: 18,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPremiumCard(bool isDark, Color cardColor, Color textColor) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: primaryBlue.withOpacity(isDark ? 0.2 : 0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.3 : 0.05),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          _buildAvatarHeader(isDark),
          const SizedBox(height: 16),
          Text(
            "Update your name",
            style: GoogleFonts.manrope(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          Text(
            "MEDSPOT PREMIUM",
            style: GoogleFonts.manrope(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: primaryBlue,
              letterSpacing: 1.2,
            ),
          ),

          const SizedBox(height: 32),
          _buildInputLabel("FIRST NAME", isDark),
          _buildNameField(_firstNameController, "Enter first name", isDark),

          const SizedBox(height: 20),
          _buildInputLabel("LAST NAME", isDark),
          _buildNameField(_lastNameController, "Enter last name", isDark),

          const SizedBox(height: 32),
          _buildSaveButton(),
        ],
      ),
    );
  }

  Widget _buildNameField(
    TextEditingController controller,
    String hint,
    bool isDark,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? slate800 : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: primaryBlue.withOpacity(isDark ? 0.5 : 1.0),
          width: 1.5,
        ),
      ),
      child: TextField(
        controller: controller,
        style: GoogleFonts.manrope(
          fontWeight: FontWeight.w600,
          color: isDark ? Colors.white : Colors.black,
        ),
        inputFormatters: [
          LengthLimitingTextInputFormatter(20),
          FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Z\s]')),
        ],
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: isDark ? Colors.white38 : slate400),
          prefixIcon: const Icon(
            Icons.person_outline_rounded,
            color: primaryBlue,
            size: 22,
          ),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 15,
          ),
        ),
      ),
    );
  }

  Widget _buildSaveButton() {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: _isLoading
            ? null
            : _handleSave, // Disable button during loading
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryBlue,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
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
                "Save Changes",
                style: GoogleFonts.manrope(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
      ),
    );
  }

  Widget _buildAvatarHeader(bool isDark) {
    return Stack(
      alignment: Alignment.bottomRight,
      children: [
        Container(
          height: 100,
          width: 100,
          decoration: BoxDecoration(
            color: isDark ? slate800 : Colors.white,
            shape: BoxShape.circle,
            border: Border.all(color: primaryBlue.withOpacity(0.2), width: 2),
          ),
          child: Icon(
            Icons.person_rounded,
            size: 50,
            color: isDark ? slate400 : slate500,
          ),
        ),
        Container(
          padding: const EdgeInsets.all(6),
          decoration: const BoxDecoration(
            color: primaryBlue,
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.verified_rounded,
            color: Colors.white,
            size: 14,
          ),
        ),
      ],
    );
  }

  Widget _buildAppBar(BuildContext context, Color textColor) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: Icon(Icons.chevron_left_rounded, color: textColor, size: 32),
            onPressed: () => Navigator.of(context).pop(),
          ),
          Text(
            "Change Name",
            style: GoogleFonts.manrope(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          const SizedBox(width: 48),
        ],
      ),
    );
  }

  Widget _buildInputLabel(String label, bool isDark) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Padding(
        padding: const EdgeInsets.only(left: 4, bottom: 8),
        child: Text(
          label,
          style: GoogleFonts.manrope(
            color: isDark ? slate400 : slate500,
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: 1,
          ),
        ),
      ),
    );
  }

  Widget _buildBackgroundDoodles(bool isDark) {
    final double opacity = isDark ? 0.05 : 0.08;
    return Stack(
      children: [
        _DoodleIcon(
          icon: Icons.monitor_heart_outlined,
          top: 0.1,
          left: 0.05,
          rotate: 15,
          opacity: opacity,
        ),
        _DoodleIcon(
          icon: Icons.shield_outlined,
          bottom: 0.2,
          right: 0.05,
          rotate: -15,
          opacity: opacity,
        ),
        _DoodleIcon(
          icon: Icons.lock_outline_rounded,
          top: 0.4,
          left: -0.05,
          rotate: 45,
          opacity: opacity,
        ),
      ],
    );
  }

  Widget _buildEncryptionFooter(bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.lock_rounded, size: 12, color: primaryBlue),
          const SizedBox(width: 8),
          Text(
            "END-TO-END ENCRYPTED",
            style: GoogleFonts.manrope(
              color: isDark ? slate400 : slate500,
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _DoodleIcon extends StatelessWidget {
  final IconData icon;
  final double? top, bottom, left, right;
  final double rotate;
  final double opacity;
  const _DoodleIcon({
    required this.icon,
    this.top,
    this.bottom,
    this.left,
    this.right,
    this.rotate = 0,
    required this.opacity,
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
        angle: rotate * math.pi / 180,
        child: Icon(
          icon,
          size: 80,
          color: const Color(0xFF2A4ECA).withOpacity(opacity),
        ),
      ),
    );
  }
}

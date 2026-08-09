import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:math' as math;
import 'package:provider/provider.dart'; // Make sure to add provider in pubspec.yaml

/// ============================================================
/// 1. THEME PROVIDER (Logic for switching whole app theme)
/// ============================================================
class ThemeProvider extends ChangeNotifier {
  ThemeMode _themeMode = ThemeMode.light;

  ThemeMode get themeMode => _themeMode;

  bool get isDarkMode => _themeMode == ThemeMode.dark;

  void toggleTheme(bool isOn) {
    _themeMode = isOn ? ThemeMode.dark : ThemeMode.light;
    notifyListeners(); // Yeh puri app ko signal bhejta hai update hone ka
  }
}

/// ============================================================
/// 2. GLOBAL THEME DATA (MaterialApp configurations)
/// ============================================================
class AppThemes {
  // --- LIGHT THEME ---
  static final lightTheme = ThemeData(
    brightness: Brightness.light,
    primaryColor: AppColors.primary,
    scaffoldBackgroundColor: AppColors.backgroundLight,
    useMaterial3: true,
    textTheme: GoogleFonts.plusJakartaSansTextTheme(ThemeData.light().textTheme),
    colorScheme: ColorScheme.light(
      primary: AppColors.primary,
      secondary: AppColors.secondary,
      surface: AppColors.card,
    ),
  );

  // --- DARK THEME ---
  static final darkTheme = ThemeData(
    brightness: Brightness.dark,
    primaryColor: AppColors.primary,
    scaffoldBackgroundColor: AppColors.slate950,
    useMaterial3: true,
    textTheme: GoogleFonts.plusJakartaSansTextTheme(ThemeData.dark().textTheme),
    colorScheme: ColorScheme.dark(
      primary: AppColors.primary,
      secondary: AppColors.secondary,
      surface: AppColors.slate900,
    ),
  );
}

/// ===============================
/// APP COLORS (As Provided)
/// ===============================
class AppColors {
  static const Color primary = Color(0xFF2A4ECA);
  static const Color secondary = Color(0xFF2DD4BF);
  static const Color backgroundLight = Color(0xFFFDFDFD);
  static const Color lightBackground = Color(0xFFF5F9FE);
  static const Color fieldBg = Color(0xFFF5F7FB);
  static const Color textPrimary = Colors.black87;

  static const Color slate50 = Color(0xFFF8FAFC);
  static const Color slate100 = Color(0xFFF1F5F9);
  static const Color slate200 = Color(0xFFE2E8F0);
  static const Color slate300 = Color(0xFFCBD5E1);
  static const Color slate400 = Color(0xFF94A3B8);
  static const Color slate500 = Color(0xFF64748B);
  static const Color slate600 = Color(0xFF475569);
  static const Color slate700 = Color(0xFF334155);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate900 = Color(0xFF0F172A);
  static const Color slate950 = Color(0xFF020617);

  static const Color amber50 = Color(0xFFFFFBEB);
  static const Color amber100 = Color(0xFFFEF3C7);
  static const Color amber400 = Color(0xFFFBBF24);
  static const Color amber800 = Color(0xFF92400E);
  static const Color amber900 = Color(0xFF78350F);

  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color emerald = Color(0xFF10B981);
  static const Color roseAccent = Color(0xFFE91E63);
  static const Color rose500 = Color(0xFFF43F5E);
  static const Color danger = Colors.red;
  static const Color divider = Color(0xFFE5E7EB);
  static const Color card = Colors.white;
}

/// ===============================
/// SIZES (As Provided)
/// ===============================
class AppSizes {
  static const double radiusSmall = 12;
  static const double radiusMedium = 20;
  static const double radiusLarge = 32;
  static const double radiusXL = 48;
  static const double fieldRadius = 12;
  static const double buttonRadius = 50;
  static const double cardRadius = 28;
  static const double contentPadding = 24;
  static const double buttonHeight = 52;
}

/// ===============================
/// PHARMACY DIRECTION SCREEN
/// ===============================
class PharmacyDirectionScreen extends StatelessWidget {
  const PharmacyDirectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // AB HUM THEME PROVIDER SE VALUE LE RAHE HAIN
    final themeProvider = Provider.of<ThemeProvider>(context);
    final bool isDark = themeProvider.isDarkMode;

    return Scaffold(
      backgroundColor: isDark ? AppColors.slate950 : AppColors.backgroundLight,
      body: Column(
        children: [
          // 1. Map Section (Top)
          Expanded(
            flex: 11,
            child: Stack(
              children: [
                _buildMapTexture(context, isDark),
                _buildRouteOverlay(),
                _buildBackArrow(context, isDark),
                _buildLocationPin(), 
                _buildPharmacyMarker(),
                _buildPharmacyFloatingCard(isDark), 
              ],
            ),
          ),

          // 2. Instructions Section (Middle)
          Expanded(
            flex: 9,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(28, 30, 28, 10),
              physics: const BouncingScrollPhysics(),
              children: [
                Text(
                  "Step Instructions",
                  style: GoogleFonts.manrope(
                    fontSize: 19,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : AppColors.slate900,
                  ),
                ),
                const SizedBox(height: 25),
                _buildInstructionStep(
                  isDark: isDark,
                  icon: Icons.north,
                  color: AppColors.primary,
                  title: "Head north on 5th Avenue",
                  subtitle: "Continue for 0.4 miles",
                  isLast: false,
                ),
                _buildInstructionStep(
                  isDark: isDark,
                  icon: Icons.turn_left,
                  color: AppColors.amber400,
                  title: "Turn left on Main St",
                  subtitle: "Continue for 0.8 miles",
                  isLast: false,
                ),
                _buildInstructionStep(
                  isDark: isDark,
                  icon: Icons.location_on,
                  color: AppColors.emerald,
                  title: "Arrive at Destination",
                  subtitle: "MedSpot Central on your right",
                  isLast: true,
                ),
              ],
            ),
          ),

          // 3. Bottom Action Button
          _buildBottomAction(isDark),
        ],
      ),
      bottomNavigationBar: _buildBottomNav(isDark),
    );
  }

  // --- Baqi saare helpers jo aapne provide kiye (un-changed) ---
  Widget _buildMapTexture(BuildContext context, bool isDark) {
    return Container(
      width: double.infinity,
      color: isDark ? AppColors.slate900 : const Color(0xFFF1F5F9),
      child: CustomPaint(
        painter: GridPainter(isDark: isDark),
      ),
    );
  }

  Widget _buildBackArrow(BuildContext context, bool isDark) {
    return Positioned(
      top: 55,
      left: 24,
      child: InkWell(
        onTap: () => Navigator.pop(context),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isDark ? AppColors.slate800 : Colors.white,
            borderRadius: BorderRadius.circular(AppSizes.radiusSmall),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              )
            ],
          ),
          child: Icon(
            Icons.arrow_back_ios_new,
            size: 16,
            color: isDark ? Colors.white : AppColors.slate900,
          ),
        ),
      ),
    );
  }

  Widget _buildRouteOverlay() {
    return Positioned.fill(
      child: CustomPaint(
        painter: RoutePainter(color: AppColors.primary),
      ),
    );
  }

  Widget _buildLocationPin() {
    return Positioned(
      left: 100,
      bottom: 180,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppColors.primary.withOpacity(0.2),
          shape: BoxShape.circle,
        ),
        child: Container(
          width: 15,
          height: 15,
          decoration: const BoxDecoration(
            color: AppColors.primary,
            shape: BoxShape.circle,
            boxShadow: [BoxShadow(color: Colors.white, spreadRadius: 3)],
          ),
        ),
      ),
    );
  }

  Widget _buildPharmacyMarker() {
    return Positioned(
      right: 60,
      top: 100,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white, width: 3),
              boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 10)],
            ),
            child: const Icon(Icons.local_pharmacy, color: Colors.white, size: 24),
          ),
        ],
      ),
    );
  }

  Widget _buildPharmacyFloatingCard(bool isDark) {
    return Positioned(
      bottom: 20,
      left: 20,
      right: 20,
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: isDark ? AppColors.slate800 : Colors.white,
          borderRadius: BorderRadius.circular(AppSizes.radiusLarge),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 30,
              offset: const Offset(0, 10),
            )
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "MedSpot Central",
                      style: GoogleFonts.manrope(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : AppColors.slate900,
                      ),
                    ),
                    const Text(
                      "452 Main St, Downtown Area",
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.slate500,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.emerald.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    "OPEN NOW",
                    style: TextStyle(
                      color: AppColors.emerald,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                )
              ],
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                _buildStatItem(isDark, Icons.near_me, "Distance", "1.2 mi"),
                const SizedBox(width: 12),
                _buildStatItem(isDark, Icons.timer, "Arrival", "8 min"),
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(bool isDark, IconData icon, String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isDark ? AppColors.slate900.withOpacity(0.4) : AppColors.slate50,
          borderRadius: BorderRadius.circular(AppSizes.radiusMedium),
          border: Border.all(color: isDark ? AppColors.slate700 : AppColors.slate100),
        ),
        child: Row(
          children: [
            Icon(icon, color: AppColors.primary, size: 18),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label.toUpperCase(), style: const TextStyle(fontSize: 8, color: AppColors.slate400, fontWeight: FontWeight.bold)),
                Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: isDark ? Colors.white : AppColors.slate900)),
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _buildInstructionStep({
    required bool isDark,
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required bool isLast,
  }) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [BoxShadow(color: color.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4))],
                ),
                child: Icon(icon, color: Colors.white, size: 22),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [color, isDark ? AppColors.slate700 : AppColors.slate200],
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(top: 4, bottom: 40),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: isDark ? Colors.white : AppColors.slate900)),
                  Text(subtitle, style: const TextStyle(fontSize: 14, color: AppColors.slate500)),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildBottomAction(bool isDark) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.slate950 : Colors.white,
        border: Border(top: BorderSide(color: isDark ? AppColors.slate800 : AppColors.slate100)),
      ),
      child: ElevatedButton(
        onPressed: () {},
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          minimumSize: const Size(double.infinity, AppSizes.buttonHeight + 10),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMedium)),
          elevation: 4,
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.navigation, color: Colors.white),
            SizedBox(width: 12),
            Text("Start Live Navigation", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomNav(bool isDark) {
    return BottomNavigationBar(
      type: BottomNavigationBarType.fixed,
      backgroundColor: isDark ? AppColors.slate950 : Colors.white,
      selectedItemColor: AppColors.primary,
      unselectedItemColor: AppColors.slate400,
      showUnselectedLabels: true,
      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'HOME'),
        BottomNavigationBarItem(icon: Icon(Icons.search), label: 'SEARCH'),
        BottomNavigationBarItem(icon: Icon(Icons.assignment_outlined), label: 'RESERVATIONS'),
        BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'PROFILE'),
      ],
    );
  }
}

// --- Custom Painters ---
class GridPainter extends CustomPainter {
  final bool isDark;
  GridPainter({required this.isDark});
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = isDark ? Colors.white.withOpacity(0.03) : Colors.black.withOpacity(0.03)
      ..strokeWidth = 1;
    for (double i = 0; i < size.width; i += 40) { canvas.drawLine(Offset(i, 0), Offset(i, size.height), paint); }
    for (double i = 0; i < size.height; i += 40) { canvas.drawLine(Offset(0, i), Offset(size.width, i), paint); }
  }
  @override bool shouldRepaint(CustomPainter oldDelegate) => false;
}

class RoutePainter extends CustomPainter {
  final Color color;
  RoutePainter({required this.color});
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color ..style = PaintingStyle.stroke ..strokeWidth = 8 ..strokeCap = StrokeCap.round;
    final path = Path();
    path.moveTo(100, size.height * 0.75);
    path.quadraticBezierTo(size.width * 0.4, size.height * 0.6, size.width * 0.6, size.height * 0.4);
    path.quadraticBezierTo(size.width * 0.8, size.height * 0.2, size.width * 0.75, 120);
    canvas.drawPath(path, paint..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8));
    canvas.drawPath(path, paint..maskFilter = null);
  }
  @override bool shouldRepaint(CustomPainter oldDelegate) => false;
}
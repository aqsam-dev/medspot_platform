import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animated_text_kit/animated_text_kit.dart';

class MedSpotSplash extends StatefulWidget {
  const MedSpotSplash({super.key});

  @override
  State<MedSpotSplash> createState() => _MedSpotSplashState();
}

class _MedSpotSplashState extends State<MedSpotSplash> {
  bool _showAnimatedText = false;

  @override
  void initState() {
    super.initState();

    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) {
        setState(() {
          _showAnimatedText = true;
        });
      }
    });
  }

  void _navigateToLogin() {
    if (mounted) {
      Navigator.pushReplacementNamed(context, '/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    const Color primaryColor = Color(0xFF005DBC);

    return Scaffold(
      backgroundColor: primaryColor,
      body: Stack(
        children: [
          // 🔹 Background Pattern
          Positioned.fill(
            child: Opacity(
              opacity: 0.08,
              child: CustomPaint(painter: MedicalPatternPainter()),
            ),
          ),

          // 🔹 Gradient overlay (FIXES empty right side)
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.transparent, Colors.black.withOpacity(0.1)],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
              ),
            ),
          ),

          // 🔹 Background Icons (slightly moved inward)
          _buildBackgroundIcon(
            top: MediaQuery.of(context).size.height * 0.20,
            right: -40, // FIXED (was -80)
            icon: Icons.medical_services_outlined,
            size: 350,
            angle: 0.3,
          ),
          _buildBackgroundIcon(
            bottom: MediaQuery.of(context).size.height * 0.15,
            left: -40, // FIXED
            icon: Icons.biotech_outlined,
            size: 300,
            angle: -0.6,
          ),

          // 🔹 Main Content
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: 40.0,
                vertical: 40.0,
              ),
              child: Align(
                alignment: Alignment.centerLeft, // 🔥 KEY FIX
                child: AnimatedOpacity(
                  duration: const Duration(milliseconds: 800),
                  opacity: 1,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center, // 🔥 KEY FIX
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // 🟢 Static Text
                      Text(
                        'Welcome to',
                        style: GoogleFonts.poppins(
                          fontSize: 48,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          height: 1.1,
                          letterSpacing: -1.5,
                        ),
                      ),

                      const SizedBox(height: 10),

                      // 🔥 Typewriter Animation
                      SizedBox(
                        height: 70,
                        child: _showAnimatedText
                            ? DefaultTextStyle(
                                style: GoogleFonts.poppins(
                                  fontSize: 48,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                  height: 1.1,
                                  letterSpacing: -1.5,
                                ),
                                child: AnimatedTextKit(
                                  isRepeatingAnimation: false,
                                  animatedTexts: [
                                    TypewriterAnimatedText(
                                      'MedSpot',
                                      speed: const Duration(milliseconds: 150),
                                      cursor: '|',
                                    ),
                                  ],
                                  onFinished: _navigateToLogin,
                                ),
                              )
                            : const SizedBox(),
                      ),

                      const SizedBox(height: 20),

                      // 🔹 Animated Line
                      TweenAnimationBuilder<double>(
                        tween: Tween(begin: 0, end: 70),
                        duration: const Duration(milliseconds: 1200),
                        curve: Curves.easeOutCubic,
                        builder: (context, width, child) {
                          return Container(
                            width: width,
                            height: 6,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.4),
                              borderRadius: BorderRadius.circular(10),
                            ),
                          );
                        },
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

  Widget _buildBackgroundIcon({
    double? top,
    double? bottom,
    double? left,
    double? right,
    required IconData icon,
    required double size,
    required double angle,
  }) {
    return Positioned(
      top: top,
      bottom: bottom,
      left: left,
      right: right,
      child: Opacity(
        opacity: 0.2, // slightly increased
        child: Transform.rotate(
          angle: angle,
          child: Icon(icon, size: size, color: Colors.white),
        ),
      ),
    );
  }
}

class MedicalPatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    const double spacing = 100.0;

    for (double i = 0; i < size.width; i += spacing) {
      for (double j = 0; j < size.height; j += spacing) {
        canvas.drawCircle(Offset(i + 20, j + 20), 2, paint);
        canvas.drawRect(Rect.fromLTWH(i + 70, j + 60, 6, 6), paint);
      }
    }
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}

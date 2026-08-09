import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:medspot/pages/reservation_page.dart';
import 'package:provider/provider.dart';
import 'package:overlay_support/overlay_support.dart';
import 'pages/splash_page.dart';
import 'pages/login_page.dart';
import 'pages/signup_page.dart';
import 'pages/home_page.dart';
import 'services/widgets/menu_page.dart';
import 'pages/Direction_page.dart';
import 'pages/prescription_page.dart';
import 'pages/forget_password_page.dart';
import 'pages/otp_page.dart';
import 'pages/newpass_page.dart';
import 'pages/search_page.dart';
import 'pages/detail_page.dart';
import 'pages/settings_page.dart';
import 'pages/result_page.dart';
import 'pages/help_support.dart';
import 'pages/privacy_page.dart';
import 'pages/term_condition_page.dart';
import 'pages/about_us.dart';
import 'pages/edit_name_page.dart';
import 'pages/change_password_page.dart';
import 'pages/change_email_page.dart';
import 'pages/today_reservation_page.dart';
import 'pages/prescription_history.dart';
import 'pages/favorite_pharmacy_page.dart';
import 'pages/profile_page.dart';
import 'pages/rating_review.dart';
import 'services/notification_service.dart';
import 'services/navigation_service.dart';
import 'dart:convert';

class ThemeProvider extends ChangeNotifier {
  bool _isDarkMode = false;
  bool get isDarkMode => _isDarkMode;
  ThemeMode get themeMode => _isDarkMode ? ThemeMode.dark : ThemeMode.light;

  void toggleTheme(bool value) {
    _isDarkMode = value;
    notifyListeners();
  }
  ThemeData get themeData {
    return _isDarkMode ? darkThemeData : lightThemeData;
  }

  // Light Theme Configuration
  static final lightThemeData = ThemeData(
    brightness: Brightness.light,
    primaryColor: const Color(0xFF2A4ECA),
    scaffoldBackgroundColor: Colors.white,
    colorScheme: const ColorScheme.light(
      primary: Color(0xFF2A4ECA),
      secondary: Color(0xFF2A4ECA),
    ),
  );

  // Dark Theme Configuration
  static final darkThemeData = ThemeData(
    brightness: Brightness.dark,
    primaryColor: const Color(0xFF2A4ECA),
    scaffoldBackgroundColor: const Color(
      0xFF0F172A,
    ), // Slate 900 jo aapne use kiya tha
    colorScheme: const ColorScheme.dark(
      primary: Color(0xFF2A4ECA),
      secondary: Color(0xFF2A4ECA),
      surface: Color(0xFF1E293B),
    ),
  );
}

Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  await NotificationService.initialize();

  print("===== BACKGROUND NOTIFICATION =====");
  print("TITLE: ${message.notification?.title}");
  print("BODY: ${message.notification?.body}");
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp();
  await NotificationService.initialize();

  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  runApp(
    MultiProvider(
      providers: [ChangeNotifierProvider(create: (_) => ThemeProvider())],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  void handleNotification(RemoteMessage message) {
    final data = message.data;

    if (data.isEmpty) return;

    final type = data["type"];

    if (type == "prescription_response") {
      final prescriptionId = int.parse(data["prescriptionId"]);

      Navigator.pushNamed(
        NavigationService.navigatorKey.currentContext!,
        "/prescription_history",
        arguments: prescriptionId,
      );
    }

    if (type == "reservation_completed") {
      showDialog(
        context: NavigationService.navigatorKey.currentContext!,
        builder: (_) {
          return AlertDialog(
            title: const Text("Reservation Completed"),

            content: const Text("Please rate your pharmacy."),

            actions: [
              TextButton(
                onPressed: () {
                  Navigator.pop(NavigationService.navigatorKey.currentContext!);
                },
                child: const Text("Later"),
              ),

              ElevatedButton(
                onPressed: () {
                  Navigator.pop(NavigationService.navigatorKey.currentContext!);

                  Navigator.pushNamed(
                    NavigationService.navigatorKey.currentContext!,
                    "/rating_review",
                    arguments: {
                      "reservationId": int.parse(data["reservationId"]),

                      "pharmacyId": int.parse(data["pharmacyId"]),

                      "pharmacyName": data["pharmacyName"],
                    },
                  );
                },
                child: const Text("Rate Now"),
              ),
            ],
          );
        },
      );
    }
  }

  @override
  void initState() {
    super.initState();

    getToken();
    FirebaseMessaging.onMessageOpenedApp.listen(handleNotification);
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      NotificationService.showNotification(
        title: message.notification?.title ?? "MedSpot",
        body: message.notification?.body ?? "",
        payload: jsonEncode(message.data),
      );
    });

    // App opened from terminated state
    FirebaseMessaging.instance.getInitialMessage().then((
      RemoteMessage? message,
    ) {
      if (message != null) {
        handleNotification(message);
      }
    });
  }

  Future<void> getToken() async {
    await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    String? token = await FirebaseMessaging.instance.getToken();
    print("FCM TOKEN: $token");
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return OverlaySupport.global(
          child: MaterialApp(
            navigatorKey: NavigationService.navigatorKey,
            debugShowCheckedModeBanner: false,
            title: 'MedSpot',
            themeMode: themeProvider.themeMode,
            theme: ThemeProvider.lightThemeData,
            darkTheme: ThemeProvider.darkThemeData,
            initialRoute: '/splash',
            onGenerateRoute: (settings) {
              if (settings.name == "/result") {
                final result = settings.arguments as Map<String, dynamic>;

                return MaterialPageRoute(
                  builder: (_) => PharmacyListScreen(
                    pharmacies: List<Map<String, dynamic>>.from(result["data"]),
                  ),
                );
              }

              if (settings.name == "/pharmacy_detail") {
                final pharmacy = settings.arguments as Map<String, dynamic>;

                return MaterialPageRoute(
                  builder: (_) => PharmacyDetailsScreen(pharmacy: pharmacy),
                );
              }
              if (settings.name == "/rating_review") {
                final args = settings.arguments as Map<String, dynamic>;

                return MaterialPageRoute(
                  builder: (_) => PharmacyReviewScreen(
                    reservationId: args["reservationId"],

                    pharmacyId: args["pharmacyId"],

                    pharmacyName: args["pharmacyName"],
                  ),
                );
              }

              return null;
            },

            routes: {
              '/splash': (context) => const MedSpotSplash(),
              '/login': (context) => const MedSpotLoginPage(),
              '/signup': (context) => const Medspotsignup(),
              '/home': (context) => const MedSpotDashboard(),
              '/menu': (context) => const MedSpotMenuDrawer(),
              '/profile': (context) => const PremiumProfileScreen(),
              '/Direction': (context) => const PharmacyDirectionScreen(),
              // '/result': (context) => const PharmacyListScreen(),
              '/search': (context) => const MedicineSearchPage(),
              '/prescription': (context) => const PrescriptionUploadScreen(),
              '/forget_password': (context) => const MedSpotForgotPassword(),
              '/otp': (context) => const MedSpotOTPPage(),
              '/newpass_page': (context) => const NewPasswordScreen(),
              // '/pharmacy_detail': (context) => const PharmacyDetailsScreen(),
              '/settings': (context) => const MedSpotSettings(),
              '/help_support': (context) => const SupportCenterScreen(),
              '/term_condition': (context) => const TermsScreen(),
              '/privacy': (context) => const PrivacyPolicyPage(),
              '/about_us': (context) => const AboutMedSpotScreen(),
              '/reservation': (context) => const ReservationDetailsScreen(),
              '/edit': (context) => const ChangeNameScreen(),
              '/change_email': (context) => const ChangeEmailScreen(),
              '/change_password': (context) => const ChangePasswordScreen(),
              '/today_reservation': (context) => const ReservationsScreen(),
              '/prescription_history': (context) =>const PrescriptionHistoryScreen(),
              '/favorite_pharmacy': (context) =>const FavouritePharmaciesPage(),

              // '/pharmacy_response': (context) => const PharmacyResponseScreen(),
            },
          ),
        );
      },
    );
  }
}

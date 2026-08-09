import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

class PatientApi {
  static const String baseUrl =   "http://192.168.18.81:5000/api/patient";
  static const String reviewUrl = "http://192.168.18.81:5000/api/patient/reviews";
  static String? userName;
  static String? userEmail;
  static String? userToken;


  static Map<String, String> _getHeaders() {
    return {
      "Content-Type": "application/json",
      if (userToken != null) "Authorization": "Bearer $userToken",
    };
  }

  static void logout() {
    userName = null;
    userEmail = null;
    userToken = null;
    print("User logged out locally");
  }

  /// =========================
  /// REGISTER
  /// =========================
  static Future<void> register({
    required String name,
    required String email,
    required String password,
  }) async {
    final response = await http.post(
      Uri.parse("$baseUrl/register"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({"name": name, "email": email, "password": password}),
    );

    final body = jsonDecode(response.body);

    if (response.statusCode != 201 && response.statusCode != 200) {
      throw body["message"] ?? "Registration failed";
    }
  }

  /// =========================
  /// LOGIN
  /// =========================
  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    String? fcmToken = await FirebaseMessaging.instance.getToken();
    print("FCM TOKEN => $fcmToken");

    final response = await http.post(
      Uri.parse("$baseUrl/login"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "email": email,
        "password": password,
        "fcm_token": fcmToken,
      }),
    );

    final body = jsonDecode(response.body);

    if (response.statusCode == 200 && body["success"] == true) {
      userToken = body['token'];

      var userData = body['user'] ?? body['patient'];

      userName = userData['name'];
      userEmail = userData['email'];

      final prefs = await SharedPreferences.getInstance();

      await prefs.setInt("patient_id", userData['patient_id']);

      String? fcmToken = await FirebaseMessaging.instance.getToken();

      print("FCM TOKEN => $fcmToken");

      return body;
    } else {
      throw body["message"] ?? "Login failed";
    }
  }

  /// =========================
  /// GOOGLE LOGIN (FIXED & SAFE)
  /// =========================
  static Future<Map<String, dynamic>> googleLogin(String idToken) async {
    try {
      final response = await http.post(
        Uri.parse("$baseUrl/google-login"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "idToken": idToken, // Exact purana structure
        }),
      );

      final body = jsonDecode(response.body);
      print("Google Login Response From Backend: $body");

      if (response.statusCode == 200 && body["success"] == true) {
        userToken = body['token'];

        var userData = body['user'] ?? body['patient'];

        if (userData != null) {
          userName = userData['name'];
          userEmail = userData['email'];

          final prefs = await SharedPreferences.getInstance();

          if (userData['patient_id'] != null) {
            int pId = int.tryParse(userData['patient_id'].toString()) ?? 0;
            await prefs.setInt("patient_id", pId);
          }

          print("Google Login Success! Local Data Synced => Name: $userName");
        }

        return body;
      } else {
        throw body["message"] ?? "Google login failed";
      }
    } catch (e) {
      print("Google API Error: $e");
      rethrow;
    }
  }

  /// =========================
  /// FORGOT PASSWORD
  /// =========================
  static Future<String> forgotPassword({required String email}) async {
    final res = await http.post(
      Uri.parse("$baseUrl/forgot-password"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({"email": email}),
    );

    final body = jsonDecode(res.body);

    if (res.statusCode == 200) {
      return body['resetToken'];
    } else {
      throw body['message'] ?? "Failed to send reset email";
    }
  }

  /// =========================
  /// VERIFY OTP
  /// =========================
  static Future<void> verifyOtp({
    required String resetToken,
    required String otp,
  }) async {
    final res = await http.post(
      Uri.parse("$baseUrl/verify-otp"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({"resetToken": resetToken, "otp": otp}),
    );

    if (res.statusCode != 200) {
      final body = jsonDecode(res.body);
      throw body['message'] ?? "Invalid or expired OTP";
    }
  }

  /// =========================
  /// RESET PASSWORD
  /// =========================
  static Future<void> resetPassword({
    required String resetToken,
    required String newPassword,
  }) async {
    final response = await http.post(
      Uri.parse("$baseUrl/reset-password"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({"resetToken": resetToken, "newPassword": newPassword}),
    );

    if (response.statusCode != 200) {
      final body = jsonDecode(response.body);
      throw body["message"] ?? "Password reset failed";
    }
  }

  /// UPDATE PROFILE (Name & Email)
  /// =========================
  static Future<void> updateProfile({
    required String newName,
    required String newEmail,
  }) async {
    final response = await http.put(
      Uri.parse("$baseUrl/update-profile"),
      headers: _getHeaders(),
      body: jsonEncode({"name": newName, "email": newEmail}),
    );

    final body = jsonDecode(response.body);

    if (response.statusCode == 200 && body["success"] == true) {
      // Local values update karein taake profile screen par foran show ho
      userName = newName;
      userEmail = newEmail;
      print("Profile updated successfully in app and database");
    } else {
      throw body["message"] ?? "Failed to update profile";
    }
  }

  /// =========================
  /// UPDATE PASSWORD
  /// =========================
  static Future<void> updatePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final response = await http.put(
      Uri.parse("$baseUrl/update-password"),
      headers: _getHeaders(),
      body: jsonEncode({
        "oldPassword": currentPassword, // Make sure this matches backend key
        "newPassword": newPassword,
      }),
    );

    final body = jsonDecode(response.body);

    if (response.statusCode != 200 || body["success"] == false) {
      throw body["message"] ?? "Failed to update password";
    }
  }

// 
  static Future<List<String>> searchMedicines({
    required String keyword,
    required double latitude,
    required double longitude,
  }) async {
    final url = Uri.parse(
      "$baseUrl/search-medicines"
      "?keyword=$keyword"
      "&lat=$latitude"
      "&lng=$longitude",
    );

    final response = await http.get(url);

    if (response.statusCode != 200) {
      throw Exception("Failed to search medicines");
    }

    final List data = jsonDecode(response.body);

    return data.map<String>((e) => e["name"].toString()).toList();
  }



  static Future<List<dynamic>> getNearbyPharmacies({
    required double latitude,
    required double longitude,
  }) async {
    final url = Uri.parse(
      "$baseUrl/nearby-pharmacies"
      "?latitude=$latitude"
      "&longitude=$longitude",
    );

    final response = await http.get(url, headers: _getHeaders());

    final body = jsonDecode(response.body);

    print("STATUS: ${response.statusCode}");
    print("BODY: ${response.body}");

    if (response.statusCode == 200) {
      return body["data"] ?? [];
    }

    throw body["message"] ?? "Failed to fetch nearby pharmacies";
  }


 static Future<Map<String, dynamic>> search({
    required String mode,
    required List<String> medicines,
    required double latitude,
    required double longitude,
  }) async {
    final response = await http.post(
      Uri.parse("$baseUrl/search"),
      headers: _getHeaders(),
      body: jsonEncode({
        "mode": mode,
        "latitude": latitude,
        "longitude": longitude,
        "medicines": medicines.map((e) => {"name": e}).toList(),
      }),
    );

    final body = jsonDecode(response.body);

    print("STATUS: ${response.statusCode}");
    print("BODY: ${response.body}");

    if (response.statusCode == 200) {
      return body;
    }

    throw body["message"] ?? "Search failed";
  }



  //Prescription UPLOOOAD//
  static Future<Map<String, dynamic>> uploadPrescription({
    required int patientId,
    required String image_url,
    required String notes,
    required double radius,
    required double latitude,
    required double longitude,
  }) async {
    try {
      final response = await http.post(
        Uri.parse("$baseUrl/prescriptions"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "patient_id": patientId,
          "image_url": image_url,
          "notes": notes,
          "radius": radius,
          "latitude": latitude,
          "longitude": longitude,
        }),
      );

      print("Upload Response:");
      print(response.body);

      final body = jsonDecode(response.body);

      if (response.statusCode == 201 || response.statusCode == 200) {
        return body;
      }

      throw Exception(body["message"] ?? "Failed to upload prescription");
    } catch (e) {
      print("Upload Error: $e");
      rethrow;
    }
  }

static Future<Map<String, dynamic>> getPrescriptionResponses(
  String prescriptionId,
) async {
  final url =
      '$baseUrl/prescriptions/responses/prescription/$prescriptionId';

  print('RESPONSES URL => $url');

  final response = await http.get(
    Uri.parse(url),
    headers: _getHeaders(),
  );

  dynamic body;

  try {
    body = jsonDecode(response.body);
  } catch (error) {
    throw Exception(
      'Backend returned a non-JSON response.\n'
      'Status: ${response.statusCode}\n'
      'URL: $url\n'
      'Response: ${response.body}',
    );
  }

  if (response.statusCode == 200) {
    if (body is Map<String, dynamic>) {
      return body;
    }

    return Map<String, dynamic>.from(body as Map);
  }

  throw Exception(
    body is Map
        ? body['message'] ?? 'Failed to load pharmacy responses'
        : 'Failed to load pharmacy responses',
  );
}

  static Future<List<dynamic>> getPatientPrescriptions(String patientId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/prescriptions/patient/$patientId'),
      headers: _getHeaders(),
    );
    print("URL => $baseUrl/prescriptions/patient/$patientId");
    print("STATUS => ${response.statusCode}");
    print("BODY => ${response.body}");

    final body = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return body["data"] ?? [];
    }

    throw body["message"];
  }


  static Future<Map<String, dynamic>> createReservation({
    required int pharmacyId,
    required String reservationType,
    required List<Map<String, dynamic>> items,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final int? patientId = prefs.getInt("patient_id");

    if (patientId == null) {
      throw "Authentication error: Patient ID not found. Please log in again.";
    }

    final response = await http.post(
      Uri.parse("$baseUrl/reservations"),
      headers: _getHeaders(),
      body: jsonEncode({
        "user_id": patientId,
        "pharmacy_id": pharmacyId,
        "reservation_type": reservationType,
        "medicines": items,
      }),
    );

    final body = jsonDecode(response.body);

    if (response.statusCode == 200 || response.statusCode == 201) {
      return body;
    }

    throw body["message"] ?? "Failed to create reservation";
  }

    static Future<List<dynamic>> getReservations() async {
    final prefs = await SharedPreferences.getInstance();

    final int? patientId = prefs.getInt("patient_id");

    if (patientId == null) {
      throw "Patient not found";
    }

    final response = await http.get(
      Uri.parse("$baseUrl/reservations/patient/$patientId"),
      headers: _getHeaders(),
    );

    final body = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return body["data"];
    }

    throw body["message"];
  }

  static Future<Map<String, dynamic>> getReservationDetails(
    int reservationId,
  ) async {
    final response = await http.get(
      Uri.parse("$baseUrl/reservations/$reservationId"),
      headers: _getHeaders(),
    );

    final body = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return body["data"] ?? body;
    }

    throw body["message"] ?? "Failed to load reservation";
  }

  static Future<void> cancelReservation(int reservationId) async {
    final response = await http.delete(
      Uri.parse("$baseUrl/reservations/$reservationId"),
      headers: _getHeaders(),
    );

    final body = jsonDecode(response.body);

    if (response.statusCode != 200) {
      throw body["message"] ?? "Failed to cancel reservation";
    }
  }


  
 

  // static Future<List<dynamic>> searchMedicine(String medicine) async {
  //   final response = await http.post(
  //     Uri.parse("$baseUrl/api/patient/search"),
  //     body: jsonEncode({"medicine_name": medicine}),
  //     headers: {"Content-Type": "application/json"},
  //   );

  //   if (response.statusCode == 200) {
  //     return jsonDecode(response.body);
  //   }

  //   throw Exception("Search failed");
  // }


  /// =========================
  /// CREATE RESERVATION
  /// =========================


  static Future<List<dynamic>> searchPharmacies(String keyword) async {
    final response = await http.get(
      Uri.parse("$baseUrl/search-pharmacies?keyword=$keyword"),
      headers: _getHeaders(),
    );

    final body = jsonDecode(response.body);

    print("STATUS => ${response.statusCode}");
    print("BODY => ${response.body}");

    if (response.statusCode == 200) {
      return body["data"] ?? [];
    }

    throw body["message"] ?? "Failed to search pharmacies";
  }



  /// SUBMIT REVIEW
  /// =========================
  ///
  static Future<void> submitReview({
    int? reservationId,
    required int pharmacyId,
    required int rating,
    required String review,
  }) async {
    final response = await http.post(
      Uri.parse("$reviewUrl/add"),
      headers: _getHeaders(),
      body: jsonEncode({
        "reservation_id": reservationId,
        "pharmacy_id": pharmacyId,
        "rating": rating,
        "review": review,
      }),
    );
        print("STATUS = ${response.statusCode}");
print("BODY = ${response.body}");

    final body = jsonDecode(response.body);




    if (response.statusCode != 201 && response.statusCode != 200) {
      throw body["message"] ?? "Failed to submit review";
    }
  }

  static Future<List<dynamic>> getReviews(int pharmacyId) async {
    final response = await http.get(
      Uri.parse("$reviewUrl/$pharmacyId"),
      headers: _getHeaders(),
    );

    final body = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return body["reviews"];
    }

    throw body["message"] ?? "Failed to load reviews";
  }

  static Future<bool> hasReviewed(int reservationId) async {
    final response = await http.get(
      Uri.parse("$reviewUrl/check/$reservationId"),
      headers: _getHeaders(),
    );

    final body = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return body["reviewed"];
    }

    return false;
  }

static Future<Map<String, dynamic>> addFavoritePharmacy(
  int pharmacyId,
) async {
  if (userToken == null || userToken!.isEmpty) {
    throw Exception(
      "Authentication token not found. Please log in again.",
    );
  }

  final url =
      "$baseUrl/favorite-pharmacies/$pharmacyId";

  print("ADD FAVORITE URL => $url");

  final response = await http.post(
    Uri.parse(url),
    headers: _getHeaders(),
  );

  print("ADD FAVORITE STATUS => ${response.statusCode}");
  print("ADD FAVORITE BODY => ${response.body}");

  dynamic decodedBody;

  try {
    decodedBody = jsonDecode(response.body);
  } catch (_) {
    throw Exception(
      "Backend returned a non-JSON response: "
      "${response.body}",
    );
  }

  final Map<String, dynamic> data =
      decodedBody is Map
          ? Map<String, dynamic>.from(decodedBody)
          : <String, dynamic>{};

  if (response.statusCode == 200 ||
      response.statusCode == 201) {
    return data;
  }

  throw Exception(
    data["message"] ??
        "Failed to add favorite pharmacy",
  );
}

static Future<Map<String, dynamic>> removeFavoritePharmacy(
  int pharmacyId,
) async {
  if (userToken == null || userToken!.isEmpty) {
    throw Exception("Authentication token not found");
  }

  final response = await http.delete(
    Uri.parse("$baseUrl/favorite-pharmacies/$pharmacyId"),
    headers: _getHeaders(),
  );

  final Map<String, dynamic> data =
      jsonDecode(response.body);

  if (response.statusCode == 200) {
    return data;
  }

  throw Exception(
    data["message"] ?? "Failed to remove favorite pharmacy",
  );
}

static Future<List<Map<String, dynamic>>>
    getFavoritePharmacies() async {
  if (userToken == null || userToken!.isEmpty) {
    throw Exception("Authentication token not found");
  }

  final response = await http.get(
    Uri.parse("$baseUrl/favorite-pharmacies"),
    headers: _getHeaders(),
  );

  final Map<String, dynamic> data =
      jsonDecode(response.body);

  if (response.statusCode == 200) {
    final List<dynamic> favorites =
        data["data"] ?? [];

    return favorites
        .map(
          (item) => Map<String, dynamic>.from(item),
        )
        .toList();
  }

  throw Exception(
    data["message"] ??
        "Failed to fetch favorite pharmacies",
  );
}


static Future<bool> isPharmacyFavorite(
  int pharmacyId,
) async {
  if (userToken == null || userToken!.isEmpty) {
    throw Exception("Authentication token not found");
  }

  final response = await http.get(
    Uri.parse(
      "$baseUrl/favorite-pharmacies/$pharmacyId/status",
    ),
    headers: _getHeaders(),
  );

  final Map<String, dynamic> data =
      jsonDecode(response.body);

  if (response.statusCode == 200) {
    return data["isFavorite"] == true;
  }

  throw Exception(
    data["message"] ??
        "Failed to check favorite status",
  );
}


}

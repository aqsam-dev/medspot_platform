import 'dart:io';
import 'dart:typed_data';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:pro_image_editor/pro_image_editor.dart';
import 'package:path_provider/path_provider.dart';
import 'package:medspot/services/patient_api.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:medspot/pages/pharmacy_response_page.dart';

class PrescriptionUploadScreen extends StatefulWidget {
  const PrescriptionUploadScreen({super.key});

  @override
  State<PrescriptionUploadScreen> createState() =>
      _PrescriptionUploadScreenState();
}

class _PrescriptionUploadScreenState extends State<PrescriptionUploadScreen> {
  final double _radiusValue = 5;
  File? _selectedImage;
  final TextEditingController _descriptionController = TextEditingController();
  final ImagePicker _picker = ImagePicker();
  String? _topMessage;
  bool _isNotificationError = false;

  void _showTopNotification(String message, {bool isError = false}) {
    setState(() {
      _topMessage = message;
      _isNotificationError = isError;
    });
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _topMessage = null);
    });
  }

  Future<Map<String, double>?> _getLocation() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _showTopNotification("Location services disabled", isError: true);
      return null;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        _showTopNotification("Location permission denied", isError: true);
        return null;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      _showTopNotification("Location permanently denied", isError: true);
      return null;
    }

    final position = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );

    return {"lat": position.latitude, "lng": position.longitude};
  }

  // Handle image selection and editing
 Future<void> _pickImage(ImageSource source) async {
  try {
    final pickedFile = await _picker.pickImage(
      source: source,
      imageQuality: 90,
    );

    if (pickedFile == null) return;

    final Uint8List originByte = await pickedFile.readAsBytes();

    if (!mounted) return;

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ProImageEditor.memory(
          originByte,

          callbacks: ProImageEditorCallbacks(
            onImageEditingComplete: (Uint8List editedBytes) async {
              final dir = await getTemporaryDirectory();

              final file = File(
                "${dir.path}/prescription_${DateTime.now().millisecondsSinceEpoch}.png",
              );

              await file.writeAsBytes(editedBytes);

              if (!mounted) return;

              setState(() {
                _selectedImage = file;
              });

              Navigator.pop(context);

              _showTopNotification(
                "Prescription prepared successfully!",
              );
            },
          ),
        ),
      ),
    );
  } catch (e) {
    debugPrint(e.toString());

    _showTopNotification(
      "Failed to process image",
      isError: true,
    );
  }
}

  Future<String?> uploadToCloudinary(File file) async {
    try {
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('https://api.cloudinary.com/v1_1/dmh8lgoyp/image/upload'),
      );

      request.fields['upload_preset'] = 'prescriptions';

      // ✅ IMPORTANT: Works ONLY if preset = dynamic
      request.fields['folder'] = 'prescriptions';

      request.files.add(await http.MultipartFile.fromPath('file', file.path));

      var response = await request.send();

      final res = await response.stream.bytesToString();

      if (response.statusCode == 200) {
        final data = jsonDecode(res);
        return data['secure_url'];
      } else {
        print("Cloudinary error: $res");
        return null;
      }
    } catch (e) {
      print("Cloudinary exception: $e");
      return null;
    }
  }

  bool _isUploading = false;

  Future<void> _showUploadSuccessDialog() async {
  final bool isDark =
      Theme.of(context).brightness ==
          Brightness.dark;

  await showDialog<void>(
    context: context,
    barrierDismissible: false,
    builder: (dialogContext) {
      return PopScope(
        canPop: false,
        child: AlertDialog(
          backgroundColor: isDark
              ? const Color(0xFF1E293B)
              : Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius:
                BorderRadius.circular(24),
          ),
          contentPadding:
              const EdgeInsets.all(24),
          content: Column(
            mainAxisSize:
                MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration:
                    const BoxDecoration(
                  color:
                      Color(0xFFE8F8F1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_rounded,
                  color:
                      Color(0xFF10B981),
                  size: 42,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                "Prescription Uploaded!",
                textAlign:
                    TextAlign.center,
                style: GoogleFonts
                    .plusJakartaSans(
                  fontSize: 22,
                  fontWeight:
                      FontWeight.w800,
                  color: isDark
                      ? Colors.white
                      : const Color(
                          0xFF0F172A,
                        ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                "Your prescription has been uploaded successfully. "
                "You will be informed when a pharmacy responds.",
                textAlign:
                    TextAlign.center,
                style: GoogleFonts
                    .plusJakartaSans(
                  fontSize: 14,
                  height: 1.5,
                  color: isDark
                      ? const Color(
                          0xFFCBD5E1,
                        )
                      : const Color(
                          0xFF64748B,
                        ),
                ),
              ),
              const SizedBox(height: 24),

              SizedBox(
                width:
                    double.infinity,
                child:
                    ElevatedButton(
                  onPressed: () {
                    Navigator.of(
                      dialogContext,
                    ).pop();

                    Navigator.of(
                      context,
                    ).pushNamedAndRemoveUntil(
                      "/home",
                      (route) => false,
                    );
                  },
                  child:
                      const Text(
                    "Go to Home",
                  ),
                ),
              ),

              const SizedBox(height: 10),

              SizedBox(
                width:
                    double.infinity,
                child:
                    OutlinedButton(
                  onPressed: () {
                    Navigator.of(
                      dialogContext,
                    ).pop();

                    setState(() {
                      _selectedImage =
                          null;
                      _descriptionController
                          .clear();
                    });
                  },
                  child:
                      const Text(
                    "Upload Another Prescription",
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    },
  );
}


Future<void> _handleUpload() async {
  if (_selectedImage == null) {
    _showTopNotification("Prescription required", isError: true);
    HapticFeedback.heavyImpact();
    return;
  }
  
  if (_isUploading) return;
  setState(() => _isUploading = true);
  try {
    _showTopNotification("Uploading image...");
    final imageUrl = await uploadToCloudinary(_selectedImage!);
    if (imageUrl == null) {
      _showTopNotification(
        "Image upload failed. Check internet or try again.",
        isError: true,
      );
      return;
    }
    _showTopNotification("Getting location...");
    final location = await _getLocation();

    if (location == null) {
      _showTopNotification("Location required", isError: true);
      return;
    }

    _showTopNotification("Sending prescription...");

    final prefs = await SharedPreferences.getInstance();
    final patientId = prefs.getInt("patient_id");

    if (patientId == null) {
      throw Exception("Patient not logged in");
    }

    final result = await PatientApi.uploadPrescription(
      patientId: patientId,
      image_url: imageUrl,
      notes: _descriptionController.text.trim(),
      radius: _radiusValue,
      latitude: location['lat']!,
      longitude: location['lng']!,
    );

    if (result["success"] == true) {
      if (result["success"] == true) {
  if (!mounted) return;

  await _showUploadSuccessDialog();
} else {
  _showTopNotification(
    result["message"] ?? "Upload failed",
    isError: true,
  );
}
    } else {
      _showTopNotification(
        result["message"] ?? "Upload failed",
        isError: true,
      );
    }
  } catch (e) {
    print("Upload error: $e");

    _showTopNotification(
      "Something went wrong. Please try again.",
      isError: true,
    );
  } finally {
    if (mounted) {
      setState(() => _isUploading = false);
    }
  }
}

  @override
  Widget build(BuildContext context) {
    final bool isDarkMode = Theme.of(context).brightness == Brightness.dark;

    const Color primaryBlue = Color(0xFF2A4ECA);
    final Color bgColor = isDarkMode ? const Color(0xFF0F172A) : Colors.white;
    final Color textColor = isDarkMode ? Colors.white : const Color(0xFF1E293B);
    final Color subTextColor = isDarkMode
        ? const Color(0xFF94A3B8)
        : const Color(0xFF64748B);
    final Color fieldColor = isDarkMode
        ? const Color(0xFF020617)
        : const Color(0xFFF8FAFC);
    final Color borderColor = isDarkMode
        ? const Color(0xFF334155)
        : const Color(0xFFF1F5F9);

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        backgroundColor: bgColor,
        elevation: 0,
        leading: _buildBackButton(textColor),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 10),
                  _buildHeader(primaryBlue, textColor),
                  const SizedBox(height: 32),
                  _buildTitle(textColor, subTextColor),
                  const SizedBox(height: 32),
                  if (_selectedImage != null)
                    _buildAdvancedImagePreview(
                      borderColor,
                      textColor,
                      isDarkMode,
                      primaryBlue,
                    ),
                  const SizedBox(height: 16),
                  _buildMainButton(
                    icon: Icons.photo_library_outlined,
                    label: "Gallery",
                    isPrimary: true,
                    primaryBlue: primaryBlue,
                    textColor: Colors.white,
                    isDarkMode: isDarkMode,
                    onTap: () => _pickImage(ImageSource.gallery),
                  ),
                  const SizedBox(height: 12),
                  _buildMainButton(
                    icon: Icons.camera_enhance_outlined,
                    label: "Camera",
                    isPrimary: false,
                    primaryBlue: primaryBlue,
                    textColor: isDarkMode ? Colors.white : primaryBlue,
                    isDarkMode: isDarkMode,
                    onTap: () => _pickImage(ImageSource.camera),
                  ),
                  const SizedBox(height: 32),
                  _buildDescriptionField(
                    textColor,
                    subTextColor,
                    fieldColor,
                    borderColor,
                  ),
                  const SizedBox(height: 24),
                  _buildRadiusCard(
                    primaryBlue,
                    isDarkMode ? const Color(0xFF1E293B) : Colors.white,
                    textColor,
                    borderColor,
                  ),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    height: 60,
                    child: ElevatedButton(
                      onPressed: _isUploading ? null : _handleUpload,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryBlue,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                        elevation: 0,
                      ),
                      child: _isUploading
                          ? const SizedBox(
                              height: 22,
                              width: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : Text(
                              "Confirm & Send",
                              style: GoogleFonts.plusJakartaSans(
                                fontWeight: FontWeight.w800,
                                fontSize: 18,
                                color: Colors.white,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 40),
                  _buildFooter(subTextColor),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),

          /// COLOR-CODED NOTIFICATION WITH SWIPE DISMISS
          if (_topMessage != null)
            Positioned(
              top: 20,
              left: 20,
              right: 20,
              child: Dismissible(
                key: UniqueKey(),
                direction: DismissDirection.horizontal,
                onDismissed: (direction) {
                  setState(() => _topMessage = null);
                },
                child: _buildTopNotification(isDarkMode),
              ),
            ),
        ],
      ),
    );
  }

  /// --- UI COMPONENTS ---

  Widget _buildHeader(Color primaryBlue, Color textColor) {
    return Row(
      children: [
        Icon(Icons.health_and_safety_rounded, color: primaryBlue, size: 32),
        const SizedBox(width: 10),
        Text(
          "MedSpot",
          style: GoogleFonts.plusJakartaSans(
            fontSize: 24,
            fontWeight: FontWeight.w900,
            color: textColor,
          ),
        ),
      ],
    );
  }

  Widget _buildAdvancedImagePreview(
    Color borderColor,
    Color textColor,
    bool isDark,
    Color primary,
  ) {
    return Column(
      children: [
        Container(
          height: 250,
          width: double.infinity,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: borderColor, width: 2),
            image: DecorationImage(
              image: FileImage(_selectedImage!),
              fit: BoxFit.cover,
            ),
          ),
          child: Align(
            alignment: Alignment.topRight,
            child: IconButton(
              icon: const CircleAvatar(
                backgroundColor: Colors.red,
                child: Icon(Icons.close, color: Colors.white, size: 16),
              ),
              onPressed: () => setState(() => _selectedImage = null),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
          decoration: BoxDecoration(
            color: isDark ? Colors.white10 : Colors.grey[100],
            borderRadius: BorderRadius.circular(15),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.auto_fix_high_rounded, color: primary, size: 18),
              const SizedBox(width: 8),
              Text(
                "Tap Gallery/Camera to re-edit",
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: textColor,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTopNotification(bool isDark) {
    final Color barColor = _isNotificationError
        ? Colors.redAccent
        : const Color(0xFF10B981);

    return TweenAnimationBuilder(
      duration: const Duration(milliseconds: 300),
      tween: Tween<double>(begin: -100, end: 0),
      builder: (context, double value, child) {
        return Transform.translate(
          offset: Offset(0, value),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: barColor,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: barColor.withOpacity(0.3),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                Icon(
                  _isNotificationError
                      ? Icons.error_outline
                      : Icons.check_circle_outline,
                  color: Colors.white,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _topMessage!,
                    style: GoogleFonts.plusJakartaSans(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildBackButton(Color textColor) {
    return IconButton(
      icon: Icon(Icons.arrow_back_ios_new_rounded, color: textColor, size: 20),
      onPressed: () => Navigator.pop(context),
    );
  }

  Widget _buildTitle(Color textColor, Color subTextColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Upload\nPrescription",
          style: GoogleFonts.plusJakartaSans(
            fontSize: 32,
            fontWeight: FontWeight.w800,
            color: textColor,
            height: 1.1,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          "Clear photo helps pharmacists read better.",
          style: GoogleFonts.plusJakartaSans(color: subTextColor),
        ),
      ],
    );
  }

  Widget _buildMainButton({
    required IconData icon,
    required String label,
    required bool isPrimary,
    required Color primaryBlue,
    required Color textColor,
    required bool isDarkMode,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 60,
        width: double.infinity,
        decoration: BoxDecoration(
          color: isPrimary
              ? primaryBlue
              : (isDarkMode ? Colors.white10 : primaryBlue.withOpacity(0.05)),
          borderRadius: BorderRadius.circular(18),
          border: isPrimary
              ? null
              : Border.all(color: primaryBlue.withOpacity(0.2)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: textColor, size: 22),
            const SizedBox(width: 10),
            Text(
              label,
              style: GoogleFonts.plusJakartaSans(
                fontWeight: FontWeight.w700,
                color: textColor,
                fontSize: 16,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDescriptionField(
    Color textColor,
    Color subTextColor,
    Color fieldColor,
    Color borderColor,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Notes (Optional)",
          style: GoogleFonts.plusJakartaSans(
            fontWeight: FontWeight.bold,
            color: textColor,
          ),
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _descriptionController,
          maxLines: 2,
          style: TextStyle(color: textColor),
          decoration: InputDecoration(
            hintText: "E.g. Only need these for 5 days...",
            hintStyle: TextStyle(color: subTextColor.withOpacity(0.5)),
            filled: true,
            fillColor: fieldColor,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(15),
              borderSide: BorderSide(color: borderColor),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(15),
              borderSide: BorderSide(color: borderColor),
            ),
          ),
        ),
      ],
    );
  }
// FIXED: Simplified UI showing only the fixed 5km indicator line
  Widget _buildRadiusCard(
      Color primary, Color cardColor, Color textColor, Color borderColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("Search Radius",
                  style: TextStyle(fontWeight: FontWeight.bold, color: textColor)),
              Text("5 km", // Fixed display
                  style: TextStyle(color: primary, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 12),
          // Simplified 5km indicator line instead of an editable slider
          Container(
            height: 4,
            width: double.infinity,
            decoration: BoxDecoration(
              color: primary, // Solid line representing fixed distance
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter(Color subTextColor) {
    return Center(
      child: Text(
        "🔒 End-to-End Encrypted Data",
        style: TextStyle(
          fontSize: 10,
          color: subTextColor,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

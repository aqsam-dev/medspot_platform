import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/patient_api.dart';

class FavouritePharmaciesPage extends StatefulWidget {
  const FavouritePharmaciesPage({super.key});

  @override
  State<FavouritePharmaciesPage> createState() =>
      _FavouritePharmaciesPageState();
}

class _FavouritePharmaciesPageState
    extends State<FavouritePharmaciesPage> {
  // ---------------------------------------------------------------------------
  // Theme constants
  // ---------------------------------------------------------------------------

  static const Color primaryBlue = Color(0xFF2A4ECA);
  static const Color slate950 = Color(0xFF020617);
  static const Color slate900 = Color(0xFF0F172A);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate400 = Color(0xFF94A3B8);

  // ---------------------------------------------------------------------------
  // Page state
  // ---------------------------------------------------------------------------

  List<Map<String, dynamic>> favouritePharmacies = [];

  final Set<int> processingPharmacyIds = {};

  bool isLoading = true;
  String? errorMessage;

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  @override
  void initState() {
    super.initState();
    _loadFavouritePharmacies();
  }

  // ---------------------------------------------------------------------------
  // API functions
  // ---------------------------------------------------------------------------

  Future<void> _loadFavouritePharmacies() async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      final result = await PatientApi.getFavoritePharmacies();

      if (!mounted) return;

      setState(() {
        favouritePharmacies = result.map((pharmacy) {
          return {
            ...pharmacy,
            'is_favorite': true,
          };
        }).toList();

        isLoading = false;
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        errorMessage = _cleanErrorMessage(error);
        isLoading = false;
      });
    }
  }

  Future<void> _toggleFavourite(
    Map<String, dynamic> pharmacy,
  ) async {
    final int? pharmacyId = _parseInt(pharmacy['pharmacy_id']);

    if (pharmacyId == null) {
      _showMessage(
        'Unable to identify this pharmacy.',
        isError: true,
      );
      return;
    }

    if (processingPharmacyIds.contains(pharmacyId)) {
      return;
    }

    final bool wasFavourite =
        pharmacy['is_favorite'] == true;

    setState(() {
      processingPharmacyIds.add(pharmacyId);
      pharmacy['is_favorite'] = !wasFavourite;
    });

    try {
      if (wasFavourite) {
        await PatientApi.removeFavoritePharmacy(pharmacyId);

        if (!mounted) return;

        setState(() {
          favouritePharmacies.removeWhere(
            (item) =>
                _parseInt(item['pharmacy_id']) == pharmacyId,
          );
        });

        _showMessage(
          '${_pharmacyName(pharmacy)} removed from favourites.',
        );
      } else {
        await PatientApi.addFavoritePharmacy(pharmacyId);

        if (!mounted) return;

        setState(() {
          pharmacy['is_favorite'] = true;
        });

        _showMessage(
          '${_pharmacyName(pharmacy)} added to favourites.',
        );
      }
    } catch (error) {
      if (!mounted) return;

      setState(() {
        pharmacy['is_favorite'] = wasFavourite;
      });

      _showMessage(
        _cleanErrorMessage(error),
        isError: true,
      );
    } finally {
      if (mounted) {
        setState(() {
          processingPharmacyIds.remove(pharmacyId);
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  void _openPharmacyDetails(
    Map<String, dynamic> pharmacy,
  ) {
    Navigator.pushNamed(
      context,
      '/pharmacy-details',
      arguments: pharmacy,
    );
  }

  void _openDirections(
    Map<String, dynamic> pharmacy,
  ) {
    final double? latitude = _parseDouble(
      pharmacy['map_lat'] ?? pharmacy['latitude'],
    );

    final double? longitude = _parseDouble(
      pharmacy['map_lng'] ?? pharmacy['longitude'],
    );

    if (latitude == null || longitude == null) {
      _showMessage(
        'Location is not available for this pharmacy.',
        isError: true,
      );
      return;
    }

    Navigator.pushNamed(
      context,
      '/Direction',
      arguments: {
        'pharmacy_id': pharmacy['pharmacy_id'],
        'pharmacy_name': _pharmacyName(pharmacy),
        'latitude': latitude,
        'longitude': longitude,
        'map_lat': latitude,
        'map_lng': longitude,
        'pharmacy': pharmacy,
      },
    );
  }

  // ---------------------------------------------------------------------------
  // Main UI
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final bool isDarkMode =
        Theme.of(context).brightness == Brightness.dark;

    final Color background =
        isDarkMode ? slate950 : const Color(0xFFF8FAFC);

    final Color surface =
        isDarkMode ? slate900 : Colors.white;

    final Color textColor =
        isDarkMode ? Colors.white : const Color(0xFF0F172A);

    final Color subTextColor =
        isDarkMode ? slate400 : const Color(0xFF64748B);

    final Color borderColor =
        isDarkMode ? slate800 : const Color(0xFFF1F5F9);

    return Scaffold(
      backgroundColor: background,
      body: SafeArea(
        bottom: false,
        child: Stack(
          children: [
            _buildBlurBackground(
              primaryBlue,
              isDarkMode,
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(
                  context,
                  textColor,
                  subTextColor,
                  surface,
                  primaryBlue,
                  borderColor,
                ),
                Expanded(
                  child: _buildPageContent(
                    surface: surface,
                    textColor: textColor,
                    subTextColor: subTextColor,
                    borderColor: borderColor,
                    isDarkMode: isDarkMode,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPageContent({
    required Color surface,
    required Color textColor,
    required Color subTextColor,
    required Color borderColor,
    required bool isDarkMode,
  }) {
    if (isLoading) {
      return const Center(
        child: CircularProgressIndicator(
          color: primaryBlue,
        ),
      );
    }

    if (errorMessage != null) {
      return _buildErrorState(
        surface: surface,
        textColor: textColor,
        subTextColor: subTextColor,
        borderColor: borderColor,
      );
    }

    if (favouritePharmacies.isEmpty) {
      return _buildEmptyState(
        surface: surface,
        textColor: textColor,
        subTextColor: subTextColor,
        borderColor: borderColor,
      );
    }

    return RefreshIndicator(
      color: primaryBlue,
      onRefresh: _loadFavouritePharmacies,
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        padding: const EdgeInsets.fromLTRB(
          24,
          0,
          24,
          40,
        ),
        itemCount: favouritePharmacies.length,
        itemBuilder: (context, index) {
          final pharmacy =
              favouritePharmacies[index];

          return _buildPharmacyCard(
            context: context,
            pharmacy: pharmacy,
            primary: primaryBlue,
            surface: surface,
            textColor: textColor,
            borderColor: borderColor,
            isDark: isDarkMode,
          );
        },
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Header
  // ---------------------------------------------------------------------------

  Widget _buildHeader(
    BuildContext context,
    Color textColor,
    Color subTextColor,
    Color surface,
    Color primary,
    Color borderColor,
  ) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: _circleBtn(
              Icons.arrow_back_ios_new_rounded,
              surface,
              primary,
              borderColor,
            ),
          ),
          const SizedBox(height: 32),
          Text(
            'Favourite Pharmacies',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: textColor,
              letterSpacing: -1,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Your trusted pharmacies, saved in one place.',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 15,
              fontWeight: FontWeight.w500,
              color: subTextColor,
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Pharmacy card
  // ---------------------------------------------------------------------------
Widget _buildPharmacyCard({
  required BuildContext context,
  required Map<String, dynamic> pharmacy,
  required Color primary,
  required Color surface,
  required Color textColor,
  required Color borderColor,
  required bool isDark,
}) {
  final int? pharmacyId =
      _parseInt(pharmacy['pharmacy_id']);

  final bool isFavourite =
      pharmacy['is_favorite'] != false;

  final bool isProcessing =
      pharmacyId != null &&
      processingPharmacyIds.contains(pharmacyId);

  final double? distance = _parseDouble(
    pharmacy['distance'] ??
        pharmacy['distance_km'],
  );

  final bool isOpen =
      pharmacy['is_open'] == true;

  final String todayHours =
      pharmacy['today_hours']
              ?.toString()
              .trim() ??
          '';

  final String address =
      _medicineSearchAddress(pharmacy);

  final String pharmacyName =
      pharmacy['pharmacy_name']
              ?.toString()
              .trim()
              .isNotEmpty ==
          true
      ? pharmacy['pharmacy_name']
          .toString()
          .trim()
      : 'Unnamed Pharmacy';

  final Color statusColor = isOpen
      ? const Color(0xFF16A34A)
      : const Color(0xFFEF4444);

  String timingText;

  if (todayHours.isEmpty ||
      todayHours.toLowerCase() == 'closed') {
    timingText =
        isOpen ? 'Open today' : 'Closed today';
  } else {
    timingText = isOpen
        ? 'Open today • $todayHours'
        : 'Closed today • $todayHours';
  }

  return Container(
    margin: const EdgeInsets.only(bottom: 20),
    padding: const EdgeInsets.all(22),
    decoration: BoxDecoration(
      color: surface,
      borderRadius: BorderRadius.circular(28),
      border: Border.all(color: borderColor),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withOpacity(
            isDark ? 0.35 : 0.04,
          ),
          blurRadius: 22,
          offset: const Offset(0, 10),
        ),
      ],
    ),
    child: InkWell(
      borderRadius: BorderRadius.circular(28),
      onTap: () => _openPharmacyDetails(pharmacy),
      child: Column(
        crossAxisAlignment:
            CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment:
                CrossAxisAlignment.start,
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: primary.withOpacity(0.1),
                  borderRadius:
                      BorderRadius.circular(16),
                ),
                child: Icon(
                  Icons.local_pharmacy_rounded,
                  color: primary,
                  size: 26,
                ),
              ),

              const SizedBox(width: 14),

              Expanded(
                child: Column(
                  crossAxisAlignment:
                      CrossAxisAlignment.start,
                  children: [
                    Text(
                      pharmacyName,
                      maxLines: 2,
                      overflow:
                          TextOverflow.ellipsis,
                      style:
                          GoogleFonts.plusJakartaSans(
                        color: textColor,
                        fontSize: 18,
                        fontWeight:
                            FontWeight.w800,
                      ),
                    ),

                    const SizedBox(height: 8),

                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      crossAxisAlignment:
                          WrapCrossAlignment.center,
                      children: [
                        if (distance != null)
                          Container(
                            padding:
                                const EdgeInsets
                                    .symmetric(
                              horizontal: 10,
                              vertical: 6,
                            ),
                            decoration:
                                BoxDecoration(
                              color: primary
                                  .withOpacity(0.09),
                              borderRadius:
                                  BorderRadius
                                      .circular(20),
                            ),
                            child: Row(
                              mainAxisSize:
                                  MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons
                                      .near_me_rounded,
                                  color: primary,
                                  size: 15,
                                ),
                                const SizedBox(
                                  width: 5,
                                ),
                                Text(
                                  '${distance.toStringAsFixed(1)} km away',
                                  style: GoogleFonts
                                      .plusJakartaSans(
                                    color: primary,
                                    fontSize: 12,
                                    fontWeight:
                                        FontWeight
                                            .w800,
                                  ),
                                ),
                              ],
                            ),
                          ),

                        Container(
                          padding:
                              const EdgeInsets
                                  .symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: statusColor
                                .withOpacity(0.1),
                            borderRadius:
                                BorderRadius
                                    .circular(20),
                          ),
                          child: Row(
                            mainAxisSize:
                                MainAxisSize.min,
                            children: [
                              Container(
                                width: 7,
                                height: 7,
                                decoration:
                                    BoxDecoration(
                                  color:
                                      statusColor,
                                  shape: BoxShape
                                      .circle,
                                ),
                              ),
                              const SizedBox(
                                width: 6,
                              ),
                              Text(
                                isOpen
                                    ? 'OPEN'
                                    : 'CLOSED',
                                style: GoogleFonts
                                    .plusJakartaSans(
                                  color:
                                      statusColor,
                                  fontSize: 11,
                                  fontWeight:
                                      FontWeight
                                          .w800,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(width: 8),

              GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: isProcessing
                    ? null
                    : () => _toggleFavourite(
                          pharmacy,
                        ),
                child: AnimatedContainer(
                  duration: const Duration(
                    milliseconds: 220,
                  ),
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: isFavourite
                        ? const Color(
                            0xFFFEE2E2,
                          ).withOpacity(
                            isDark ? 0.15 : 1,
                          )
                        : primary
                            .withOpacity(0.08),
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: isProcessing
                      ? SizedBox(
                          width: 18,
                          height: 18,
                          child:
                              CircularProgressIndicator(
                            strokeWidth: 2,
                            color: primary,
                          ),
                        )
                      : Icon(
                          isFavourite
                              ? Icons
                                  .favorite_rounded
                              : Icons
                                  .favorite_border_rounded,
                          color: isFavourite
                              ? const Color(
                                  0xFFEF4444,
                                )
                              : slate400,
                          size: 22,
                        ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 22),

          _medicineSearchDetailRow(
            icon: Icons.location_on_rounded,
            title: 'ADDRESS',
            value: address,
            primary: primary,
            isDark: isDark,
          ),

          const SizedBox(height: 16),

          _medicineSearchDetailRow(
            icon: isOpen
                ? Icons
                    .access_time_filled_rounded
                : Icons.schedule_rounded,
            title: "TODAY'S HOURS",
            value: timingText,
            primary: primary,
            isDark: isDark,
            valueColor: statusColor,
          ),
        ],
      ),
    ),
  );
}


Widget _medicineSearchDetailRow({
  required IconData icon,
  required String title,
  required String value,
  required Color primary,
  required bool isDark,
  Color? valueColor,
}) {
  return Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: primary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Icon(
          icon,
          color: primary,
          size: 20,
        ),
      ),

      const SizedBox(width: 14),

      Expanded(
        child: Column(
          crossAxisAlignment:
              CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style:
                  GoogleFonts.plusJakartaSans(
                color: slate400,
                fontSize: 10,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.8,
              ),
            ),

            const SizedBox(height: 5),

            Text(
              value,
              maxLines: 3,
              overflow:
                  TextOverflow.ellipsis,
              style:
                  GoogleFonts.plusJakartaSans(
                color: valueColor ??
                    (isDark
                        ? Colors.white
                        : slate900),
                fontSize: 13,
                fontWeight: FontWeight.w700,
                height: 1.45,
              ),
            ),
          ],
        ),
      ),
    ],
  );
}

String _medicineSearchAddress(
  Map<String, dynamic> pharmacy,
) {
  final String? fullAddress =
      pharmacy['full_address']
          ?.toString()
          .trim();

  if (fullAddress != null &&
      fullAddress.isNotEmpty) {
    return fullAddress;
  }

  final String address = [
    pharmacy['shop_no'] != null
        ? 'Shop ${pharmacy['shop_no']}'
        : null,
    pharmacy['street_no'] != null
        ? 'Street ${pharmacy['street_no']}'
        : null,
    pharmacy['block_no'] != null
        ? 'Block ${pharmacy['block_no']}'
        : null,
    pharmacy['area'],
    pharmacy['city'],
  ]
      .where(
        (value) =>
            value != null &&
            value.toString().trim().isNotEmpty,
      )
      .map(
        (value) => value.toString().trim(),
      )
      .join(', ');

  return address.isEmpty
      ? 'Address not available'
      : address;
}

  Widget _buildEmptyState({
    required Color surface,
    required Color textColor,
    required Color subTextColor,
    required Color borderColor,
  }) {
    return RefreshIndicator(
      color: primaryBlue,
      onRefresh: _loadFavouritePharmacies,
      child: ListView(
        physics:
            const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(
          24,
          30,
          24,
          40,
        ),
        children: [
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 28,
              vertical: 42,
            ),
            decoration: BoxDecoration(
              color: surface,
              borderRadius: BorderRadius.circular(30),
              border: Border.all(color: borderColor),
            ),
            child: Column(
              children: [
                Container(
                  width: 78,
                  height: 78,
                  decoration: BoxDecoration(
                    color: primaryBlue.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.favorite_border_rounded,
                    size: 36,
                    color: primaryBlue,
                  ),
                ),
                const SizedBox(height: 22),
                Text(
                  'No favourite pharmacies',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.plusJakartaSans(
                    color: textColor,
                    fontSize: 19,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 9),
                Text(
                  'Tap the heart icon on a pharmacy to save it here.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.plusJakartaSans(
                    color: subTextColor,
                    fontSize: 14,
                    height: 1.5,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState({
    required Color surface,
    required Color textColor,
    required Color subTextColor,
    required Color borderColor,
  }) {
    return ListView(
      physics:
          const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(
        24,
        30,
        24,
        40,
      ),
      children: [
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: 28,
            vertical: 38,
          ),
          decoration: BoxDecoration(
            color: surface,
            borderRadius: BorderRadius.circular(30),
            border: Border.all(color: borderColor),
          ),
          child: Column(
            children: [
              Container(
                width: 76,
                height: 76,
                decoration: BoxDecoration(
                  color:
                      const Color(0xFFEF4444).withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.error_outline_rounded,
                  size: 36,
                  color: Color(0xFFEF4444),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Could not load favourites',
                textAlign: TextAlign.center,
                style: GoogleFonts.plusJakartaSans(
                  color: textColor,
                  fontSize: 19,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 9),
              Text(
                errorMessage ??
                    'Something went wrong.',
                textAlign: TextAlign.center,
                style: GoogleFonts.plusJakartaSans(
                  color: subTextColor,
                  fontSize: 14,
                  height: 1.5,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: _loadFavouritePharmacies,
                  icon: const Icon(
                    Icons.refresh_rounded,
                  ),
                  label: const Text('Try Again'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryBlue,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius:
                          BorderRadius.circular(17),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Backend data formatting
  // ---------------------------------------------------------------------------

  String _pharmacyName(
    Map<String, dynamic> pharmacy,
  ) {
    final value = pharmacy['pharmacy_name'];

    if (value == null ||
        value.toString().trim().isEmpty) {
      return 'Unnamed Pharmacy';
    }

    return value.toString().trim();
  }

  String _ratingText(
    Map<String, dynamic> pharmacy,
  ) {
    final value = pharmacy['rating'] ??
        pharmacy['average_rating'];

    if (value == null) {
      return 'New';
    }

    final rating = _parseDouble(value);

    if (rating == null) {
      return value.toString();
    }

    return rating.toStringAsFixed(1);
  }

  int? _parseInt(dynamic value) {
    if (value == null) return null;

    if (value is int) return value;

    return int.tryParse(value.toString());
  }

  double? _parseDouble(dynamic value) {
    if (value == null) return null;

    if (value is num) {
      return value.toDouble();
    }

    return double.tryParse(value.toString());
  }

  String _cleanErrorMessage(Object error) {
    return error
        .toString()
        .replaceFirst('Exception: ', '')
        .trim();
  }

  // ---------------------------------------------------------------------------
  // Common widgets
  // ---------------------------------------------------------------------------

  Widget _buildBlurBackground(
    Color primary,
    bool isDark,
  ) {
    return Positioned(
      top: -100,
      right: -50,
      child: Container(
        width: 300,
        height: 300,
        decoration: BoxDecoration(
          color: primary.withOpacity(
            isDark ? 0.08 : 0.12,
          ),
          shape: BoxShape.circle,
        ),
        child: BackdropFilter(
          filter: ImageFilter.blur(
            sigmaX: 80,
            sigmaY: 80,
          ),
          child: const SizedBox(),
        ),
      ),
    );
  }

  Widget _circleBtn(
    IconData icon,
    Color background,
    Color iconColor,
    Color borderColor,
  ) {
    return Container(
      width: 54,
      height: 54,
      decoration: BoxDecoration(
        color: background,
        shape: BoxShape.circle,
        border: Border.all(color: borderColor),
      ),
      child: Icon(
        icon,
        size: 22,
        color: iconColor,
      ),
    );
  }

  void _showMessage(
    String message, {
    bool isError = false,
  }) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(message),
          behavior: SnackBarBehavior.floating,
          backgroundColor: isError
              ? const Color(0xFFDC2626)
              : const Color(0xFF16A34A),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
      );
  }
}
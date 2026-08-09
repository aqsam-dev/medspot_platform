import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:medspot/theme.dart';
import 'package:medspot/services/patient_api.dart';

class PharmacyListScreen extends StatefulWidget {
  final List<Map<String, dynamic>> pharmacies;

  const PharmacyListScreen({super.key, required this.pharmacies});

  @override
  State<PharmacyListScreen> createState() => _PharmacyListScreenState();
}

class _PharmacyListScreenState extends State<PharmacyListScreen> {
  String _sortBy = "none";
  List<Map<String, dynamic>> _allPharmacies = [];
  final Set<int> _processingFavoriteIds = {};

  @override
  void initState() {
    super.initState();

    // Keep the favorite value if the backend already included it.
    _allPharmacies = widget.pharmacies.map((pharmacy) {
      final item = Map<String, dynamic>.from(pharmacy);
      item["isFavorite"] =
          item["is_favorite"] == true || item["isFavorite"] == true;
      return item;
    }).toList();

    _loadFavoriteStatuses();
  }

  int? _toInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    return int.tryParse(value.toString());
  }

num _totalPrice(Map<String, dynamic> pharmacy) {
  final medicines =
      pharmacy["medicines"] as List<dynamic>? ?? [];

  return medicines.fold<num>(0, (sum, item) {
    if (item is! Map) return sum;

    final price =
        num.tryParse(item["price"]?.toString() ?? "0") ??
            0;

    return sum + price;
  });
}

String _formatLastSync(dynamic value) {
  if (value == null || value.toString().trim().isEmpty) {
    return "Not synced yet";
  }

  try {
    final DateTime syncTime =
        DateTime.parse(value.toString()).toLocal();

    final Duration difference =
        DateTime.now().difference(syncTime);

    if (difference.isNegative ||
        difference.inSeconds < 60) {
      return "Just now";
    }

    if (difference.inMinutes < 60) {
      final int minutes = difference.inMinutes;

      return minutes == 1
          ? "1 minute ago"
          : "$minutes minutes ago";
    }

    if (difference.inHours < 24) {
      final int hours = difference.inHours;

      return hours == 1
          ? "1 hour ago"
          : "$hours hours ago";
    }

    if (difference.inDays < 7) {
      final int days = difference.inDays;

      return days == 1
          ? "1 day ago"
          : "$days days ago";
    }

    final String day =
        syncTime.day.toString().padLeft(2, "0");

    final String month =
        syncTime.month.toString().padLeft(2, "0");

    final String year =
        syncTime.year.toString();

    final int hour12 = syncTime.hour == 0
        ? 12
        : syncTime.hour > 12
            ? syncTime.hour - 12
            : syncTime.hour;

    final String minute =
        syncTime.minute.toString().padLeft(2, "0");

    final String period =
        syncTime.hour >= 12 ? "PM" : "AM";

    return "$day/$month/$year, "
        "$hour12:$minute $period";
  } catch (error) {
    debugPrint("Last sync parsing error: $error");
    return "Sync time unavailable";
  }
}

  void _showMessage(String message, {bool success = false}) {
    if (!mounted) return;

    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(message),
          behavior: SnackBarBehavior.floating,
          backgroundColor:
              success ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
        ),
      );
  }

  Future<void> _loadFavoriteStatuses() async {
    for (final pharmacy in _allPharmacies) {
      final pharmacyId = _toInt(pharmacy["pharmacy_id"]);
      if (pharmacyId == null) continue;

      try {
        final isFavorite =
            await PatientApi.isPharmacyFavorite(pharmacyId);

        if (!mounted) return;

        setState(() {
          pharmacy["isFavorite"] = isFavorite;
          pharmacy["is_favorite"] = isFavorite;
        });
      } catch (error) {
        // Keep the value returned by the search API when status loading fails.
        debugPrint(
          "Favorite status error for pharmacy $pharmacyId: $error",
        );
      }
    }
  }

  Future<void> _toggleFavorite(
    Map<String, dynamic> pharmacy,
  ) async {
    final pharmacyId = _toInt(pharmacy["pharmacy_id"]);

    if (pharmacyId == null ||
        _processingFavoriteIds.contains(pharmacyId)) {
      return;
    }

    final wasFavorite = pharmacy["isFavorite"] == true;

    setState(() {
      _processingFavoriteIds.add(pharmacyId);
      pharmacy["isFavorite"] = !wasFavorite;
      pharmacy["is_favorite"] = !wasFavorite;
    });

    try {
      if (wasFavorite) {
        await PatientApi.removeFavoritePharmacy(pharmacyId);

        _showMessage(
          "${pharmacy["pharmacy_name"] ?? "Pharmacy"} removed from favorites.",
        );
      } else {
        await PatientApi.addFavoritePharmacy(pharmacyId);

        _showMessage(
          "${pharmacy["pharmacy_name"] ?? "Pharmacy"} added to favorites.",
          success: true,
        );
      }
    } catch (error) {
      if (!mounted) return;

      setState(() {
        pharmacy["isFavorite"] = wasFavorite;
        pharmacy["is_favorite"] = wasFavorite;
      });

      _showMessage(
        error.toString().replaceFirst("Exception: ", ""),
      );
    } finally {
      if (mounted) {
        setState(() {
          _processingFavoriteIds.remove(pharmacyId);
        });
      }
    }
  }

  void _sortPharmacies(String criteria) {
    setState(() {
      _sortBy = criteria;
      if (criteria == "price") {
        _allPharmacies.sort(
          (a, b) => _totalPrice(a).compareTo(_totalPrice(b)),
        );
      } else if (criteria == "availability") {
        _allPharmacies.sort((a, b) {
          final aValue = num.tryParse(
                (a["availability_percentage"] ?? 0).toString(),
              ) ??
              0;
          final bValue = num.tryParse(
                (b["availability_percentage"] ?? 0).toString(),
              ) ??
              0;

          return bValue.compareTo(aValue);
        });
      } else if (criteria == "distance") {
        _allPharmacies.sort((a, b) {
          final aDistance =
              num.tryParse((a["distance"] ?? 0).toString()) ?? 0;
          final bDistance =
              num.tryParse((b["distance"] ?? 0).toString()) ?? 0;

          return aDistance.compareTo(bDistance);
        });
      }
    });
  }

  void _showFilterOptions(bool isDark) {
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 10),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                "Sort By",
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : Colors.black,
                ),
              ),
              const SizedBox(height: 15),
              _filterTile(Icons.payments_outlined, "Price", "price", isDark),
              _filterTile(
                Icons.inventory_2_outlined,
                "Availability",
                "availability",
                isDark,
              ),
              _filterTile(Icons.map_outlined, "Distance", "distance", isDark),
            ],
          ),
        );
      },
    );
  }

  Widget _filterTile(IconData icon, String title, String value, bool isDark) {
    return ListTile(
      leading: Icon(icon, color: AppColors.primary),
      title: Text(
        title,
        style: GoogleFonts.plusJakartaSans(
          color: isDark ? Colors.white : Colors.black,
        ),
      ),
      trailing: _sortBy == value
          ? const Icon(Icons.check_circle, color: AppColors.primary)
          : null,
      onTap: () {
        _sortPharmacies(value);
        Navigator.pop(context);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    final Color scaffoldBg = isDark
        ? const Color(0xFF0F172A)
        : const Color(0xFFF8FAFC);
    final Color headerColor = isDark ? const Color(0xFF1E293B) : Colors.white;
    final Color cardColor = isDark ? const Color(0xFF1E293B) : Colors.white;

    final filteredPharmacies = _allPharmacies;

    return Scaffold(
      backgroundColor: scaffoldBg,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(isDark, headerColor),
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 20,
                ),
                physics: const BouncingScrollPhysics(),
                itemCount: filteredPharmacies.length,
                separatorBuilder: (context, index) =>
                    const SizedBox(height: 18),
                itemBuilder: (context, index) {
                  final pharmacy = filteredPharmacies[index];

                  final int totalPrice =
                      _totalPrice(pharmacy).round();
                  return _buildPharmacyCard(
                    context,
                    name: pharmacy['pharmacy_name'] ?? '',
                    distance:"${((pharmacy['distance'] ?? 0.0) as num).toStringAsFixed(1)} km away",
                    // Read these values from the medicines array
                    price: totalPrice,
                    availability:"${pharmacy['availability_percentage'] ?? 0}%",
                    availabilityPercentage: ((pharmacy['availability_percentage'] ?? 0) as num).toDouble(),
                    lastUpdated:_formatLastSync(pharmacy['last_updated'] ?? "N/A"),
                    statusColor: Colors.green,
                    isOutOfStock: false,
                    isFavorite: pharmacy["isFavorite"] ?? false,
                    pharmacy: pharmacy,
                    isDark: isDark,
                    cardColor: cardColor,
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(bool isDark, Color bgColor) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(32)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.3 : 0.04),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "MedSpot",
            style: GoogleFonts.plusJakartaSans(
              fontSize: 26,
              fontWeight: FontWeight.w900,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "${_allPharmacies.length} Results Found",
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : Colors.black,
                ),
              ),

              IconButton(
                onPressed: () => _showFilterOptions(isDark),
                icon: const Icon(Icons.tune_rounded, color: AppColors.primary),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPharmacyCard(
    BuildContext context, {
    required String name,
    required String distance,
    required int price,
    required Color statusColor,
    required String availability,
    required double availabilityPercentage,
    required String lastUpdated,
    required bool isDark,
    required Color cardColor,
    required bool isFavorite,
    required Map<String, dynamic> pharmacy,
    bool isOutOfStock = false,
  }) {
    final Color textColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final Color subTextColor = isDark
        ? const Color(0xFF94A3B8)
        : const Color(0xFF64748B);

    final int? pharmacyId = _toInt(pharmacy["pharmacy_id"]);
    final bool isProcessing = pharmacyId != null &&
        _processingFavoriteIds.contains(pharmacyId);

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(
          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.4 : 0.04),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: GoogleFonts.plusJakartaSans(
                        color: textColor,
                        fontSize: 19,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on_rounded,
                          color: AppColors.primary,
                          size: 16,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          distance,
                          style: GoogleFonts.plusJakartaSans(
                            color: subTextColor,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: isProcessing
                    ? null
                    : () => _toggleFavorite(pharmacy),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 220),
                  width: 44,
                  height: 44,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: isFavorite
                        ? const Color(0xFFFEE2E2)
                            .withOpacity(isDark ? 0.15 : 1.0)
                        : Colors.grey.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: isProcessing
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppColors.primary,
                          ),
                        )
                      : Icon(
                          isFavorite
                              ? Icons.favorite_rounded
                              : Icons.favorite_outline_rounded,
                          color: isFavorite
                              ? const Color(0xFFEF4444)
                              : Colors.grey,
                          size: 22,
                        ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          // --- Icon Box Style from Fav Page ---
          _iconDetailRow(
            Icons.payments_rounded,
            "ESTIMATED PRICE",
            "Rs. $price",
            AppColors.primary,
            isDark,
          ),
          const SizedBox(height: 16),
          _availabilityRow(availabilityPercentage, isDark),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.only(left: 56),
            child: Text(
              "Last updated: $lastUpdated",
              style: GoogleFonts.plusJakartaSans(
                color: Colors.grey,
                fontSize: 11,
              ),
            ),
          ),
          const SizedBox(height: 28),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: isOutOfStock
                  ? null
                  : () => Navigator.pushNamed(
                      context,
                      '/pharmacy_detail',
                      arguments: pharmacy,
                    ),
              style: ElevatedButton.styleFrom(
                backgroundColor: isOutOfStock
                    ? Colors.grey.shade300
                    : AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
                elevation: 0,
              ),
              child: Text(
                isOutOfStock ? "UNAVAILABLE" : "Pharmacy Detail",
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 15,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _iconDetailRow(
    IconData icon,
    String title,
    String subtitle,
    Color color,
    bool isDark,
  ) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: color.withOpacity(0.12),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF94A3B8),
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: GoogleFonts.plusJakartaSans(
                  color: isDark ? Colors.white70 : const Color(0xFF475569),
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _availabilityRow(double percentage, bool isDark) {
    final value = (percentage / 100).clamp(0.0, 1.0);

    Color progressColor;

    if (percentage >= 75) {
      progressColor = Colors.green;
    } else if (percentage >= 50) {
      progressColor = Colors.orange;
    } else {
      progressColor = Colors.red;
    }

    return Row(
      children: [
        SizedBox(
          width: 42,
          height: 42,
          child: Stack(
            alignment: Alignment.center,
            children: [
              CircularProgressIndicator(
                value: value,
                strokeWidth: 5,
                backgroundColor: Colors.grey.shade300,
                valueColor: AlwaysStoppedAnimation(progressColor),
              ),
              Text(
                "${percentage.toInt()}%",
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "AVAILABILITY",
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF94A3B8),
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                "${percentage.toInt()}% Available",
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white70 : const Color(0xFF475569),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

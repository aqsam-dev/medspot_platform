import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:medspot/services/patient_api.dart';
import 'package:geolocator/geolocator.dart';
import 'dart:async';
import 'package:shimmer/shimmer.dart';

class MedicineSearchPage extends StatefulWidget {
  const MedicineSearchPage({super.key});

  @override
  State<MedicineSearchPage> createState() => _MedicineSearchPageState();
}

class _MedicineSearchPageState extends State<MedicineSearchPage> {
  bool isSubmitting = false;
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final Map<String, List<String>> _cache = {};
  final LayerLink _layerLink = LayerLink();
  OverlayEntry? _dropdownOverlay;
  Timer? _debounce;
  static const Color primaryColor = Color(0xFF2a4eca);
  static const Color slate950 = Color(0xFF020617);
  static const Color slate900 = Color(0xFF0f172a);
  static const Color slate800 = Color(0xFF1e293b);
  static const Color slate500 = Color(0xFF64748b);
  static const Color slate400 = Color(0xFF94a3b8);
  static const Color slate200 = Color(0xFFe2e8f0);

  String selectedMode = "ALL";
  String searchQuery = "";
  List<String> selectedMedicines = [];
  List<String> suggestions = [];
  double? userLat;
  double? userLng;
  bool isSearching = false;
  bool showSuggestions = false;
  String? _topMessage;
  bool _isSuccess = false;
  bool isLocationLoading = true;
  List nearbyPharmacies = [];
  bool isLoading = true;
  final Set<int> _favoritePharmacyIds = {};
  final Set<int> _processingFavoriteIds = {};

  @override
  void dispose() {
    _hideDropdown();
    _debounce?.cancel();
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _hideDropdown() {
    if (_dropdownOverlay != null) {
      _dropdownOverlay!.remove();
      _dropdownOverlay = null;
    }
  }

  void _showNotification(String message, {bool success = false}) {
    setState(() {
      _topMessage = message;
      _isSuccess = success;
    });

    // Auto-dismiss notification after 4 seconds
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted && _topMessage == message) {
        setState(() {
          _topMessage = null;
        });
      }
    });
  }

  Future<void> loadNearbyPharmacies() async {
    try {
      if (userLat == null || userLng == null) return;

      if (mounted) {
        setState(() => isLoading = true);
      }

      final data = await PatientApi.getNearbyPharmacies(
        latitude: userLat!,
        longitude: userLng!,
      );

      final List<Map<String, dynamic>> pharmacies = data
          .map<Map<String, dynamic>>(
            (item) => Map<String, dynamic>.from(item),
          )
          .toList();

      final favoriteChecks = await Future.wait(
        pharmacies.map((pharmacy) async {
          final int? pharmacyId = _toInt(pharmacy["pharmacy_id"]);

          if (pharmacyId == null) {
            return <String, dynamic>{
              ...pharmacy,
              "is_favorite": false,
            };
          }

          try {
            final isFavorite =
                await PatientApi.isPharmacyFavorite(pharmacyId);

            return <String, dynamic>{
              ...pharmacy,
              "is_favorite": isFavorite,
            };
          } catch (_) {
            return <String, dynamic>{
              ...pharmacy,
              "is_favorite": false,
            };
          }
        }),
      );

      if (!mounted) return;

      setState(() {
        nearbyPharmacies = favoriteChecks;

        _favoritePharmacyIds
          ..clear()
          ..addAll(
            favoriteChecks
                .where((pharmacy) => pharmacy["is_favorite"] == true)
                .map((pharmacy) => _toInt(pharmacy["pharmacy_id"]))
                .whereType<int>(),
          );

        isLoading = false;
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        isLoading = false;
      });

      debugPrint("Nearby Pharmacies Error: $error");
    }
  }

  // Logic to add medicine as a tag
  void selectMedicine(String name) {
    if (!selectedMedicines.contains(name)) {
      setState(() {
        selectedMedicines.add(name);

        _searchController.clear();
        searchQuery = "";

        suggestions.clear();
        showSuggestions = false;
      });
      _showNotification("$name added to your selection", success: true);
    }
  }

  void _showModeDropdown(bool isDark) {
    _dropdownOverlay?.remove();

    _dropdownOverlay = OverlayEntry(
      builder: (context) => Positioned(
        width: MediaQuery.of(context).size.width - 48,
        child: CompositedTransformFollower(
          link: _layerLink,
          offset: const Offset(0, 70),
          child: Material(
            color: Colors.transparent,
            child: Container(
              decoration: BoxDecoration(
                color: isDark ? slate800 : Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    blurRadius: 20,
                    color: Colors.black.withOpacity(.08),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _dropdownItem("ALL", isDark),
                  _dropdownItem("PHARMACIES", isDark),
                ],
              ),
            ),
          ),
        ),
      ),
    );

    Overlay.of(context).insert(_dropdownOverlay!);
  }

  Future<void> _getCurrentLocation() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();

      if (!serviceEnabled) {
        setState(() {
          isLocationLoading = false;
        });

        _showNotification("Please enable location services.");
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();

      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.denied) {
        setState(() {
          isLocationLoading = false;
        });

        _showNotification("Location permission denied.");
        return;
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          isLocationLoading = false;
        });

        _showNotification(
          "Location permission permanently denied. Please enable it from Settings.",
        );
        return;
      }

      final Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      setState(() {
        userLat = position.latitude;
        userLng = position.longitude;
        isLocationLoading = false;
      });
      await loadNearbyPharmacies();
    } catch (e) {
      setState(() {
        isLocationLoading = false;
      });

      _showNotification("Failed to get your location.");
      debugPrint("Location Error: $e");
    }
  }

  // Logic to remove a medicine from the selection
  void removeMedicine(String name) {
    setState(() {
      selectedMedicines.remove(name);
    });
    _showNotification("$name removed", success: false);
  }

 Future<void> searchMedicine(String keyword) async {
  final String cleanKeyword = keyword.trim();
  final String cacheKey = cleanKeyword.toLowerCase();

  if (userLat == null || userLng == null) return;

  if (cleanKeyword.isEmpty) {
    if (!mounted) return;

    setState(() {
      suggestions = [];
      isSearching = false;
      showSuggestions = false;
    });

    return;
  }

  if (_cache.containsKey(cacheKey)) {
    if (!mounted) return;

    setState(() {
      suggestions = _cache[cacheKey]!;
      showSuggestions = true;
      isSearching = false;
    });

    return;
  }

  setState(() {
    isSearching = true;
    showSuggestions = true;
  });

  try {
    final result = await PatientApi.searchMedicines(
      keyword: cleanKeyword,
      latitude: userLat!,
      longitude: userLng!,
    );

    if (_searchController.text.trim() != cleanKeyword) return;
    _cache[cacheKey] = result;
    if (!mounted) return;
    setState(() {
      suggestions = result;
    });
  } catch (error) {
    if (!mounted) return;
    setState(() {
      suggestions = [];
    });
    debugPrint("Medicine Suggestions Error: $error");
  } finally {
    if (mounted &&
        _searchController.text.trim() == cleanKeyword) {
      setState(() {
        isSearching = false;
      });
    }
  }
}

  Future<void> submitSearch() async {
    if (isSubmitting) return;

    setState(() {
      isSubmitting = true;
    });
    if (selectedMedicines.isEmpty) {
      setState(() {
        isSubmitting = false;
      });

      _showNotification("Please select at least one medicine.");
      return;
    }

    if (userLat == null || userLng == null) {
      setState(() {
        isSubmitting = false;
      });

      _showNotification("Location unavailable.");
      return;
    }

    try {
      final result = await PatientApi.search(
        mode: selectedMode,
        medicines: selectedMedicines,
        latitude: userLat!,
        longitude: userLng!,
      );

      await Navigator.pushNamed(context, "/result", arguments: result);

      if (mounted) {
        setState(() {
          isSubmitting = false;
        });
      }
    } catch (e) {
      setState(() {
        isSubmitting = false;
      });

      _showNotification(e.toString());
    }
  }

  Widget _modeOption(String title, IconData icon, bool isDark) {
    return ListTile(
      leading: Icon(icon, color: primaryColor),
      title: Text(
        title,
        style: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.w700,
          color: isDark ? Colors.white : slate900,
        ),
      ),
      onTap: () {
        setState(() => selectedMode = title);
        Navigator.pop(context);
        _showNotification("Switched to $title view", success: true);
      },
    );
  }

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
  }

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;

    if (isLocationLoading) {
      return Scaffold(
        backgroundColor: isDark ? slate950 : const Color(0xFFF8FAFC),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Shimmer.fromColors(
              baseColor: isDark ? Colors.grey.shade800 : Colors.grey.shade300,
              highlightColor: isDark
                  ? Colors.grey.shade700
                  : Colors.grey.shade100,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  Row(
                    children: [
                      Container(
                        width: 46,
                        height: 46,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Container(
                        width: 180,
                        height: 24,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 40),

                  // Search Bar
                  Container(
                    height: 62,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Dropdown
                  Container(
                    height: 62,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Fake suggestion cards
                  ...List.generate(
                    3,
                    (_) => Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: Container(
                        height: 58,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }
    return Scaffold(
      backgroundColor: isDark ? slate950 : const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                _buildHeader(isDark),
                Expanded(
                  child: ListView(
                    controller: _scrollController,
                    padding: const EdgeInsets.fromLTRB(24, 8, 24, 30),
                    physics: const BouncingScrollPhysics(),
                    children: [
                      if (selectedMedicines.isNotEmpty) _buildTagsArea(isDark),

                      _buildSearchBar(isDark),
                      const SizedBox(height: 20),
                      _buildModeSelector(isDark),

                      if (selectedMode == "PHARMACIES") ...[
                        const SizedBox(height: 28),
                        Row(
                          children: [
                            const Icon(
                              Icons.location_on_rounded,
                              color: primaryColor,
                              size: 21,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              "Nearby Pharmacies",
                              style: GoogleFonts.plusJakartaSans(
                                color: isDark ? Colors.white : slate900,
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        _buildNearbyPharmacies(isDark),
                      ],

                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ],
            ),
            // Integrated Premium Notification Toast (Same as Login Page)
            if (_topMessage != null)
              Positioned(
                top: 10,
                left: 20,
                right: 20,
                child: Dismissible(
                  key: UniqueKey(),
                  onDismissed: (_) => setState(() => _topMessage = null),
                  child: _buildTopNotification(isDark),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopNotification(bool isDark) {
    final notifyBgColor = isDark
        ? (_isSuccess
              ? Colors.green.withOpacity(0.2)
              : Colors.red.withOpacity(0.2))
        : (_isSuccess ? const Color(0xFFF0FDF4) : const Color(0xFFFEF2F2));

    final notifyTextColor = _isSuccess ? Colors.green : Colors.red;
    final notifyIcon = _isSuccess
        ? Icons.check_circle_outline
        : Icons.error_outline;

    return Material(
      color: Colors.transparent,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: notifyBgColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: notifyTextColor.withOpacity(0.3)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 15,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Row(
          children: [
            Icon(notifyIcon, color: notifyTextColor, size: 22),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                _topMessage!,
                style: GoogleFonts.manrope(
                  color: isDark ? Colors.white : slate900,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ),
            GestureDetector(
              onTap: () => setState(() => _topMessage = null),
              child: Icon(
                Icons.close,
                color: notifyTextColor.withOpacity(0.5),
                size: 18,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTagsArea(bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionTitle("SELECTED MEDICINES"),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: selectedMedicines
                .map(
                  (med) => Chip(
                    label: Text(
                      med,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: primaryColor,
                      ),
                    ),
                    backgroundColor: primaryColor.withOpacity(0.1),
                    deleteIcon: const Icon(
                      Icons.close_rounded,
                      size: 14,
                      color: primaryColor,
                    ),
                    onDeleted: () => removeMedicine(med),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    side: BorderSide(color: primaryColor.withOpacity(0.2)),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }

 Widget _buildSearchBar(bool isDark) {
  final Color surfaceColor =
      isDark ? slate800 : Colors.white;

  final Color borderColor =
      isDark ? Colors.white10 : const Color(0xFFF1F5F9);

  return Container(
    clipBehavior: Clip.antiAlias,
    decoration: BoxDecoration(
      color: surfaceColor,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: borderColor),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withOpacity(isDark ? 0.2 : 0.04),
          blurRadius: 20,
          offset: const Offset(0, 8),
        ),
      ],
    ),
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        TextField(
          controller: _searchController,
          textAlignVertical: TextAlignVertical.center,
          onTap: () {
            if (_searchController.text.trim().isNotEmpty) {
              setState(() => showSuggestions = true);
            }
          },
          onChanged: (value) {
            if (value.contains(",")) {
              final parts = value.split(",");

              for (int i = 0; i < parts.length - 1; i++) {
                final medicine = parts[i].trim();

                if (medicine.isNotEmpty &&
                    !selectedMedicines.contains(medicine)) {
                  selectedMedicines.add(medicine);
                }
              }

              final remaining = parts.last.trim();

              setState(() {
                _searchController.text = remaining;
                _searchController.selection =
                    TextSelection.collapsed(
                  offset: remaining.length,
                );

                searchQuery = remaining;
                showSuggestions = remaining.isNotEmpty;
              });

              if (remaining.isNotEmpty) {
                searchMedicine(remaining);
              }

              return;
            }

            setState(() {
              searchQuery = value.trim();
              showSuggestions = value.trim().isNotEmpty;
            });

            _debounce?.cancel();

            _debounce = Timer(
              const Duration(milliseconds: 400),
              () => searchMedicine(value),
            );
          },
          onSubmitted: (value) {
            if (suggestions.isNotEmpty) {
              selectMedicine(suggestions.first);
            }
          },
          style: TextStyle(
            color: isDark ? Colors.white : slate900,
          ),
          decoration: InputDecoration(
            isDense: true,
            contentPadding:
                const EdgeInsets.symmetric(vertical: 18),
            hintText: "Use Comma to Create Tags",
            hintStyle: TextStyle(
              color: slate500.withOpacity(0.65),
            ),
            prefixIcon: const Icon(
              Icons.search_rounded,
              color: primaryColor,
            ),
            suffixIcon: _buildSearchSuffixIcon(),
            border: InputBorder.none,
          ),
        ),

        if (showSuggestions) ...[
          Divider(
            height: 1,
            thickness: 1,
            color: borderColor,
          ),
          _buildSuggestionsDropdown(isDark),
        ],
      ],
    ),
  );
}

Widget _buildSearchSuffixIcon() {

  if (isSearching) {
    return const Padding(
      padding: EdgeInsets.all(15),
      child: SizedBox(
        width: 19,
        height: 19,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          color: primaryColor,
        ),
      ),
    );
  }

  if (isSubmitting) {
    return const Padding(
      padding: EdgeInsets.all(15),
      child: SizedBox(
        width: 19,
        height: 19,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          color: primaryColor,
        ),
      ),
    );
  }

  if (_searchController.text.isNotEmpty) {
    return IconButton(
      onPressed: () {
        _debounce?.cancel();
        _searchController.clear();

        setState(() {
          searchQuery = "";
          suggestions.clear();
          showSuggestions = false;
        });
      },
      icon: const Icon(
        Icons.close_rounded,
        color: slate400,
      ),
    );
  }

  return IconButton(
    onPressed: selectedMedicines.isEmpty || isSubmitting
        ? null
        : submitSearch,
    icon: Icon(
      Icons.send_rounded,
      color: selectedMedicines.isEmpty
          ? Colors.grey
          : primaryColor,
    ),
  );
}



Widget _buildSuggestionsDropdown(bool isDark) {
  if (isSearching) {
    return const SizedBox(
      height: 72,
      child: Center(
        child: CircularProgressIndicator(
          strokeWidth: 2.2,
          color: primaryColor,
        ),
      ),
    );
  }

  if (searchQuery.isNotEmpty && suggestions.isEmpty) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: 18,
        vertical: 20,
      ),
      child: Row(
        children: [
          const Icon(
            Icons.search_off_rounded,
            color: slate400,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              "No matching medicines found.",
              style: GoogleFonts.plusJakartaSans(
                color: slate500,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  return ConstrainedBox(
    constraints: const BoxConstraints(
      maxHeight: 260,
    ),
    child: ListView.separated(
      shrinkWrap: true,
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: suggestions.length,
      separatorBuilder: (_, __) => Divider(
        height: 1,
        indent: 54,
        color: isDark
            ? Colors.white10
            : const Color(0xFFF1F5F9),
      ),
      itemBuilder: (context, index) {
        final String medicine = suggestions[index];

        return InkWell(
          onTap: () => selectMedicine(medicine),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 13,
            ),
            child: Row(
              children: [
                Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.medication_rounded,
                    size: 18,
                    color: primaryColor,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    medicine,
                    style: GoogleFonts.plusJakartaSans(
                      color: isDark
                          ? Colors.white
                          : slate900,
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                    ),
                  ),
                ),
                const Icon(
                  Icons.add_circle_outline_rounded,
                  color: primaryColor,
                  size: 20,
                ),
              ],
            ),
          ),
        );
      },
    ),
  );
}



  String _modeLabel(String mode) {
    switch (mode) {
      case "PHARMACIES":
        return "Show Nearby Pharmacies";
      case "ALL":
      default:
        return "Search Medicine Availability";
    }
  }

  int? _toInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    return int.tryParse(value.toString());
  }

  double? _toDouble(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString());
  }

  Future<void> _toggleNearbyFavorite(
    Map<String, dynamic> pharmacy,
  ) async {
    final int? pharmacyId = _toInt(pharmacy["pharmacy_id"]);

    if (pharmacyId == null ||
        _processingFavoriteIds.contains(pharmacyId)) {
      return;
    }

    final bool wasFavorite =
        _favoritePharmacyIds.contains(pharmacyId);

    setState(() {
      _processingFavoriteIds.add(pharmacyId);

      if (wasFavorite) {
        _favoritePharmacyIds.remove(pharmacyId);
      } else {
        _favoritePharmacyIds.add(pharmacyId);
      }

      pharmacy["is_favorite"] = !wasFavorite;
    });

    try {
      if (wasFavorite) {
        await PatientApi.removeFavoritePharmacy(pharmacyId);
        _showNotification(
          "${pharmacy["pharmacy_name"] ?? "Pharmacy"} removed from favourites.",
        );
      } else {
        await PatientApi.addFavoritePharmacy(pharmacyId);
        _showNotification(
          "${pharmacy["pharmacy_name"] ?? "Pharmacy"} added to favourites.",
          success: true,
        );
      }
    } catch (error) {
      if (!mounted) return;

      setState(() {
        if (wasFavorite) {
          _favoritePharmacyIds.add(pharmacyId);
        } else {
          _favoritePharmacyIds.remove(pharmacyId);
        }

        pharmacy["is_favorite"] = wasFavorite;
      });

      _showNotification(
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

  Widget _buildModeSelector(bool isDark) {
    return CompositedTransformTarget(
      link: _layerLink,
      child: GestureDetector(
        onTap: () => _showModeDropdown(isDark),
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: _boxDecoration(isDark),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: primaryColor.withOpacity(.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  selectedMode == "PHARMACIES"
                      ? Icons.local_pharmacy_rounded
                      : Icons.medication_rounded,
                  color: primaryColor,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  _modeLabel(selectedMode),
                  style: GoogleFonts.plusJakartaSans(
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                    color: isDark ? Colors.white : slate900,
                  ),
                ),
              ),
              const Icon(Icons.keyboard_arrow_down_rounded),
            ],
          ),
        ),
      ),
    );
  }

  Widget _dropdownItem(String value, bool isDark) {
    return InkWell(
      onTap: () {
        setState(() => selectedMode = value);
        _hideDropdown();
      },
      child: Container(
        height: 58,
        padding: const EdgeInsets.symmetric(horizontal: 18),
        alignment: Alignment.centerLeft,
        child: Row(
          children: [
            Icon(
              value == "PHARMACIES"
                  ? Icons.local_pharmacy_rounded
                  : Icons.medication_rounded,
              color: primaryColor,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                _modeLabel(value),
                style: GoogleFonts.plusJakartaSans(
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white : slate900,
                ),
              ),
            ),
            if (selectedMode == value)
              const Icon(
                Icons.check_circle,
                color: primaryColor,
                size: 18,
              ),
          ],
        ),
      ),
    );
  }

  

  Widget _buildHeader(bool isDark) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Row(
        children: [
          _iconButton(
            Icons.arrow_back_ios_new_rounded,
            isDark,
            () => Navigator.pop(context),
          ),
          const SizedBox(width: 20),
          Text(
            "Search Center",
            style: GoogleFonts.plusJakartaSans(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: isDark ? Colors.white : slate900,
            ),
          ),
        ],
      ),
    );
  }

  Widget _iconButton(IconData icon, bool isDark, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isDark ? slate800 : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
          ),
        ),
        child: Icon(icon, color: isDark ? Colors.white : slate900, size: 20),
      ),
    );
  }

  

  Widget _buildNearbyPharmacies(bool isDark) {
    if (isLoading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 32),
        child: Center(
          child: CircularProgressIndicator(
            color: primaryColor,
          ),
        ),
      );
    }

    if (nearbyPharmacies.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(28),
        decoration: _boxDecoration(isDark),
        child: Column(
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: primaryColor.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.local_pharmacy_outlined,
                color: primaryColor,
                size: 30,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              "No nearby pharmacies found",
              style: GoogleFonts.plusJakartaSans(
                color: isDark ? Colors.white : slate900,
                fontWeight: FontWeight.w800,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              "No registered pharmacy is currently available near your location.",
              textAlign: TextAlign.center,
              style: GoogleFonts.plusJakartaSans(
                color: slate500,
                fontSize: 13,
                height: 1.5,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: nearbyPharmacies.length,
      itemBuilder: (context, index) {
        final pharmacy = Map<String, dynamic>.from(
          nearbyPharmacies[index],
        );

        return _buildNearbyPharmacyCard(pharmacy, isDark);
      },
    );
  }

Widget _buildNearbyPharmacyCard(
  Map<String, dynamic> pharmacy,
  bool isDark,
) {
  final int? pharmacyId = _toInt(
    pharmacy["pharmacy_id"],
  );

  final bool isFavorite =
      pharmacyId != null &&
      _favoritePharmacyIds.contains(pharmacyId);

  final bool isProcessing =
      pharmacyId != null &&
      _processingFavoriteIds.contains(pharmacyId);

  final double? distance = _toDouble(
    pharmacy["distance"] ?? pharmacy["distance_km"],
  );

  final bool isOpen = pharmacy["is_open"] == true;

  final String todayHours =
      pharmacy["today_hours"]?.toString().trim() ?? "";

  final String address = [
    pharmacy["shop_no"] != null
        ? "Shop ${pharmacy["shop_no"]}"
        : null,
    pharmacy["street_no"] != null
        ? "Street ${pharmacy["street_no"]}"
        : null,
    pharmacy["block_no"] != null
        ? "Block ${pharmacy["block_no"]}"
        : null,
    pharmacy["area"],
    pharmacy["city"],
  ]
      .where(
        (value) =>
            value != null &&
            value.toString().trim().isNotEmpty,
      )
      .map((value) => value.toString().trim())
      .join(", ");

  final Color surface =
      isDark ? slate900 : Colors.white;

  final Color textColor =
      isDark ? Colors.white : slate900;

  final Color borderColor =
      isDark
          ? slate800
          : const Color(0xFFF1F5F9);

  final Color statusColor =
      isOpen
          ? const Color(0xFF16A34A)
          : const Color(0xFFEF4444);

  String timingText;

  if (todayHours.isEmpty ||
      todayHours.toLowerCase() == "closed") {
    timingText = isOpen
        ? "Open today"
        : "Closed today";
  } else {
    timingText = isOpen
        ? "Open today • $todayHours"
        : "Closed today • $todayHours";
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
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(
                Icons.local_pharmacy_rounded,
                color: primaryColor,
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
                    pharmacy["pharmacy_name"]
                            ?.toString() ??
                        "Unnamed Pharmacy",
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style:
                        GoogleFonts.plusJakartaSans(
                      color: textColor,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
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
                              const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: primaryColor
                                .withOpacity(0.09),
                            borderRadius:
                                BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize:
                                MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.near_me_rounded,
                                color: primaryColor,
                                size: 15,
                              ),
                              const SizedBox(width: 5),
                              Text(
                                "${distance.toStringAsFixed(1)} km away",
                                style: GoogleFonts
                                    .plusJakartaSans(
                                  color: primaryColor,
                                  fontSize: 12,
                                  fontWeight:
                                      FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                        ),

                      Container(
                        padding:
                            const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color:
                              statusColor.withOpacity(0.1),
                          borderRadius:
                              BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize:
                              MainAxisSize.min,
                          children: [
                            Container(
                              width: 7,
                              height: 7,
                              decoration: BoxDecoration(
                                color: statusColor,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              isOpen ? "OPEN" : "CLOSED",
                              style: GoogleFonts
                                  .plusJakartaSans(
                                color: statusColor,
                                fontSize: 11,
                                fontWeight:
                                    FontWeight.w800,
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
                  : () =>
                      _toggleNearbyFavorite(pharmacy),
              child: AnimatedContainer(
                duration:
                    const Duration(milliseconds: 220),
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: isFavorite
                      ? const Color(0xFFFEE2E2)
                          .withOpacity(
                            isDark ? 0.15 : 1,
                          )
                      : primaryColor.withOpacity(0.08),
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: isProcessing
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child:
                            CircularProgressIndicator(
                          strokeWidth: 2,
                          color: primaryColor,
                        ),
                      )
                    : Icon(
                        isFavorite
                            ? Icons.favorite_rounded
                            : Icons
                                .favorite_border_rounded,
                        color: isFavorite
                            ? const Color(0xFFEF4444)
                            : slate400,
                        size: 22,
                      ),
              ),
            ),
          ],
        ),

        const SizedBox(height: 22),

        _nearbyDetailRow(
          Icons.location_on_rounded,
          "ADDRESS",
          address.isEmpty
              ? "Address not available"
              : address,
          isDark,
        ),

        const SizedBox(height: 16),

        _nearbyDetailRow(
          isOpen
              ? Icons.access_time_filled_rounded
              : Icons.schedule_rounded,
          "TODAY'S HOURS",
          timingText,
          isDark,
          valueColor: statusColor,
        ),
      ],
    ),
  );
}

Widget _nearbyDetailRow(
  IconData icon,
  String title,
  String value,
  bool isDark, {
  Color? valueColor,
}) {
  return Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: primaryColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Icon(
          icon,
          color: primaryColor,
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
              style: GoogleFonts.plusJakartaSans(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                color: slate400,
                letterSpacing: 1.1,
              ),
            ),

            const SizedBox(height: 4),

            Text(
              value,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.plusJakartaSans(
                color: valueColor ??
                    (isDark
                        ? Colors.white70
                        : const Color(0xFF475569)),
                fontSize: 14,
                fontWeight: valueColor != null
                    ? FontWeight.w800
                    : FontWeight.w600,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    ],
  );
}

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.plusJakartaSans(
        fontWeight: FontWeight.w800,
        letterSpacing: 1.2,
        color: slate500,
        fontSize: 11,
      ),
    );
  }

  BoxDecoration _boxDecoration(bool isDark) {
    return BoxDecoration(
      color: isDark ? slate800 : Colors.white,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(
        color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
      ),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withOpacity(isDark ? 0.2 : 0.03),
          blurRadius: 20,
          offset: const Offset(0, 8),
        ),
      ],
    );
  }
}

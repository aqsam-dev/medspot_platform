import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/patient_api.dart';
import 'package:google_fonts/google_fonts.dart';

class PharmacyReviewScreen extends StatefulWidget {
  final int? pharmacyId;
  final String? pharmacyName;
  final int? reservationId;

  const PharmacyReviewScreen({super.key, this.pharmacyId , this.pharmacyName,this.reservationId,});

  @override
  State<PharmacyReviewScreen> createState() => _PharmacyReviewScreenState();
}

class _PharmacyReviewScreenState extends State<PharmacyReviewScreen> {
  // ✅ Note: Manual isDarkMode hatakar system settings use ki hain build method mein
  int rating = 0;
  final TextEditingController reviewController = TextEditingController();
  final TextEditingController searchController = TextEditingController();

  List<dynamic> pharmacies = [];
  List<dynamic> filteredPharmacies = [];

  int? selectedPharmacyId;
  String? selectedPharmacyName;
  bool get hasPreselectedPharmacy => widget.pharmacyId != null;

  final List<String> chips = [
    "Fast Service",
    "Friendly Staff",
    "Clean Store",
    "Easy Pickup",
    "Great Advice",
  ];

  String selectedChip = "Fast Service";

  @override
  Widget build(BuildContext context) {

    final bool isDarkMode = Theme.of(context).brightness == Brightness.dark;    // Dynamic Palette
    const Color primaryColor = Color(0xFF2A4ECA);
    final Color bgColor = isDarkMode
        ? const Color(0xFF020617)
        : const Color(0xFFF8FAFC);
    final Color textColor = isDarkMode ? Colors.white : const Color(0xFF0F172A);
    final Color subTextColor = isDarkMode
        ? const Color(0xFF94A3B8)
        : const Color(0xFF64748B);
    final Color cardColor = isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color borderColor = isDarkMode
        ? const Color(0xFF334155)
        : const Color(0xFFE2E8F0);

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Column(
          children: [
            _buildTopBar(isDarkMode),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [


  if (hasPreselectedPharmacy)
    _buildPharmacyCard(
      cardColor,
      textColor,
      subTextColor,
      borderColor,
      primaryColor,
    )
  else
    _buildSearchSection(
      isDarkMode,
      cardColor,
      borderColor,
      textColor,
      subTextColor,
      primaryColor,
    ),
                  const SizedBox(height: 20),
                  _buildRatingSection(cardColor, textColor, primaryColor),
                  const SizedBox(height: 20),
                  _buildQuickFeedbackSection(
                    cardColor,
                    textColor,
                    borderColor,
                    primaryColor,
                    isDarkMode,
                  ),
                  const SizedBox(height: 20),
                  _buildReviewSection(
                    cardColor,
                    textColor,
                    subTextColor,
                    borderColor,
                    primaryColor,
                    isDarkMode,
                  ),
                  const SizedBox(height: 30),
                  _buildSubmitButton(primaryColor),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchSection(
    bool dark,
    Color card,
    Color border,
    Color text,
    Color sub,
    Color primary,
  ) {
    return Column(
      children: [
        _buildSearchBar(dark),
        const SizedBox(height: 15),
        if (selectedPharmacyId != null)
          _buildPharmacyCard(card, text, sub, border, primary),
      ],
    );
  }

  Widget _buildHeader(Color primaryColor, bool isDarkMode) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.only(top: 60, bottom: 80),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            primaryColor,
            isDarkMode ? const Color(0xFF1E1B4B) : const Color(0xFF1E3A8A),
          ],
        ),
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(56)),
      ),
      child: Column(
        children: [
          _buildSearchBar(isDarkMode),
          const SizedBox(height: 20),
          if (selectedPharmacyName != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 15),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                "Selected Pharmacy: $selectedPharmacyName",
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          const SizedBox(height: 30),
          Text(
            "Rate & Review",
            style: GoogleFonts.plusJakartaSans(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.w900,
              letterSpacing: -1,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "Your feedback makes MedSpot better",
            style: GoogleFonts.plusJakartaSans(
              color: Colors.white.withOpacity(0.8),
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildTopBar(bool dark) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              height: 45,
              width: 45,
              decoration: BoxDecoration(
                color: dark ? const Color(0xff1E293B) : Colors.white,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.arrow_back_ios_new),
            ),
          ),

          const SizedBox(width: 15),

          Text(
            "Rate Pharmacy",
            style: GoogleFonts.manrope(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPharmacyCard(
    Color card,
    Color text,
    Color sub,
    Color border,
    Color primary,
    
  ) {
        final pharmacyName = hasPreselectedPharmacy
        ? widget.pharmacyName
        : selectedPharmacyName;
        
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: card,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: border),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 32,
            backgroundColor: primary,
            child: const Icon(Icons.local_pharmacy, color: Colors.white),
          ),
          const SizedBox(width: 18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                 pharmacyName ?? "",
                  style: GoogleFonts.manrope(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  "Leave your honest experience",
                  style: GoogleFonts.manrope(color: sub),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRatingSection(Color card, Color text, Color primary) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: card,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        children: [
          Text(
            "Overall Rating",
            style: GoogleFonts.manrope(
              fontWeight: FontWeight.bold,
              fontSize: 20,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (i) {
              return GestureDetector(
                onTap: () {
                  setState(() {
                    rating = i + 1;
                  });
                },
                child: AnimatedScale(
                  duration: const Duration(milliseconds: 250),
                  scale: rating == i + 1 ? 1.2 : 1,
                  child: Icon(
                    i < rating ? Icons.star_rounded : Icons.star_border_rounded,
                    size: 48,
                    color: Colors.amber,
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickFeedbackSection(
    Color card,
    Color text,
    Color border,
    Color primary,
    bool dark,
  ) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: card,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Quick Feedback",
            style: GoogleFonts.manrope(
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 15),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: chips.map((e) {
              return _buildChip(e, primary, border, dark);
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewSection(
    Color card,
    Color text,
    Color sub,
    Color border,
    Color primary,
    bool dark,
  ) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: card,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Write Review",
            style: GoogleFonts.manrope(
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 15),
          TextField(
            controller: reviewController,
            maxLines: 6,
            decoration: InputDecoration(
              hintText: "Tell us about your experience...",
              filled: true,
              fillColor: dark ? const Color(0xff0F172A) : Colors.grey.shade100,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(18),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar(bool isDarkMode) {
    return Column(
      children: [
        TextField(
          controller: searchController,
          decoration: InputDecoration(
            hintText: "Search Pharmacy",
            prefixIcon: const Icon(Icons.search),
            filled: true,
            fillColor: isDarkMode ? const Color(0xFF1E293B) : Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
          ),
          onChanged: (value) async {
            if (value.isEmpty) {
              setState(() {
                filteredPharmacies = [];
              });
              return;
            }

            filteredPharmacies = await PatientApi.searchPharmacies(value);

            setState(() {});
          },
        ),

        const SizedBox(height: 12),

        if (searchController.text.isNotEmpty)
          Container(
            constraints: const BoxConstraints(maxHeight: 220),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(15),
            ),

            child: ListView.builder(
              shrinkWrap: true,
              itemCount: filteredPharmacies.length,
              itemBuilder: (context, index) {
                final pharmacy = filteredPharmacies[index];

                return ListTile(
                  leading: const Icon(Icons.local_pharmacy),

                  title: Text(pharmacy["pharmacy_name"]),

                  onTap: () {
                    setState(() {
                      selectedPharmacyId = pharmacy["pharmacy_id"];
                      selectedPharmacyName = pharmacy["pharmacy_name"];
                      searchController.text = pharmacy["pharmacy_name"];
                     filteredPharmacies.clear();
                    });
                    FocusScope.of(context).unfocus();
                  },
                );
              },
            ),
          ),
      ],
    );
  }

  Widget _buildChip(
    String label,
    Color primary,
    Color borderCol,
    bool isDarkMode,
  ) {
    final isSelected = selectedChip == label;
    return GestureDetector(
      onTap: () => setState(() => selectedChip = label),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? primary
              : (isDarkMode ? const Color(0xFF334155) : Colors.white),
          borderRadius: BorderRadius.circular(50),
          border: Border.all(
            color: isSelected ? primary : borderCol,
            width: 1.5,
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.plusJakartaSans(
            color: isSelected
                ? Colors.white
                : (isDarkMode ? Colors.white70 : Colors.black87),
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  Future<void> submitReview() async {
    try {
      if (reviewController.text.trim().isEmpty) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text("Please write a review")));
        return;
      }
      if (rating == 0) {
  ScaffoldMessenger.of(context).showSnackBar(
    const SnackBar(
      content: Text("Please select a rating."),
    ),
  );
  return;
}

      if (selectedPharmacyId == null && widget.pharmacyId == null) {
  ScaffoldMessenger.of(context).showSnackBar(
    const SnackBar(
      content: Text("Please select a pharmacy first."),
    ),
  );
  return;
}

      final int pharmacyId = selectedPharmacyId ?? widget.pharmacyId!;

      await PatientApi.submitReview(
        reservationId: widget.reservationId,
        pharmacyId: pharmacyId,
        rating: rating,
        review: reviewController.text.trim(),
      );

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Review submitted successfully")),
      );

      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  Widget _buildSubmitButton(Color primary) {
    return SizedBox(
      height: 60,

      width: double.infinity,

      child: ElevatedButton.icon(
        icon: const Icon(Icons.send),

        label: Text(
          "Submit Review",

          style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.bold),
        ),

        style: ElevatedButton.styleFrom(
          backgroundColor: primary,

          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
        ),

        onPressed: submitReview,
      ),
    );
  }
}

class _BackgroundDoodles extends StatelessWidget {
  final bool isDarkMode;
  final Color primaryColor;
  const _BackgroundDoodles({
    required this.isDarkMode,
    required this.primaryColor,
  });

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: isDarkMode ? 0.05 : 0.08,
      child: GridView.builder(
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 4,
        ),
        itemBuilder: (_, index) => Icon(
          index.isEven ? Icons.favorite_rounded : Icons.local_pharmacy_rounded,
          size: 32,
          color: isDarkMode ? Colors.white : primaryColor,
        ),
      ),
    );
  }
}

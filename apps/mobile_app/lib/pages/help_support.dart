import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/patient_api.dart';

// --- DATA MODEL ---
class SupportTopic {
  final IconData icon;
  final String title;
  final String subtitle;
  final String details;
  final String category; // Added category field for filtering

  SupportTopic({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.details,
    required this.category,
  });
}

class SupportCenterScreen extends StatefulWidget {
  const SupportCenterScreen({super.key});

  @override
  State<SupportCenterScreen> createState() => _SupportCenterScreenState();
}

class _SupportCenterScreenState extends State<SupportCenterScreen> {
  // Theme Branding Colors
  static const Color brandBlue = Color(0xFF2a4eca);
  static const Color brandBlueDark = Color(0xFF1e3a8a);
  static const Color softBlue = Color(0xFFf0f4ff);
  static const Color slate900 = Color(0xFF0f172a);
  static const Color slate800 = Color(0xFF1e293b);
  static const Color slate500 = Color(0xFF64748b);
  static const Color slate400 = Color(0xFF94a3b8);


  // Search and Category logic variables
  String searchQuery = "";
  String selectedCategory = "All"; // Track which chip is selected
  final TextEditingController _searchController = TextEditingController();

  final List<String> categories = [
    "All",
    "Reservations",
    "Account",
    "Medicine",
  ];
  // The list of all available support topics
  final List<SupportTopic> allTopics = [
    SupportTopic(
      category: "Reservations",
      icon: Icons.bookmark_added_rounded,
      title: "Medicine Reservation",
      subtitle: "How to reserve your medicines online",
      details:
          "Search for medicines or upload a prescription to reserve your medicines. The pharmacy will review your request and notify you when your reservation is confirmed."
    ),
    SupportTopic(
  category: "Medicine",
  icon: Icons.medication_rounded,
  title: "Medicine Search",
  subtitle: "Find medicines quickly",
  details:
      "Use the search feature to find available medicines at nearby pharmacies. Results are based on availability shared by registered pharmacies.",
),
    SupportTopic(
      category: "Account",
      icon: Icons.security_rounded,
      title: "Privacy & Safety",
      subtitle: "How we protect your medical data",
      details:
          "Your prescription images and account information are securely stored and are only accessible to you and the pharmacy handling your reservation.",
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;

    // Filtering logic: Checks both Search Query AND Category Chip
    final filteredTopics = allTopics.where((topic) {
      final matchesSearch = topic.title.toLowerCase().contains(
        searchQuery.toLowerCase(),
      );
      final matchesCategory =
          selectedCategory == "All" || topic.category == selectedCategory;
      return matchesSearch && matchesCategory;
    }).toList();

    final Color bgColor = isDark ? slate900 : Colors.white;
    final Color textColor = isDark ? Colors.white : slate900;
    final Color subTextColor = isDark ? slate400 : slate500;
    final Color borderColor = isDark ? Colors.white10 : const Color(0xFFF1F5F9);

    return Scaffold(
      backgroundColor: bgColor,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverAppBar(
            pinned: true,
            elevation: 0,
            backgroundColor: isDark ? slate900 : Colors.white,
            leading: IconButton(
              icon: const Icon(
                Icons.arrow_back_ios_new,
                color: brandBlue,
                size: 20,
              ),
              onPressed: () => Navigator.pop(context),
            ),
            title: Text(
              "Help & Support",
              style: GoogleFonts.plusJakartaSans(
                color: textColor,
                fontWeight: FontWeight.bold,
              ),
            ),
            centerTitle: true,
          ),

          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                const SizedBox(height: 24),
                Text(
                  "How can we help?",
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: textColor,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  "Find answers to your questions instantly.",
                  style: GoogleFonts.plusJakartaSans(
                    color: subTextColor,
                    fontSize: 15,
                  ),
                ),

                const SizedBox(height: 28),
                _buildSearchBar(isDark, borderColor, subTextColor),

                const SizedBox(height: 24),
                // --- CATEGORY CHIPS RESTORED ---
                _buildQuickCategories(isDark),

                const SizedBox(height: 36),
                Text(
                  "Popular Topics",
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: textColor,
                  ),
                ),
                const SizedBox(height: 16),

                // --- DYNAMIC LIST OF TOPICS ---
                ...filteredTopics.map(
                  (topic) => Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: ExpandableTopicCard(
                      icon: topic.icon,
                      title: topic.title,
                      subtitle: topic.subtitle,
                      details: topic.details,
                    ),
                  ),
                ),

                if (filteredTopics.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 40),
                    child: Center(
                      child: Text(
                        "No results found.",
                        style: TextStyle(color: subTextColor),
                      ),
                    ),
                  ),

                const SizedBox(height: 48),
                _buildContactCard(isDark),
                const SizedBox(height: 40),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar(bool isDark, Color border, Color hintColor) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? slate800 : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: border, width: 1.5),
      ),
      child: TextField(
        controller: _searchController,
        onChanged: (value) => setState(() => searchQuery = value),
        style: TextStyle(color: isDark ? Colors.white : slate900),
        decoration: InputDecoration(
          hintText: "Search topics...",
          hintStyle: GoogleFonts.plusJakartaSans(
            color: hintColor,
            fontSize: 15,
          ),
          prefixIcon: const Icon(
            Icons.search_rounded,
            color: brandBlue,
            size: 22,
          ),
          suffixIcon: searchQuery.isNotEmpty
              ? IconButton(
                  icon: Icon(Icons.clear, color: hintColor),
                  onPressed: () {
                    _searchController.clear();
                    setState(() => searchQuery = "");
                  },
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 18),
        ),
      ),
    );
  }

  // --- RE-ADDED CATEGORIES WIDGET ---
  Widget _buildQuickCategories(bool isDark) {
    return SizedBox(
      height: 38,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: categories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final category = categories[index];
          final bool isSelected = selectedCategory == category;

          return GestureDetector(
            onTap: () => setState(() => selectedCategory = category),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              decoration: BoxDecoration(
                color: isSelected ? brandBlue : (isDark ? slate800 : softBlue),
                borderRadius: BorderRadius.circular(30),
              ),
              alignment: Alignment.center,
              child: Text(
                category,
                style: GoogleFonts.plusJakartaSans(
                  color: isSelected ? Colors.white : brandBlue,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildContactCard(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [brandBlue, brandBlueDark]),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Column(
        children: [
          const Icon(Icons.headset_mic_rounded, color: Colors.white, size: 48),
          const SizedBox(height: 16),
          Text(
            "Need more help?",
            style: GoogleFonts.plusJakartaSans(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
           onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 56),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            child: const Text(
              "Contact us admin@medspot.com",
              style: TextStyle(color: brandBlue, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}


class ExpandableTopicCard extends StatefulWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String details;

  const ExpandableTopicCard({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.details,
  });

  @override
  State<ExpandableTopicCard> createState() => _ExpandableTopicCardState();
}

class _ExpandableTopicCardState extends State<ExpandableTopicCard> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    final Color surfaceColor = isDark ? const Color(0xFF1e293b) : Colors.white;
    final Color textColor = isDark ? Colors.white : const Color(0xFF0f172a);
    final Color subTextColor = isDark
        ? const Color(0xFF94a3b8)
        : const Color(0xFF64748b);

    return GestureDetector(
      onTap: () => setState(() => _isExpanded = !_isExpanded),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: surfaceColor,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
          ),
        ),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF0f172a)
                        : const Color(0xFFf0f4ff),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(
                    widget.icon,
                    color: const Color(0xFF2a4eca),
                    size: 26,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.title,
                        style: GoogleFonts.plusJakartaSans(
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                          color: textColor,
                        ),
                      ),
                      Text(
                        widget.subtitle,
                        style: GoogleFonts.plusJakartaSans(
                          color: subTextColor,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  _isExpanded
                      ? Icons.keyboard_arrow_up_rounded
                      : Icons.keyboard_arrow_down_rounded,
                  color: subTextColor,
                ),
              ],
            ),
            if (_isExpanded) ...[
              const SizedBox(height: 16),
              const Divider(thickness: 1),
              const SizedBox(height: 12),
              Text(
                widget.details,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  color: subTextColor,
                  height: 1.5,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

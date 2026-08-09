import 'package:flutter/material.dart';
import 'theme.dart';

/// ===============================
/// ROUNDED HEADER
/// Large curved header used on auth screens
/// ===============================
class RoundedHeader extends StatelessWidget {

  final double height;
  final Widget? child;

  const RoundedHeader({
    super.key,
    this.height = 280,
    this.child,
  });

  @override
  Widget build(BuildContext context) {

    return Container(
      height: height,
      width: double.infinity,
      decoration: const BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(AppSizes.radiusXL),
          bottomRight: Radius.circular(AppSizes.radiusXL),
        ),
      ),
      child: child,
    );
  }
}

/// ===============================
/// WHITE CARD CONTAINER
/// Overlapping sheet used under header
/// ===============================
class WhiteCardContainer extends StatelessWidget {

  final Widget child;
  final double topRadius;
  final EdgeInsets padding;

  const WhiteCardContainer({
    super.key,
    required this.child,
    this.topRadius = AppSizes.radiusLarge,
    this.padding = const EdgeInsets.symmetric(
      horizontal: AppSizes.contentPadding,
      vertical: 28,
    ),
  });

  @override
  Widget build(BuildContext context) {

    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: AppColors.lightBackground,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(topRadius),
          topRight: Radius.circular(topRadius),
        ),
      ),
      child: child,
    );
  }
}

/// ===============================
/// FLOATING INPUT FIELD
/// Animated floating label text field
/// ===============================
class FloatingField extends StatefulWidget {

  final TextEditingController controller;
  final FocusNode focusNode;
  final String label;
  final bool isPassword;
  final bool? passwordVisible;
  final VoidCallback? onPasswordToggle;
  final String? errorText;

  const FloatingField({
    super.key,
    required this.controller,
    required this.focusNode,
    required this.label,
    this.isPassword = false,
    this.passwordVisible,
    this.onPasswordToggle,
    this.errorText,
  });

  @override
  State<FloatingField> createState() => _FloatingFieldState();
}

class _FloatingFieldState extends State<FloatingField> {

  @override
  Widget build(BuildContext context) {

    final bool isFocused = widget.focusNode.hasFocus;
    final bool hasText = widget.controller.text.isNotEmpty;

    final Color borderColor = widget.errorText != null
        ? AppColors.danger
        : (isFocused ? AppColors.primary : AppColors.slate300);

    return SizedBox(
      width: double.infinity,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          /// TEXT FIELD
          Stack(
            clipBehavior: Clip.none,
            children: [

              Container(
                height: 56,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  // borderRadius: BorderRadius.circular(AppSizes.fieldradius),
                  border: Border.all(color: borderColor),
                ),
                child: Row(
                  children: [

                    /// INPUT
                    Expanded(
                      child: TextField(
                        controller: widget.controller,
                        focusNode: widget.focusNode,
                        obscureText: widget.isPassword
                            ? !(widget.passwordVisible ?? false)
                            : false,
                        onChanged: (_) => setState(() {}),
                        decoration: const InputDecoration(
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.only(top: 14),
                        ),
                      ),
                    ),

                    /// PASSWORD ICON
                    if (widget.isPassword)
                      GestureDetector(
                        onTap: widget.onPasswordToggle,
                        child: Icon(
                          widget.passwordVisible == true
                              ? Icons.visibility
                              : Icons.visibility_off,
                          size: 22,
                          color: AppColors.slate600,
                        ),
                      ),

                  ],
                ),
              ),

              /// FLOATING LABEL
              AnimatedPositioned(
                duration: const Duration(milliseconds: 150),
                left: 20,
                top: (isFocused || hasText) ? -8 : 17,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  color: (isFocused || hasText)
                      ? AppColors.lightBackground
                      : Colors.transparent,
                  child: Text(
                    widget.label,
                    style: TextStyle(
                      color: AppColors.primary,
                      fontSize: (isFocused || hasText) ? 12 : 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),

            ],
          ),

          /// ERROR TEXT
          if (widget.errorText != null)
            Padding(
              padding: const EdgeInsets.only(top: 6, left: 6),
              child: Text(
                widget.errorText!,
                style: const TextStyle(
                  color: Colors.red,
                  fontSize: 13,
                ),
              ),
            ),

        ],
      ),
    );
  }
}

/// ===============================
/// PRIMARY BUTTON
/// Main app CTA button
/// ===============================
class PrimaryButton extends StatelessWidget {

  final String text;
  final VoidCallback onPressed;

  const PrimaryButton({
    super.key,
    required this.text,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {

    return GestureDetector(
      onTap: onPressed,
      child: Container(
        width: double.infinity,
        height: 55,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(AppSizes.buttonRadius),
          boxShadow: const [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 6,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Text(
          text,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}
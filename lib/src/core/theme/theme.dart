import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // ============================================================================
  // PRIMARY COLORS
  // ============================================================================
  static const Color primaryCyan = Color(0xFF02A4D3);
  static const Color primaryBlue = Color(0xFF0055A7);
  static const Color primaryGreen = Color(0xFF5CBC72);

  // Primary color alias (main app color)
  static const Color primaryColor = primaryBlue;
  static const Color secondaryColor = primaryCyan; // For backward compatibility

  // ============================================================================
  // SECONDARY COLORS (Status Colors)
  // ============================================================================
  static const Color successGreen = Color(0xFF34A853);
  static const Color warningYellow = Color(0xFFFDC107);
  static const Color errorRed = Color(0xFFDB4437);

  // ============================================================================
  // NEUTRAL COLORS (From gray scale swatches)
  // ============================================================================
  static const Color neutralWhite = Color(0xFFF5F5F5);
  static const Color neutralGray = Color(0xFF9E9E9E);
  static const Color neutralLightGray = Color(0xFFE0E0E0);
  static const Color neutralDark = Color(0xFF333333);

  // Background colors
  static const Color backgroundLight = Color(0xFFF5F5F5);
  static const Color surfaceWhite = Colors.white;

  // ============================================================================
  // TEXT STYLES - Using Inter with Roboto fallback
  // Font weights: regular (400), medium (500), semi-bold (600)
  // Font sizes: 12, 14, 16, 20, 24, 34
  // ============================================================================
  static TextStyle get textStyle12 => GoogleFonts.inter(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    color: neutralDark,
  );

  static TextStyle get textStyle12Medium => GoogleFonts.inter(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    color: neutralDark,
  );

  static TextStyle get textStyle12SemiBold => GoogleFonts.inter(
    fontSize: 12,
    fontWeight: FontWeight.w600,
    color: neutralDark,
  );

  static TextStyle get textStyle14 => GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: neutralDark,
  );

  static TextStyle get textStyle14Medium => GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: neutralDark,
  );

  static TextStyle get textStyle14SemiBold => GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    color: neutralDark,
  );

  static TextStyle get textStyle16 => GoogleFonts.inter(
    fontSize: 16,
    fontWeight: FontWeight.w400,
    color: neutralDark,
  );

  static TextStyle get textStyle16Medium => GoogleFonts.inter(
    fontSize: 16,
    fontWeight: FontWeight.w500,
    color: neutralDark,
  );

  static TextStyle get textStyle16SemiBold => GoogleFonts.inter(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    color: neutralDark,
  );

  static TextStyle get textStyle20 => GoogleFonts.inter(
    fontSize: 20,
    fontWeight: FontWeight.w400,
    color: neutralDark,
  );

  static TextStyle get textStyle20Medium => GoogleFonts.inter(
    fontSize: 20,
    fontWeight: FontWeight.w500,
    color: neutralDark,
  );

  static TextStyle get textStyle20SemiBold => GoogleFonts.inter(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    color: neutralDark,
  );

  static TextStyle get textStyle24 => GoogleFonts.inter(
    fontSize: 24,
    fontWeight: FontWeight.w400,
    color: neutralDark,
  );

  static TextStyle get textStyle24Medium => GoogleFonts.inter(
    fontSize: 24,
    fontWeight: FontWeight.w500,
    color: neutralDark,
  );

  static TextStyle get textStyle24SemiBold => GoogleFonts.inter(
    fontSize: 24,
    fontWeight: FontWeight.w600,
    color: neutralDark,
  );

  static TextStyle get textStyle34 => GoogleFonts.inter(
    fontSize: 34,
    fontWeight: FontWeight.w400,
    color: neutralDark,
  );

  static TextStyle get textStyle34Medium => GoogleFonts.inter(
    fontSize: 34,
    fontWeight: FontWeight.w500,
    color: neutralDark,
  );

  static TextStyle get textStyle34SemiBold => GoogleFonts.inter(
    fontSize: 34,
    fontWeight: FontWeight.w600,
    color: neutralDark,
  );

  // ============================================================================
  // LIGHT THEME
  // ============================================================================
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryBlue,
        primary: primaryBlue,
        secondary: primaryCyan,
        tertiary: primaryGreen,
        surface: surfaceWhite,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onTertiary: Colors.white,
        error: errorRed,
        onError: Colors.white,
      ),
      scaffoldBackgroundColor: backgroundLight,
      textTheme: GoogleFonts.interTextTheme().copyWith(
        displayLarge: textStyle34SemiBold,
        displayMedium: textStyle24SemiBold,
        displaySmall: textStyle20SemiBold,
        headlineLarge: textStyle34Medium,
        headlineMedium: textStyle24Medium,
        headlineSmall: textStyle20Medium,
        titleLarge: textStyle20SemiBold,
        titleMedium: textStyle16SemiBold,
        titleSmall: textStyle14SemiBold,
        bodyLarge: textStyle16,
        bodyMedium: textStyle14,
        bodySmall: textStyle12,
        labelLarge: textStyle14SemiBold,
        labelMedium: textStyle12SemiBold,
        labelSmall: textStyle12,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: primaryBlue,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: textStyle20SemiBold.copyWith(color: Colors.white),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryBlue,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: textStyle16SemiBold.copyWith(color: Colors.white),
          elevation: 0,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryBlue,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          side: const BorderSide(color: primaryBlue, width: 1.5),
          textStyle: textStyle16SemiBold,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryBlue,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          textStyle: textStyle14SemiBold,
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: primaryCyan,
        foregroundColor: Colors.white,
        elevation: 4,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceWhite,
        hintStyle: textStyle14.copyWith(color: neutralGray),
        labelStyle: textStyle14.copyWith(color: neutralGray),
        errorStyle: textStyle12.copyWith(color: errorRed),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: neutralLightGray),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: neutralLightGray),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: primaryBlue, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: errorRed),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: errorRed, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
      ),
      cardTheme: CardThemeData(
        color: surfaceWhite,
        elevation: 2,
        shadowColor: neutralDark.withValues(alpha: 0.1),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: neutralWhite,
        selectedColor: primaryCyan.withValues(alpha: 0.2),
        labelStyle: textStyle12Medium,
        side: BorderSide.none,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
      dividerTheme: const DividerThemeData(
        color: neutralLightGray,
        thickness: 1,
        space: 1,
      ),
      iconTheme: const IconThemeData(color: neutralDark, size: 24),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: surfaceWhite,
        selectedItemColor: primaryBlue,
        unselectedItemColor: neutralGray,
        selectedLabelStyle: textStyle12SemiBold,
        unselectedLabelStyle: textStyle12,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      tabBarTheme: TabBarThemeData(
        labelColor: primaryBlue,
        unselectedLabelColor: neutralGray,
        labelStyle: textStyle14SemiBold,
        unselectedLabelStyle: textStyle14,
        indicatorColor: primaryBlue,
        indicatorSize: TabBarIndicatorSize.label,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: surfaceWhite,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        titleTextStyle: textStyle20SemiBold,
        contentTextStyle: textStyle14,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: neutralDark,
        contentTextStyle: textStyle14.copyWith(color: Colors.white),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: primaryCyan,
        linearTrackColor: neutralLightGray,
        circularTrackColor: neutralLightGray,
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return primaryBlue;
          }
          return neutralGray;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return primaryBlue.withValues(alpha: 0.4);
          }
          return neutralLightGray;
        }),
      ),
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return primaryBlue;
          }
          return Colors.transparent;
        }),
        checkColor: WidgetStateProperty.all(Colors.white),
        side: const BorderSide(color: neutralGray, width: 1.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
      ),
      radioTheme: RadioThemeData(
        fillColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return primaryBlue;
          }
          return neutralGray;
        }),
      ),
    );
  }
}

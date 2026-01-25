import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // ============================================================================
  // COLORS (Single Source of Truth)
  // ============================================================================
  // Brand Colors
  static const Color primaryBlue = Color(0xFF0055A7);
  static const Color primaryCyan = Color(0xFF02A4D3);
  static const Color primaryGreen = Color(0xFF5CBC72);

  // Gradient Colors (Used in headers)
  static const Color gradientLightBlue = Color(0xFF4FC3F7);
  static const Color gradientDarkBlue = Color(0xFF0288D1);

  // Status Colors
  static const Color success = Color(0xFF34A853);
  static const Color warning = Color(0xFFFDC107);
  static const Color error = Color(0xFFDB4437);

  // Status Palette (for dashboard status grid)
  static const Color statusRequests = Color(0xFF0055A7); // Primary Blue
  static const Color statusShipped = Color(0xFF5C6BC0); // Indigo shade
  static const Color statusDelivered = Color(0xFF43A047); // Green shade
  static const Color statusCleared = Color(0xFF00897B); // Teal shade
  static const Color statusDispatch = Color(0xFFFB8C00); // Orange shade
  static const Color statusWaiting = Color(0xFFE53935); // Red shade

  // Neutrals
  static const Color background = Color(0xFFF5F5F5);
  static const Color surface = Colors.white;
  static const Color textDark = Color(0xFF333333);
  static const Color textGrey = Color(0xFF9E9E9E);

  // Dark Mode Colors
  static const Color darkBackground = Color(0xFF121212);
  static const Color darkSurface = Color(0xFF1E1E1E);
  static const Color darkCard = Color(0xFF2C2C2C);
  static const Color textLight = Color(0xFFE0E0E0);

  // ============================================================================
  // TEXT THEME (Poppins Default)
  // ============================================================================
  static TextTheme _poppinsTextTheme({bool isDark = false}) {
    final Color textColor = isDark ? textLight : textDark;
    final Color greyColor = isDark ? Colors.grey[400]! : textGrey;

    return GoogleFonts.poppinsTextTheme().copyWith(
      // Headings
      displayLarge: GoogleFonts.poppins(
        fontSize: 34,
        fontWeight: FontWeight.w600,
        color: textColor,
      ),
      displayMedium: GoogleFonts.poppins(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        color: textColor,
      ),
      displaySmall: GoogleFonts.poppins(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: textColor,
      ),

      // Titles
      titleLarge: GoogleFonts.poppins(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: textColor,
      ),
      titleMedium: GoogleFonts.poppins(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: textColor,
      ),
      titleSmall: GoogleFonts.poppins(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: textColor,
      ),

      // Body
      bodyLarge: GoogleFonts.poppins(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: textColor,
      ),
      bodyMedium: GoogleFonts.poppins(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: textColor,
      ),
      bodySmall: GoogleFonts.poppins(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: greyColor,
      ),

      // Buttons & Labels
      labelLarge: GoogleFonts.poppins(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: Colors.white,
      ),
    );
  }

  // ============================================================================
  // LIGHT THEME DATA
  // ============================================================================
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryBlue,
        brightness: Brightness.light,
        primary: primaryBlue,
        secondary: primaryCyan,
        tertiary: primaryGreen,
        surface: surface,
        error: error,
      ),
      scaffoldBackgroundColor: background,
      textTheme: _poppinsTextTheme(isDark: false),

      appBarTheme: AppBarTheme(
        backgroundColor: primaryBlue,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: _poppinsTextTheme(
          isDark: false,
        ).titleLarge?.copyWith(color: Colors.white),
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryBlue,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: _poppinsTextTheme(isDark: false).labelLarge,
          elevation: 0,
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        hintStyle: _poppinsTextTheme(
          isDark: false,
        ).bodyMedium?.copyWith(color: textGrey),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: primaryBlue, width: 2),
        ),
      ),

      cardTheme: CardThemeData(
        color: surface,
        elevation: 4,
        shadowColor: primaryBlue.withValues(alpha: 0.12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),

      pageTransitionsTheme: const PageTransitionsTheme(
        builders: <TargetPlatform, PageTransitionsBuilder>{
          TargetPlatform.android: ZoomPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        },
      ),
    );
  }

  // ============================================================================
  // DARK THEME DATA
  // ============================================================================
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryBlue,
        brightness: Brightness.dark,
        primary: primaryCyan,
        secondary: primaryBlue,
        tertiary: primaryGreen,
        surface: darkSurface,
        error: error,
      ),
      scaffoldBackgroundColor: darkBackground,
      textTheme: _poppinsTextTheme(isDark: true),

      appBarTheme: AppBarTheme(
        backgroundColor: darkSurface,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: _poppinsTextTheme(
          isDark: true,
        ).titleLarge?.copyWith(color: Colors.white),
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryCyan,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: _poppinsTextTheme(isDark: true).labelLarge,
          elevation: 0,
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: darkCard,
        hintStyle: _poppinsTextTheme(
          isDark: true,
        ).bodyMedium?.copyWith(color: Colors.grey[400]),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey[700]!),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey[700]!),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: primaryCyan, width: 2),
        ),
      ),

      cardTheme: CardThemeData(
        color: darkCard,
        elevation: 4,
        shadowColor: Colors.black.withValues(alpha: 0.3),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),

      pageTransitionsTheme: const PageTransitionsTheme(
        builders: <TargetPlatform, PageTransitionsBuilder>{
          TargetPlatform.android: ZoomPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        },
      ),
    );
  }
}

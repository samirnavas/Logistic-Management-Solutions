import 'package:intl/intl.dart';

/// Canonical currency-code → display-symbol mapping.
/// `NumberFormat.simpleCurrency` relies on ICU locale data which
/// renders some currencies in unexpected ways (e.g. AED → "dh").
/// This map gives us full control over presentation.
const currencySymbols = <String, String>{
  'INR': '₹ ',
  'USD': '\$ ',
  'AED': 'AED ',
  'EUR': '€ ',
  'GBP': '£ ',
  'CNY': '¥ ',
  'SAR': 'SAR ',
  'OMR': 'OMR ',
  'QAR': 'QAR ',
  'BHD': 'BHD ',
  'KWD': 'KWD ',
};

/// Returns the display symbol for a currency code.
/// Falls back to the code itself if not in the map.
String currencySymbol(String? code) {
  final key = (code ?? 'INR').toUpperCase();
  return currencySymbols[key] ?? '$key ';
}

/// Returns a [NumberFormat] configured with the correct symbol
/// for the given currency code.
NumberFormat currencyFormat(String? code, {int decimalDigits = 2}) {
  return NumberFormat.currency(
    symbol: currencySymbol(code),
    decimalDigits: decimalDigits,
  );
}

/// Convenience: format a [price] in the given [currency].
/// Returns the formatted string, or [fallback] when price is null.
String formatPrice(double? price, {String? currency, String fallback = '—'}) {
  if (price == null) return fallback;
  return currencyFormat(currency).format(price);
}

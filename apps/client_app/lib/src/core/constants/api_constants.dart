import 'dart:io';

class ApiConstants {
  // Smart URL selection
  static String get baseUrl {
    if (Platform.isAndroid) {
      // Standard Android Emulator loopback address
      // return 'http://10.0.2.2:5000';
      // Physical Device (Use computer's IP)
      return 'http://10.150.138.209:5000';
    }
    return 'http://localhost:5000'; // iOS Simulator & Web
  }
}

import 'dart:io';

class ApiConstants {
  // Smart URL selection
  static String get baseUrl {
    if (Platform.isAndroid) {
      // Physical Device (Use computer's IP)
      // Make sure your phone is on the same WiFi network and Firewall allows port 5000
      // return 'http://10.150.138.209:5000';

      // Standard Android Emulator loopback address (Use this if using Emulator)
      return 'http://10.0.2.2:5000';
    }
    return 'http://localhost:5000'; // iOS Simulator
  }
}

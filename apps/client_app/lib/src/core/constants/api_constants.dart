import 'dart:io';

class ApiConstants {
  // Smart URL selection
  static String get baseUrl {
    if (Platform.isAndroid) {
      // Physical Device (Use computer's IP)
      print(
        'ApiConstants: Using Android Physical/Specific URL: http://10.168.119.209:5000',
      );
      return 'http://10.148.209.209:5000';

      // Standard Android Emulator loopback address (Use this if using Emulator)
      // return 'http://10.0.2.2:5000';
    }
    print('ApiConstants: Using Localhost URL: http://localhost:5000');
    return 'http://localhost:5000'; // iOS Simulator
  }
}

import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  final _storage = const FlutterSecureStorage();

  // Smart URL selection
  static String get baseUrl {
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:5000'; // Android Emulator specific IP
    }
    return 'http://localhost:5000'; // iOS Simulator & Web
  }

  Future<dynamic> postRequest(
    String endpoint,
    Map<String, dynamic> data,
  ) async {
    final url = Uri.parse('$baseUrl$endpoint');
    String? token = await _storage.read(key: 'jwt_token');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode(data),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        // This ensures the UI gets the actual error message from backend
        // Try/catch just in case the body isn't valid JSON
        try {
          final errorBody = jsonDecode(response.body);
          throw Exception(
            errorBody['message'] ??
                errorBody['msg'] ??
                'Server Error: ${response.statusCode}',
          );
        } catch (e) {
          if (e is Exception && e.toString().contains('Server Error')) {
            rethrow;
          }
          throw Exception(
            'Failed to post data: ${response.statusCode} - ${response.body}',
          );
        }
      }
    } catch (e) {
      if (e is Exception) rethrow; // Pass up our custom exceptions
      throw Exception('Connection Failed: $e');
    }
  }
}

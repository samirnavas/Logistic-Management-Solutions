import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:bb_logistics/src/core/errors/user_error.dart';
import 'package:bb_logistics/src/core/constants/api_constants.dart';

class ApiService {
  final _storage = const FlutterSecureStorage();

  // Smart URL selection
  static String get baseUrl => ApiConstants.baseUrl;

  /// Parses the error response body and throws a UserError
  UserError _handleErrorResponse(http.Response response) {
    String? rawMessage;
    try {
      final errorBody = jsonDecode(response.body);
      rawMessage =
          errorBody['message'] ?? errorBody['msg'] ?? errorBody['error'];
    } catch (_) {
      // Body wasn't valid JSON
      rawMessage = response.body;
    }
    return UserError(statusCode: response.statusCode, rawMessage: rawMessage);
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
        throw _handleErrorResponse(response);
      }
    } on UserError {
      rethrow;
    } on SocketException {
      throw UserError.connectionError();
    } catch (e) {
      throw UserError.unknown(e.toString());
    }
  }

  Future<dynamic> putRequest(String endpoint, Map<String, dynamic> data) async {
    final url = Uri.parse('$baseUrl$endpoint');
    String? token = await _storage.read(key: 'jwt_token');

    try {
      final response = await http.put(
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
        throw _handleErrorResponse(response);
      }
    } on UserError {
      rethrow;
    } on SocketException {
      throw UserError.connectionError();
    } catch (e) {
      throw UserError.unknown(e.toString());
    }
  }

  Future<dynamic> getRequest(String endpoint) async {
    final url = Uri.parse('$baseUrl$endpoint');
    String? token = await _storage.read(key: 'jwt_token');

    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw _handleErrorResponse(response);
      }
    } on UserError {
      rethrow;
    } on SocketException {
      throw UserError.connectionError();
    } catch (e) {
      throw UserError.unknown(e.toString());
    }
  }

  Future<dynamic> deleteRequest(String endpoint) async {
    final url = Uri.parse('$baseUrl$endpoint');
    String? token = await _storage.read(key: 'jwt_token');

    try {
      final response = await http.delete(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw _handleErrorResponse(response);
      }
    } on UserError {
      rethrow;
    } on SocketException {
      throw UserError.connectionError();
    } catch (e) {
      throw UserError.unknown(e.toString());
    }
  }
}

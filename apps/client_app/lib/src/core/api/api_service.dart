import 'dart:convert';
import 'dart:io';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:bb_logistics/src/core/errors/user_error.dart';
import 'package:bb_logistics/src/core/constants/api_constants.dart';

class ApiService {
  final _storage = const FlutterSecureStorage();

  // Smart URL selection
  static String get baseUrl => ApiConstants.baseUrl;

  UserError _handleErrorResponse(http.Response response) {
    String? rawMessage;
    try {
      final errorBody = jsonDecode(response.body);
      // Prioritize combining message and error for full details
      final msg = errorBody['message'] ?? errorBody['msg'];
      final err = errorBody['error'];

      if (msg != null && err != null) {
        rawMessage = '$msg: $err';
      } else {
        rawMessage = msg ?? err;
      }
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
    print('POST Request to: $url');

    try {
      final response = await http
          .post(
            url,
            headers: {
              'Content-Type': 'application/json',
              if (token != null) 'Authorization': 'Bearer $token',
            },
            body: jsonEncode(data),
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        throw _handleErrorResponse(response);
      }
    } on UserError {
      rethrow;
    } on SocketException {
      throw UserError.connectionError();
    } on TimeoutException {
      throw UserError.unknown('Connection timed out');
    } catch (e) {
      throw UserError.unknown(e.toString());
    }
  }

  Future<dynamic> putRequest(String endpoint, Map<String, dynamic> data) async {
    final url = Uri.parse('$baseUrl$endpoint');
    String? token = await _storage.read(key: 'jwt_token');

    try {
      final response = await http
          .put(
            url,
            headers: {
              'Content-Type': 'application/json',
              if (token != null) 'Authorization': 'Bearer $token',
            },
            body: jsonEncode(data),
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        throw _handleErrorResponse(response);
      }
    } on UserError {
      rethrow;
    } on SocketException {
      throw UserError.connectionError();
    } on TimeoutException {
      throw UserError.unknown('Connection timed out');
    } catch (e) {
      throw UserError.unknown(e.toString());
    }
  }

  Future<dynamic> getRequest(String endpoint) async {
    final url = Uri.parse('$baseUrl$endpoint');
    String? token = await _storage.read(key: 'jwt_token');
    print('GET Request to: $url');

    try {
      final response = await http
          .get(
            url,
            headers: {
              'Content-Type': 'application/json',
              if (token != null) 'Authorization': 'Bearer $token',
            },
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw _handleErrorResponse(response);
      }
    } on UserError {
      rethrow;
    } on SocketException {
      throw UserError.connectionError();
    } on TimeoutException {
      throw UserError.unknown('Connection timed out');
    } catch (e) {
      throw UserError.unknown(e.toString());
    }
  }

  Future<dynamic> deleteRequest(String endpoint) async {
    final url = Uri.parse('$baseUrl$endpoint');
    String? token = await _storage.read(key: 'jwt_token');

    try {
      final response = await http
          .delete(
            url,
            headers: {
              'Content-Type': 'application/json',
              if (token != null) 'Authorization': 'Bearer $token',
            },
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw _handleErrorResponse(response);
      }
    } on UserError {
      rethrow;
    } on SocketException {
      throw UserError.connectionError();
    } on TimeoutException {
      throw UserError.unknown('Connection timed out');
    } catch (e) {
      throw UserError.unknown(e.toString());
    }
  }
}

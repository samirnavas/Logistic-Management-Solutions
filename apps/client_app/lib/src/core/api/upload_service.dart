import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';
import 'package:bb_logistics/src/core/constants/api_constants.dart';

/// Service for handling file uploads to Cloudinary via the backend
class UploadService {
  final _storage = const FlutterSecureStorage();

  // Smart URL selection
  static String get baseUrl => ApiConstants.baseUrl;

  /// Upload profile avatar
  /// Returns the Cloudinary URL of the uploaded image
  Future<String> uploadAvatar(String userId, File imageFile) async {
    final url = Uri.parse('$baseUrl/api/upload/avatar/$userId');
    final token = await _storage.read(key: 'jwt_token');

    final request = http.MultipartRequest('POST', url);

    // Add auth header
    if (token != null) {
      request.headers['Authorization'] = 'Bearer $token';
    }

    // Add the file
    final extension = imageFile.path.split('.').last.toLowerCase();
    final mimeType = _getMimeType(extension);

    request.files.add(
      await http.MultipartFile.fromPath(
        'avatar',
        imageFile.path,
        contentType: MediaType.parse(mimeType),
      ),
    );

    try {
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['avatarUrl'] as String;
      } else {
        final errorBody = jsonDecode(response.body);
        throw Exception(
          errorBody['message'] ??
              'Failed to upload avatar: ${response.statusCode}',
        );
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Upload failed: $e');
    }
  }

  /// Upload multiple product photos
  /// Returns a list of Cloudinary URLs
  Future<List<String>> uploadProductPhotos(List<File> imageFiles) async {
    if (imageFiles.isEmpty) return [];
    if (imageFiles.length > 5) {
      throw Exception('Maximum 5 photos allowed');
    }

    final url = Uri.parse('$baseUrl/api/upload/products');
    final token = await _storage.read(key: 'jwt_token');

    final request = http.MultipartRequest('POST', url);

    // Add auth header
    if (token != null) {
      request.headers['Authorization'] = 'Bearer $token';
    }

    // Add all files
    for (final imageFile in imageFiles) {
      final extension = imageFile.path.split('.').last.toLowerCase();
      final mimeType = _getMimeType(extension);

      request.files.add(
        await http.MultipartFile.fromPath(
          'photos',
          imageFile.path,
          contentType: MediaType.parse(mimeType),
        ),
      );
    }

    try {
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final photos = data['photos'] as List;
        return photos.map((url) => url as String).toList();
      } else {
        final errorBody = jsonDecode(response.body);
        throw Exception(
          errorBody['message'] ??
              'Failed to upload photos: ${response.statusCode}',
        );
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Upload failed: $e');
    }
  }

  /// Upload a PDF document (for managers)
  /// Returns the Cloudinary URL of the uploaded PDF
  Future<String> uploadPdf(File pdfFile, {String? quotationId}) async {
    final endpoint = quotationId != null
        ? '/api/upload/pdf/$quotationId'
        : '/api/upload/pdf';
    final url = Uri.parse('$baseUrl$endpoint');
    final token = await _storage.read(key: 'jwt_token');

    final request = http.MultipartRequest('POST', url);

    // Add auth header
    if (token != null) {
      request.headers['Authorization'] = 'Bearer $token';
    }

    // Add the PDF file
    request.files.add(
      await http.MultipartFile.fromPath(
        'document',
        pdfFile.path,
        contentType: MediaType.parse('application/pdf'),
      ),
    );

    try {
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['pdfUrl'] as String;
      } else {
        final errorBody = jsonDecode(response.body);
        throw Exception(
          errorBody['message'] ??
              'Failed to upload PDF: ${response.statusCode}',
        );
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Upload failed: $e');
    }
  }

  /// Helper to get mime type from extension
  String _getMimeType(String extension) {
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'gif':
        return 'image/gif';
      case 'pdf':
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  }
}

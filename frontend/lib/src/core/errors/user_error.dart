/// A user-friendly error class that maps backend errors to readable messages.
///
/// This class is used to display friendly error messages to users instead of
/// raw exception strings or technical error codes.
class UserError implements Exception {
  /// The HTTP status code from the backend
  final int statusCode;

  /// The raw error message from the backend (for logging)
  final String? rawMessage;

  /// The user-friendly message to display
  final String friendlyMessage;

  UserError({required this.statusCode, this.rawMessage, String? customMessage})
    : friendlyMessage =
          customMessage ?? _mapStatusCodeToMessage(statusCode, rawMessage);

  /// Maps HTTP status codes to user-friendly messages
  static String _mapStatusCodeToMessage(int statusCode, String? rawMessage) {
    // Check for specific backend messages first
    if (rawMessage != null) {
      final lowerMessage = rawMessage.toLowerCase();

      // Auth-specific errors
      if (lowerMessage.contains('invalid credentials') ||
          lowerMessage.contains('incorrect password') ||
          lowerMessage.contains('wrong password')) {
        return 'Incorrect email or password. Please try again.';
      }
      if (lowerMessage.contains('user not found') ||
          lowerMessage.contains('email not found') ||
          lowerMessage.contains('account not found')) {
        return 'No account found with this email. Please sign up.';
      }
      if (lowerMessage.contains('email already exists') ||
          lowerMessage.contains('user already exists')) {
        return 'An account with this email already exists.';
      }
      if (lowerMessage.contains('invalid email')) {
        return 'Please enter a valid email address.';
      }
      if (lowerMessage.contains('password too short') ||
          lowerMessage.contains('password must be')) {
        return 'Password must be at least 6 characters long.';
      }
      if (lowerMessage.contains('token expired') ||
          lowerMessage.contains('session expired')) {
        return 'Your session has expired. Please log in again.';
      }
      if (lowerMessage.contains('unauthorized') ||
          lowerMessage.contains('not authorized')) {
        return 'You are not authorized to perform this action.';
      }
      if (lowerMessage.contains('validation')) {
        return 'Please check your input and try again.';
      }
    }

    // Fall back to status code mapping
    switch (statusCode) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Incorrect email or password. Please try again.';
      case 403:
        return 'You don\'t have permission to do this.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This action conflicts with existing data.';
      case 422:
        return 'Please check your input and try again.';
      case 429:
        return 'Too many requests. Please wait a moment.';
      case 500:
        return 'Server is busy. Please try again later.';
      case 502:
      case 503:
      case 504:
        return 'Server is temporarily unavailable. Please try again.';
      default:
        if (statusCode >= 500) {
          return 'Something went wrong on our end. Please try again.';
        }
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /// Creates a UserError from a connection/network issue
  factory UserError.connectionError([String? details]) {
    return UserError(
      statusCode: 0,
      rawMessage: details,
      customMessage:
          'Unable to connect. Please check your internet connection.',
    );
  }

  /// Creates a UserError from an unknown error
  factory UserError.unknown([String? details]) {
    return UserError(
      statusCode: -1,
      rawMessage: details,
      customMessage: 'Something went wrong. Please try again.',
    );
  }

  @override
  String toString() => friendlyMessage;
}

import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:bb_logistics/src/core/errors/user_error.dart';
import 'package:bb_logistics/src/features/auth/data/auth_repository.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  Future<void> _login() async {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isLoading = true;
      });

      try {
        final user = await ref
            .read(authRepositoryProvider.notifier)
            .login(_emailController.text, _passwordController.text);

        // Print user for debugging
        debugPrint('Logged in user: ${user.email}');

        if (mounted) {
          context.go('/home');
        }
      } catch (e) {
        if (mounted) {
          String errorMessage;
          if (e is UserError) {
            errorMessage = e.friendlyMessage;
          } else {
            errorMessage = 'An unexpected error occurred. Please try again.';
          }
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(errorMessage),
              backgroundColor: Colors.red.shade700,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          );
        }
      } finally {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 48),
                // Logo or branding
                Container(
                  alignment: Alignment.center,
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: const BoxDecoration(
                      color: AppTheme.primaryBlue,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.local_shipping,
                      size: 48,
                      color: AppTheme.primaryBlue,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Welcome Back!',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Sign in to your account',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 48),
                // Fields
                TextFormField(
                  controller: _emailController,
                  decoration: const InputDecoration(
                    labelText: 'Phone or Email',
                    prefixIcon: Icon(Icons.email_outlined),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your email or phone';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Password',
                    prefixIcon: Icon(Icons.lock_outline),
                    suffixIcon: Icon(Icons.visibility),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your password';
                    }
                    return null;
                  },
                ),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {},
                    child: const Text('Forgot Password?'),
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _isLoading ? null : _login,
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Login'),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text("Don't have an account?"),
                    TextButton(
                      onPressed: () => context.push('/signup'),
                      child: const Text('Create Account'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

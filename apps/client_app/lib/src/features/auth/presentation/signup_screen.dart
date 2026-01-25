import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:bb_logistics/src/features/auth/data/auth_repository.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _locationController = TextEditingController();
  final _countryController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _acceptTerms = false;
  String _countryCode = '+91';

  Future<void> _signup() async {
    if (_formKey.currentState!.validate()) {
      if (!_acceptTerms) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please accept the Terms & Privacy Policy'),
          ),
        );
        return;
      }

      setState(() {
        _isLoading = true;
      });

      try {
        await ref
            .read(authRepositoryProvider.notifier)
            .register(
              fullName: _nameController.text,
              email: _emailController.text,
              phone: '$_countryCode ${_phoneController.text}',
              country: _countryController.text,
              location: _locationController.text,
              password: _passwordController.text,
            );
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Account created!')));
          context.go('/home');
        }
      } catch (e) {
        if (mounted) {
          // Extract message if it's an exception with a message prefix
          String message = e.toString();
          if (message.startsWith('Exception: ')) {
            message = message.substring(11);
          }
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text('Signup failed: $message')));
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
      appBar: AppBar(
        title: const Text('Create Account'),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Join B&B International',
                  style: GoogleFonts.poppins(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Fill in your details to get started',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 32),
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Full Name',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                  validator: (value) =>
                      value == null || value.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _emailController,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    prefixIcon: Icon(Icons.email_outlined),
                  ),
                  validator: (value) =>
                      value == null || value.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    SizedBox(
                      width: 120,
                      child: DropdownButtonFormField<String>(
                        initialValue: _countryCode,
                        isExpanded: true,
                        decoration: const InputDecoration(
                          labelText: 'Code',
                          prefixIcon: Icon(Icons.public, size: 20),
                        ),
                        items: const [
                          DropdownMenuItem(
                            value: '+1',
                            child: Text(
                              '🇺🇸 +1',
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          DropdownMenuItem(
                            value: '+91',
                            child: Text(
                              '🇮🇳 +91',
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          DropdownMenuItem(
                            value: '+971',
                            child: Text(
                              '🇦🇪 +971',
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          DropdownMenuItem(
                            value: '+974',
                            child: Text(
                              '🇶🇦 +974',
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          DropdownMenuItem(
                            value: '+973',
                            child: Text(
                              '🇧🇭 +973',
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                        onChanged: (val) {
                          if (val != null) setState(() => _countryCode = val);
                        },
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextFormField(
                        controller: _phoneController,
                        decoration: const InputDecoration(
                          labelText: 'Mobile Number',
                          prefixIcon: Icon(Icons.phone_outlined),
                        ),
                        validator: (value) =>
                            value == null || value.isEmpty ? 'Required' : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _countryController,
                  decoration: const InputDecoration(
                    labelText: 'Country',
                    prefixIcon: Icon(Icons.public),
                  ),
                  validator: (value) =>
                      value == null || value.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Password',
                    prefixIcon: Icon(Icons.lock_outline),
                  ),
                  validator: (value) => value == null || value.length < 6
                      ? 'Min 6 characters'
                      : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _locationController,
                  decoration: const InputDecoration(
                    labelText: 'City / Location',
                    prefixIcon: Icon(Icons.location_on_outlined),
                  ),
                  validator: (value) =>
                      value == null || value.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Checkbox(
                      value: _acceptTerms,
                      activeColor: AppTheme.primaryBlue,
                      onChanged: (val) {
                        setState(() {
                          _acceptTerms = val ?? false;
                        });
                      },
                    ),
                    Expanded(
                      child: Text(
                        'I accept the Terms & Privacy Policy',
                        style: GoogleFonts.poppins(fontSize: 12),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _isLoading ? null : _signup,
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Create Account'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

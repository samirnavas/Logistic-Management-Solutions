import 'package:bb_logistics/src/features/auth/data/auth_repository.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:go_router/go_router.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeIn));

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.5),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));

    _controller.forward();

    _navigateToNext();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _navigateToNext() async {
    // Wait for animation + a little extra time
    await Future.delayed(const Duration(seconds: 3));
    if (!mounted) return;

    try {
      final user = await ref.read(authRepositoryProvider.future);
      if (!mounted) return;
      if (user != null) {
        context.go('/home');
      } else {
        context.go('/onboarding');
      }
    } catch (e) {
      if (!mounted) return;
      // In case of error, default to onboarding or login
      context.go('/onboarding');
    }
  }

  @override
  Widget build(BuildContext context) {
    // calculate screen height/width to ensure images fit well
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Top Left Smoke
          Positioned(
            top: size.height * 0.40,
            left: 0,
            child: SlideTransition(
              position: _slideAnimation,
              child: Image.asset(
                'assets/Splash smoke left.png',
                width: size.width * 0.6,
                fit: BoxFit.contain,
              ),
            ),
          ),

          // Top Right Smoke
          Positioned(
            top: 0,
            right: 0,
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: Image.asset(
                'assets/Splash smoke right.png',
                width: size.width * 0.6,
                fit: BoxFit.contain,
              ),
            ),
          ),

          // Bottom Illustration
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: SlideTransition(
              position: _slideAnimation,
              child: Image.asset(
                'assets/splash screen bottom.png',
                fit: BoxFit.cover,
              ),
            ),
          ),

          // Center Logo
          Center(
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: Padding(
                padding: const EdgeInsets.only(
                  bottom: 100.0,
                ), // Adjust to allow space for bottom image
                child: Image.asset(
                  'assets/B&B Logo.png',
                  width: size.width * 0.6,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

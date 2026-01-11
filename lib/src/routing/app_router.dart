import 'package:bb_logistics/src/core/widgets/scaffold_with_nav_bar.dart';
import 'package:bb_logistics/src/features/auth/data/mock_auth_repository.dart';
import 'package:bb_logistics/src/features/auth/presentation/login_screen.dart';
import 'package:bb_logistics/src/features/auth/presentation/onboarding_screen.dart';
import 'package:bb_logistics/src/features/auth/presentation/signup_screen.dart';
import 'package:bb_logistics/src/features/auth/presentation/splash_screen.dart';
import 'package:bb_logistics/src/features/home/presentation/home_screen.dart';
import 'package:bb_logistics/src/features/profile/presentation/profile_screen.dart';
import 'package:bb_logistics/src/features/quotation/presentation/quotation_screen.dart';
import 'package:bb_logistics/src/features/shipment/presentation/request_shipment_screen.dart';
import 'package:bb_logistics/src/features/shipment/presentation/shipment_list_screen.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'app_router.g.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

@riverpod
GoRouter goRouter(GoRouterRef ref) {
  // We do NOT watch the auth state here to avoid rebuilding the entire Router
  // which causes the app to restart at initialLocation.

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final path = state.uri.path;
      final isLoggedIn = ref.read(mockAuthRepositoryProvider);

      // Public pages
      if (path == '/splash' ||
          path == '/onboarding' ||
          path == '/login' ||
          path == '/signup') {
        return null;
      }

      // Protected pages
      if (!isLoggedIn) {
        return '/login';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
        path: '/signup',
        builder: (context, state) => const SignupScreen(),
      ),
      GoRoute(
        path: '/create-request',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const RequestShipmentScreen(),
      ),
      // Stateful Nested Shell Route for Bottom Nav
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return ScaffoldWithNavBar(navigationShell: navigationShell);
        },
        branches: [
          // Home Branch
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/home',
                builder: (context, state) => const HomeScreen(),
              ),
            ],
          ),
          // Quotation Branch
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/quotation',
                builder: (context, state) => const QuotationScreen(),
              ),
            ],
          ),
          // Shipment Branch
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/shipment',
                builder: (context, state) => const ShipmentListScreen(),
              ),
            ],
          ),
          // Profile Branch
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                builder: (context, state) => const ProfileScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
}

import 'package:bb_logistics/src/core/widgets/scaffold_with_nav_bar.dart';
import 'package:bb_logistics/src/features/auth/data/auth_repository.dart';
import 'package:bb_logistics/src/features/auth/presentation/login_screen.dart';
import 'package:bb_logistics/src/features/auth/presentation/onboarding_screen.dart';
import 'package:bb_logistics/src/features/auth/presentation/signup_screen.dart';
import 'package:bb_logistics/src/features/auth/presentation/splash_screen.dart';
import 'package:bb_logistics/src/features/home/presentation/home_screen.dart';
import 'package:bb_logistics/src/features/profile/presentation/profile_screen.dart';
import 'package:bb_logistics/src/features/quotation/presentation/add_address_screen.dart';
import 'package:bb_logistics/src/features/quotation/presentation/drafts_screen.dart';
import 'package:bb_logistics/src/features/quotation/presentation/quotation_detail_screen.dart';
import 'package:bb_logistics/src/features/quotation/presentation/quotation_screen.dart';
import 'package:bb_logistics/src/features/shipment/presentation/request_shipment_screen.dart';
import 'package:bb_logistics/src/features/shipment/presentation/shipment_list_screen.dart';
import 'package:bb_logistics/src/features/shipment/presentation/tracking_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'app_router.g.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

@riverpod
GoRouter goRouter(Ref ref) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final path = state.uri.path;
      final authState = ref.read(authRepositoryProvider);
      final user = authState.valueOrNull;
      final isLoggedIn = user != null;

      // Public pages - allow access without login
      if (path == '/splash' ||
          path == '/onboarding' ||
          path == '/login' ||
          path == '/signup') {
        return null;
      }

      // Protected pages - redirect to login if not authenticated
      if (!isLoggedIn) {
        return '/login';
      }

      // Redirect root to home if logged in
      if (isLoggedIn && path == '/') {
        return '/home';
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
        path: '/request-shipment',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const RequestShipmentScreen(),
      ),
      // Quotation Detail - Root level route for full-screen PDF viewing
      GoRoute(
        path: '/quotations/:id',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final quotationId = state.pathParameters['id']!;
          return QuotationDetailScreen(quotationId: quotationId);
        },
      ),
      // Add Address Screen
      GoRoute(
        path: '/quotations/:id/address',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final quotationId = state.pathParameters['id']!;
          return AddAddressScreen(quotationId: quotationId);
        },
      ),
      // Tracking Screen - Root level route for full-screen map view
      GoRoute(
        path: '/tracking/:shipmentId',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final shipmentId = state.pathParameters['shipmentId']!;
          return TrackingScreen(shipmentId: shipmentId);
        },
      ),
      // Drafts Screen - Root level route
      GoRoute(
        path: '/drafts',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const DraftsScreen(),
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

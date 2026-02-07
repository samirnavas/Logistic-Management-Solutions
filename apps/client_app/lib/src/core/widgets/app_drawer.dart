import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:bb_logistics/src/features/auth/data/auth_repository.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:flutter/services.dart';

class AppDrawer extends ConsumerWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userState = ref.watch(authRepositoryProvider);
    final user = userState.value;

    return Drawer(
      child: Column(
        children: [
          // Header
          UserAccountsDrawerHeader(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [AppTheme.gradientLightBlue, AppTheme.gradientDarkBlue],
              ),
            ),
            accountName: Text(
              user?.fullName ?? 'Guest User',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            accountEmail: Text(user?.email ?? 'guest@example.com'),
            currentAccountPicture: CircleAvatar(
              backgroundColor: Colors.white,
              child: Text(
                (user?.fullName ?? 'G').substring(0, 1).toUpperCase(),
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primaryBlue,
                ),
              ),
            ),
          ),

          // Menu Items
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                ListTile(
                  leading: const Icon(Icons.dashboard_outlined),
                  title: const Text('Home'),
                  onTap: () {
                    HapticFeedback.lightImpact();
                    context.pop(); // Close drawer
                    context.go('/home');
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.add_box_outlined),
                  title: const Text('New Shipment'),
                  onTap: () {
                    HapticFeedback.lightImpact();
                    context.pop();
                    context.push('/request-shipment');
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.drafts_outlined),
                  title: const Text('Saved Drafts'),
                  onTap: () {
                    HapticFeedback.lightImpact();
                    context.pop();
                    context.push('/drafts');
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.location_searching),
                  title: const Text('Track Shipment'),
                  onTap: () {
                    HapticFeedback.lightImpact();
                    context.pop();
                    context.go('/shipment');
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.request_quote_outlined),
                  title: const Text('Quotations'),
                  onTap: () {
                    HapticFeedback.lightImpact();
                    context.pop();
                    context.go('/quotation');
                  },
                ),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.person_outline),
                  title: const Text('Profile'),
                  onTap: () {
                    HapticFeedback.lightImpact();
                    context.pop();
                    context.go('/profile');
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.support_agent),
                  title: const Text('Support'),
                  onTap: () {
                    HapticFeedback.lightImpact();
                    context.pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Contacting Support...')),
                    );
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.logout, color: Colors.red),
                  title: const Text(
                    'Logout',
                    style: TextStyle(color: Colors.red),
                  ),
                  onTap: () {
                    HapticFeedback.lightImpact();
                    context.pop();
                    ref.read(authRepositoryProvider.notifier).signOut();
                  },
                ),
              ],
            ),
          ),

          // Footer
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              'B&B Logistics v1.0.0',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
        ],
      ),
    );
  }
}

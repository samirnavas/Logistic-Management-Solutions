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

    // Get current path for active state highlighting
    final String currentPath = GoRouterState.of(context).uri.path;

    return Drawer(
      backgroundColor: AppTheme.surface,
      elevation: 0,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.horizontal(right: Radius.circular(16)),
      ),
      child: Column(
        children: [
          // Header
          UserAccountsDrawerHeader(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [AppTheme.gradientLightBlue, AppTheme.gradientDarkBlue],
              ),
            ),
            accountName: Text(
              user?.fullName ?? 'Guest User',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            accountEmail: Text(
              user?.email ?? 'guest@example.com',
              style: const TextStyle(color: Colors.white70),
            ),
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
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              children: [
                _buildDrawerItem(
                  context: context,
                  icon: Icons.dashboard_outlined,
                  title: 'Home',
                  path: '/home',
                  currentPath: currentPath,
                ),
                _buildDrawerItem(
                  context: context,
                  icon: Icons.add_box_outlined,
                  title: 'New Shipment',
                  path: '/request-shipment',
                  currentPath: currentPath,
                  isPush: true,
                ),
                _buildDrawerItem(
                  context: context,
                  icon: Icons.drafts_outlined,
                  title: 'Saved Drafts',
                  path: '/drafts',
                  currentPath: currentPath,
                  isPush: true,
                ),
                _buildDrawerItem(
                  context: context,
                  icon: Icons.location_searching,
                  title: 'Track Shipment',
                  path: '/shipment',
                  currentPath: currentPath,
                ),
                _buildDrawerItem(
                  context: context,
                  icon: Icons.request_quote_outlined,
                  title: 'Quotations',
                  path: '/quotation',
                  currentPath: currentPath,
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 8.0, horizontal: 12),
                  child: Divider(color: Color(0xFFE2E8F0)),
                ),
                _buildDrawerItem(
                  context: context,
                  icon: Icons.person_outline,
                  title: 'Profile',
                  path: '/profile',
                  currentPath: currentPath,
                ),
                ListTile(
                  leading: const Icon(
                    Icons.support_agent,
                    color: AppTheme.textGrey,
                  ),
                  title: const Text(
                    'Support',
                    style: TextStyle(
                      color: AppTheme.textDark,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  onTap: () {
                    HapticFeedback.lightImpact();
                    context.pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Contacting Support...'),
                        backgroundColor: AppTheme.primaryBlue,
                      ),
                    );
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.logout, color: AppTheme.error),
                  title: const Text(
                    'Logout',
                    style: TextStyle(
                      color: AppTheme.error,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
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
            padding: const EdgeInsets.all(24.0),
            child: Text(
              'B&B Logistics v1.0.0',
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: AppTheme.textGrey),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDrawerItem({
    required BuildContext context,
    required IconData icon,
    required String title,
    required String path,
    required String currentPath,
    bool isPush = false,
  }) {
    final bool isActive = currentPath.startsWith(path);

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color: isActive
            ? AppTheme.primaryBlue.withValues(alpha: 0.1)
            : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        leading: Icon(
          icon,
          color: isActive ? AppTheme.primaryBlue : AppTheme.textGrey,
        ),
        title: Text(
          title,
          style: TextStyle(
            color: isActive ? AppTheme.primaryBlue : AppTheme.textDark,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
          ),
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        onTap: () {
          HapticFeedback.lightImpact();
          context.pop(); // Close drawer
          if (isPush) {
            context.push(path);
          } else {
            context.go(path);
          }
        },
      ),
    );
  }
}

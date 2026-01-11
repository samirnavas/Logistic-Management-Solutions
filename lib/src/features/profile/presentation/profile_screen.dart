import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:bb_logistics/src/core/widgets/blue_background_scaffold.dart';
import 'package:flutter/material.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlueBackgroundScaffold(
      body: Stack(
        children: [
          // 1. Custom App Bar
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const SizedBox(), // Spacer for alignment if no left icon
                    Text(
                      'Profile',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Colors.white,
                        fontSize: 20,
                      ),
                    ),
                    Container(
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white,
                      ),
                      child: IconButton(
                        icon: const Icon(
                          Icons.notifications_none_outlined,
                          color: AppTheme.primaryBlue,
                        ),
                        onPressed: () {},
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // 2. Scrollable Content
          Positioned.fill(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  SizedBox(height: MediaQuery.of(context).padding.top + 70),
                  Container(
                    width: double.infinity,
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(30),
                        topRight: Radius.circular(30),
                      ),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 30,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Center(
                          child: Column(
                            children: [
                              const CircleAvatar(
                                radius: 50,
                                backgroundColor: Color(0xFFE1F5FE),
                                child: Icon(
                                  Icons.person,
                                  size: 50,
                                  color: Color(0xFF0288D1),
                                ),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'Your Name',
                                style: Theme.of(
                                  context,
                                ).textTheme.displayMedium,
                              ),
                              Text(
                                'user@example.com',
                                style: Theme.of(context).textTheme.bodyMedium
                                    ?.copyWith(color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 30),
                        // Placeholder for profile options
                        ListTile(
                          leading: const Icon(Icons.settings_outlined),
                          title: Text(
                            'Settings',
                            style: Theme.of(context).textTheme.bodyLarge,
                          ),
                          trailing: const Icon(Icons.chevron_right),
                        ),
                        ListTile(
                          leading: const Icon(Icons.help_outline),
                          title: Text(
                            'Help & Support',
                            style: Theme.of(context).textTheme.bodyLarge,
                          ),
                          trailing: const Icon(Icons.chevron_right),
                        ),
                        ListTile(
                          leading: const Icon(Icons.logout, color: Colors.red),
                          title: Text(
                            'Logout',
                            style: Theme.of(
                              context,
                            ).textTheme.bodyLarge?.copyWith(color: Colors.red),
                          ),
                        ),
                        const SizedBox(height: 100),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

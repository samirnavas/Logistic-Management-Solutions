import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:bb_logistics/src/core/widgets/blue_background_scaffold.dart';
import 'package:flutter/material.dart';

class ShipmentListScreen extends StatelessWidget {
  const ShipmentListScreen({super.key});

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
                    // Menu Icon
                    IconButton(
                      icon: const Icon(
                        Icons.menu,
                        color: Colors.white,
                        size: 28,
                      ),
                      onPressed: () {
                        // Scaffold.of(context).openDrawer(); // If drawer exists
                      },
                    ),
                    Text(
                      'Shipments',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Colors.white,
                        fontSize: 20,
                      ),
                    ),
                    // Notification Icon
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
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Placeholder Empty State
                        Center(
                          child: Padding(
                            padding: const EdgeInsets.only(top: 50),
                            child: Column(
                              children: [
                                Icon(
                                  Icons.local_shipping_outlined,
                                  size: 80,
                                  color: Colors.grey[300],
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'No shipments found',
                                  style: Theme.of(context).textTheme.bodyLarge
                                      ?.copyWith(color: Colors.grey[500]),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 400), // Filler space
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

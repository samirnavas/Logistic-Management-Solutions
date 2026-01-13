import 'package:flutter/material.dart';
import 'package:bb_logistics/src/core/theme/theme.dart';

class BlueBackgroundScaffold extends StatelessWidget {
  final Widget body;
  final Widget? bottomNavigationBar;
  final Widget? floatingActionButton;
  final PreferredSizeWidget? appBar;
  final bool extendBodyBehindAppBar;

  const BlueBackgroundScaffold({
    super.key,
    required this.body,
    this.bottomNavigationBar,
    this.floatingActionButton,
    this.appBar,
    this.extendBodyBehindAppBar = false,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      bottomNavigationBar: bottomNavigationBar,
      floatingActionButton: floatingActionButton,
      extendBodyBehindAppBar: extendBodyBehindAppBar,
      appBar: appBar,
      body: Stack(
        children: [
          // 1. Fixed Blue Header Gradient
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 280,
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    AppTheme.gradientLightBlue,
                    AppTheme.gradientDarkBlue,
                  ],
                ),
              ),
            ),
          ),
          // 2. The Page Content
          Positioned.fill(child: body),
        ],
      ),
    );
  }
}

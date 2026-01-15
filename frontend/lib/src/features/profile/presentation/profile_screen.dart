import 'dart:io';

import 'package:bb_logistics/src/core/api/upload_service.dart';
import 'package:bb_logistics/src/core/providers/settings_provider.dart';
import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:bb_logistics/src/core/widgets/blue_background_scaffold.dart';
import 'package:bb_logistics/src/features/auth/data/auth_repository.dart';
import 'package:bb_logistics/src/features/auth/domain/user.dart';
import 'package:bb_logistics/src/features/profile/presentation/saved_addresses_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Watch User Data
    final authState = ref.watch(authRepositoryProvider);
    final user = authState.valueOrNull;

    // Watch Settings
    final settings = ref.watch(settingsProvider);
    final isDarkMode = settings.isDarkMode;
    final notificationsEnabled = settings.notificationsEnabled;

    return BlueBackgroundScaffold(
      body: Stack(
        children: [
          // 1. Scrollable Content (FIRST in stack - at bottom)
          Positioned.fill(
            child: RefreshIndicator(
              onRefresh: () async {
                HapticFeedback.lightImpact();
                // ignore: unused_result
                await ref.refresh(authRepositoryProvider.future);
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  children: [
                    SizedBox(height: MediaQuery.of(context).padding.top + 70),
                    Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: isDarkMode ? AppTheme.darkSurface : Colors.white,
                        borderRadius: const BorderRadius.only(
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
                          _ProfileHeader(user: user),
                          const SizedBox(height: 30),

                          // Account Section
                          _ProfileMenu(
                            title: 'Account',
                            tiles: [
                              ListTile(
                                leading: const Icon(Icons.person_outline),
                                title: const Text('Edit Profile'),
                                trailing: const Icon(Icons.chevron_right),
                                onTap: () {
                                  HapticFeedback.lightImpact();
                                  if (user != null) {
                                    showModalBottomSheet(
                                      context: context,
                                      isScrollControlled: true,
                                      shape: const RoundedRectangleBorder(
                                        borderRadius: BorderRadius.vertical(
                                          top: Radius.circular(20),
                                        ),
                                      ),
                                      builder: (context) =>
                                          _EditProfileSheet(user: user),
                                    );
                                  }
                                },
                              ),
                              ListTile(
                                leading: const Icon(Icons.location_on_outlined),
                                title: const Text('Saved Addresses'),
                                trailing: const Icon(Icons.chevron_right),
                                onTap: () {
                                  HapticFeedback.lightImpact();
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (context) =>
                                          const SavedAddressesScreen(),
                                    ),
                                  );
                                },
                              ),
                              ListTile(
                                leading: const Icon(Icons.lock_outline),
                                title: const Text('Change Password'),
                                trailing: const Icon(Icons.chevron_right),
                                onTap: () {
                                  HapticFeedback.lightImpact();
                                },
                              ),
                            ],
                          ),

                          // Settings Section
                          _ProfileMenu(
                            title: 'Settings',
                            tiles: [
                              ListTile(
                                leading: const Icon(
                                  Icons.notifications_outlined,
                                ),
                                title: const Text('Notifications'),
                                trailing: Switch(
                                  value: notificationsEnabled,
                                  onChanged: (val) {
                                    HapticFeedback.lightImpact();
                                    ref
                                        .read(settingsProvider)
                                        .toggleNotifications(val);
                                  },
                                  activeTrackColor: AppTheme.primaryBlue
                                      .withValues(alpha: 0.5),
                                  activeThumbColor: AppTheme.primaryBlue,
                                ),
                              ),
                              ListTile(
                                leading: const Icon(Icons.language_outlined),
                                title: const Text('Language'),
                                trailing: const Icon(Icons.chevron_right),
                                onTap: () {
                                  HapticFeedback.lightImpact();
                                },
                              ),
                              ListTile(
                                leading: const Icon(Icons.dark_mode_outlined),
                                title: const Text('Dark Mode'),
                                trailing: Switch(
                                  value: isDarkMode,
                                  onChanged: (val) {
                                    HapticFeedback.lightImpact();
                                    ref
                                        .read(settingsProvider)
                                        .toggleDarkMode(val);
                                  },
                                  activeTrackColor: AppTheme.primaryBlue
                                      .withValues(alpha: 0.5),
                                  activeThumbColor: AppTheme.primaryBlue,
                                ),
                              ),
                            ],
                          ),

                          // Support Section
                          _ProfileMenu(
                            title: 'Support',
                            tiles: [
                              ListTile(
                                leading: const Icon(Icons.help_outline),
                                title: const Text('Help Center'),
                                trailing: const Icon(Icons.chevron_right),
                                onTap: () {
                                  HapticFeedback.lightImpact();
                                },
                              ),
                              ListTile(
                                leading: const Icon(Icons.privacy_tip_outlined),
                                title: const Text('Privacy Policy'),
                                trailing: const Icon(Icons.chevron_right),
                                onTap: () {
                                  HapticFeedback.lightImpact();
                                },
                              ),
                              ListTile(
                                leading: const Icon(Icons.description_outlined),
                                title: const Text('Terms & Conditions'),
                                trailing: const Icon(Icons.chevron_right),
                                onTap: () {
                                  HapticFeedback.lightImpact();
                                },
                              ),
                            ],
                          ),

                          const SizedBox(height: 20),

                          // Logout Button
                          ListTile(
                                leading: const Icon(
                                  Icons.logout,
                                  color: Colors.red,
                                ),
                                title: Text(
                                  'Logout',
                                  style: Theme.of(context).textTheme.bodyLarge
                                      ?.copyWith(color: Colors.red),
                                ),
                                onTap: () {
                                  HapticFeedback.lightImpact();
                                  showDialog(
                                    context: context,
                                    builder: (context) => AlertDialog(
                                      title: const Text('Logout'),
                                      content: const Text(
                                        'Are you sure you want to logout?',
                                      ),
                                      actions: [
                                        TextButton(
                                          onPressed: () =>
                                              Navigator.pop(context),
                                          child: const Text('Cancel'),
                                        ),
                                        TextButton(
                                          onPressed: () {
                                            Navigator.pop(
                                              context,
                                            ); // Close dialog
                                            ref
                                                .read(
                                                  authRepositoryProvider
                                                      .notifier,
                                                )
                                                .signOut();
                                            context.go('/login');
                                          },
                                          style: TextButton.styleFrom(
                                            foregroundColor: Colors.red,
                                          ),
                                          child: const Text('Logout'),
                                        ),
                                      ],
                                    ),
                                  );
                                },
                              )
                              .animate()
                              .fadeIn(delay: 600.ms)
                              .slideX(begin: 0.1, end: 0),

                          const SizedBox(height: 24),
                          Center(
                            child: Text(
                              'Version 1.0.0',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: Colors.grey[400]),
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
          ),

          // 2. Custom App Bar (LAST in stack - on top for touch events)
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
                        onPressed: () {
                          HapticFeedback.lightImpact();
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileHeader extends ConsumerStatefulWidget {
  const _ProfileHeader({this.user});

  final User? user;

  @override
  ConsumerState<_ProfileHeader> createState() => _ProfileHeaderState();
}

class _ProfileHeaderState extends ConsumerState<_ProfileHeader> {
  final ImagePicker _picker = ImagePicker();
  final UploadService _uploadService = UploadService();
  bool _isUploading = false;

  Future<void> _pickAndUploadImage(ImageSource source) async {
    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: source,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );

      if (pickedFile == null) return;

      setState(() => _isUploading = true);
      HapticFeedback.mediumImpact();

      final file = File(pickedFile.path);
      await _uploadService.uploadAvatar(widget.user!.id, file);

      // Update the user state with new avatar URL
      await ref.read(authRepositoryProvider.notifier).refreshUser();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Profile picture updated!'),
            backgroundColor: AppTheme.success,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Failed to upload: ${e.toString().replaceAll('Exception:', '').trim()}',
            ),
            backgroundColor: AppTheme.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  void _showImageSourceDialog() {
    HapticFeedback.lightImpact();
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Change Profile Picture',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 20),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.camera_alt,
                    color: AppTheme.primaryBlue,
                  ),
                ),
                title: const Text('Take Photo'),
                subtitle: const Text('Use your camera'),
                onTap: () {
                  Navigator.pop(context);
                  _pickAndUploadImage(ImageSource.camera);
                },
              ),
              const SizedBox(height: 8),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.photo_library,
                    color: AppTheme.primaryBlue,
                  ),
                ),
                title: const Text('Choose from Gallery'),
                subtitle: const Text('Select an existing photo'),
                onTap: () {
                  Navigator.pop(context);
                  _pickAndUploadImage(ImageSource.gallery);
                },
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.user;

    return Center(
      child: Column(
        children: [
          // Profile Avatar with Edit Button
          Stack(
            children: [
              // Avatar
              GestureDetector(
                onTap: user != null ? _showImageSourceDialog : null,
                child: Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primaryBlue.withValues(alpha: 0.2),
                        blurRadius: 15,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: CircleAvatar(
                    radius: 50,
                    backgroundColor: const Color(0xFFE1F5FE),
                    backgroundImage: user?.avatarUrl.isNotEmpty == true
                        ? NetworkImage(user!.avatarUrl)
                        : null,
                    child: _isUploading
                        ? const CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              AppTheme.primaryBlue,
                            ),
                          )
                        : (user?.avatarUrl.isEmpty ?? true)
                        ? const Icon(
                            Icons.person,
                            size: 50,
                            color: Color(0xFF0288D1),
                          )
                        : null,
                  ),
                ),
              ).animate().scale(
                delay: 100.ms,
                duration: 400.ms,
                curve: Curves.easeOutBack,
              ),
              // Edit Button
              if (user != null)
                Positioned(
                  right: 0,
                  bottom: 0,
                  child:
                      GestureDetector(
                        onTap: _showImageSourceDialog,
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryBlue,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.2),
                                blurRadius: 5,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.camera_alt,
                            size: 16,
                            color: Colors.white,
                          ),
                        ),
                      ).animate().scale(
                        delay: 300.ms,
                        duration: 300.ms,
                        curve: Curves.easeOutBack,
                      ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            user?.fullName ?? 'Guest User',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ).animate().fadeIn(delay: 200.ms),
          Text(
            user?.email ?? 'Sign in to see profile',
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: Colors.grey),
          ).animate().fadeIn(delay: 300.ms),
          if (user != null) ...[
            const SizedBox(height: 12),
            // Phone and Location Row
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (user.phone.isNotEmpty) ...[
                  const Icon(Icons.phone, size: 14, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    user.phone,
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall?.copyWith(color: Colors.grey),
                  ),
                  const SizedBox(width: 12),
                ],
                if (user.country.isNotEmpty) ...[
                  const Icon(Icons.location_on, size: 14, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    user.country,
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall?.copyWith(color: Colors.grey),
                  ),
                ],
              ],
            ).animate().fadeIn(delay: 400.ms),

            const SizedBox(height: 12),
            // Customer Code Chip
            GestureDetector(
              onTap: () {
                HapticFeedback.mediumImpact();
                Clipboard.setData(ClipboardData(text: user.customerCode));
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: const Text('Customer Code copied'),
                    behavior: SnackBarBehavior.floating,
                    backgroundColor: AppTheme.primaryBlue,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                );
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: AppTheme.primaryBlue.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Code: ${user.customerCode}',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.primaryBlue,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Icon(
                      Icons.copy,
                      size: 16,
                      color: AppTheme.primaryBlue,
                    ),
                  ],
                ),
              ),
            ).animate().scale(delay: 500.ms, curve: Curves.easeOutBack),
          ],
        ],
      ),
    );
  }
}

class _ProfileMenu extends StatelessWidget {
  const _ProfileMenu({required this.title, required this.tiles});

  final String title;
  final List<Widget> tiles;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Text(
            title,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
              color: AppTheme.textGrey,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        Column(children: tiles),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _EditProfileSheet extends ConsumerStatefulWidget {
  final User user;

  const _EditProfileSheet({required this.user});

  @override
  ConsumerState<_EditProfileSheet> createState() => _EditProfileSheetState();
}

class _EditProfileSheetState extends ConsumerState<_EditProfileSheet> {
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _countryController;
  late TextEditingController _locationController;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.user.fullName);
    _phoneController = TextEditingController(text: widget.user.phone);
    _countryController = TextEditingController(text: widget.user.country);
    _locationController = TextEditingController(text: widget.user.location);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _countryController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 20,
        right: 20,
        top: 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Edit Profile',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () {
                  HapticFeedback.lightImpact();
                  Navigator.pop(context);
                },
              ),
            ],
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(
              labelText: 'Full Name',
              prefixIcon: Icon(Icons.person_outline),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              labelText: 'Phone',
              prefixIcon: Icon(Icons.phone_outlined),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _countryController,
            decoration: const InputDecoration(
              labelText: 'Country',
              prefixIcon: Icon(Icons.public),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _locationController,
            decoration: const InputDecoration(
              labelText: 'Location/Address',
              prefixIcon: Icon(Icons.location_on_outlined),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isLoading
                  ? null
                  : () async {
                      HapticFeedback.mediumImpact();
                      setState(() => _isLoading = true);

                      try {
                        await ref
                            .read(authRepositoryProvider.notifier)
                            .updateProfile(
                              fullName: _nameController.text.trim(),
                              phone: _phoneController.text.trim(),
                              country: _countryController.text.trim(),
                              location: _locationController.text.trim(),
                            );

                        if (mounted && context.mounted) {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Profile updated successfully'),
                              backgroundColor: AppTheme.success,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                      } catch (e) {
                        if (mounted && context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                'Failed to update: ${e.toString().replaceAll('Exception:', '').trim()}',
                              ),
                              backgroundColor: AppTheme.error,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                      } finally {
                        if (mounted) setState(() => _isLoading = false);
                      }
                    },
              child: _isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : const Text('Save Changes'),
            ),
          ),
          const SizedBox(height: 30),
        ],
      ),
    );
  }
}

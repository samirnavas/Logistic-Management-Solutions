import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:bb_logistics/src/features/shipment/data/mock_shipment_repository.dart';
import 'package:bb_logistics/src/features/shipment/domain/shipment.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';

class TrackingScreen extends ConsumerStatefulWidget {
  final String shipmentId;

  const TrackingScreen({super.key, required this.shipmentId});

  @override
  ConsumerState<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends ConsumerState<TrackingScreen> {
  /// Controller for programmatic control of the draggable sheet
  final DraggableScrollableController _sheetController =
      DraggableScrollableController();

  // Mock coordinates for demonstration (Diriyah, Riyadh area)
  final LatLng _currentLocation = const LatLng(24.7136, 46.6753);
  final LatLng _vehicleLocation = const LatLng(24.7090, 46.6680);

  @override
  void dispose() {
    _sheetController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final shipmentsAsync = ref.watch(shipmentListProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF1A1A2E),
      body: shipmentsAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppTheme.primaryBlue),
        ),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 60, color: Colors.red[300]),
              const SizedBox(height: 16),
              Text(
                'Failed to load shipment',
                style: Theme.of(
                  context,
                ).textTheme.bodyLarge?.copyWith(color: Colors.white70),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => context.pop(),
                child: const Text('Go Back'),
              ),
            ],
          ),
        ),
        data: (shipments) {
          // Find the shipment by tracking number
          final shipment = shipments.firstWhere(
            (s) => s.trackingNumber == widget.shipmentId,
            orElse: () => shipments.first,
          );

          // Stack: Map as background, DraggableSheet as foreground
          return Stack(
            children: [
              // Background: Map Layer
              _buildMap(),

              // App Bar (above map)
              _buildAppBar(context),

              // Foreground: Draggable Panel
              _buildPanel(context, shipment),
            ],
          );
        },
      ),
    );
  }

  /// Builds the OpenStreetMap layer with markers
  Widget _buildMap() {
    return FlutterMap(
      options: MapOptions(
        initialCenter: _currentLocation,
        initialZoom: 14,
        interactionOptions: const InteractionOptions(
          flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
        ),
      ),
      children: [
        // OpenStreetMap Tiles (Light/Greyscale style from CartoDB)
        TileLayer(
          urlTemplate:
              'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          subdomains: const ['a', 'b', 'c', 'd'],
          userAgentPackageName: 'com.bb.logistics',
        ),

        // Markers Layer
        MarkerLayer(
          markers: [
            // Destination Marker (Blue Dot with pulse effect)
            Marker(
              point: _currentLocation,
              width: 24,
              height: 24,
              child: Container(
                decoration: BoxDecoration(
                  color: AppTheme.primaryBlue,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 3),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primaryBlue.withValues(alpha: 0.4),
                      blurRadius: 8,
                      spreadRadius: 2,
                    ),
                  ],
                ),
              ),
            ),

            // Vehicle Marker (Black Circle with Navigation Arrow)
            Marker(
              point: _vehicleLocation,
              width: 48,
              height: 48,
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF1A1A2E),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.navigation,
                  color: Colors.white,
                  size: 24,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  /// Builds the floating app bar with back button
  Widget _buildAppBar(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Row(
          children: [
            // Back Button
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: IconButton(
                icon: const Icon(
                  Icons.chevron_left,
                  color: Color(0xFF1A1A2E),
                  size: 28,
                ),
                onPressed: () => context.pop(),
              ),
            ),
            const SizedBox(width: 16),
            Text(
              'Location Tracking',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: const Color(0xFF1A1A2E),
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Builds the draggable scrollable panel with shipment details
  Widget _buildPanel(BuildContext context, Shipment shipment) {
    return DraggableScrollableSheet(
      controller: _sheetController,
      // Snap sizes: Collapsed (20%), Half-Open (50%), Fully Open (90%)
      initialChildSize: 0.5,
      minChildSize: 0.2,
      maxChildSize: 0.9,
      snap: true,
      snapSizes: const [0.2, 0.5, 0.9],
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: const Color(0xFF1A1A2E),
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.3),
                blurRadius: 20,
                offset: const Offset(0, -5),
              ),
            ],
          ),
          child: ListView(
            controller: scrollController,
            // CRITICAL: ClampingScrollPhysics for seamless drag transfer
            physics: const ClampingScrollPhysics(),
            padding: EdgeInsets.zero,
            children: [
              // Drag Handle (Pill/Grabber)
              _buildDragHandle(),

              // Panel Content
              Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: MediaQuery.of(context).size.width < 380 ? 16 : 24,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header: Booking ID & Status
                    _buildHeaderSection(shipment),

                    const SizedBox(height: 20),

                    // Progress Indicator
                    _buildProgressIndicator(shipment),

                    const SizedBox(height: 24),

                    // Date & Location Row
                    _buildDateLocationRow(shipment),

                    const SizedBox(height: 20),

                    // Divider
                    Container(
                      height: 1,
                      color: Colors.white.withValues(alpha: 0.1),
                    ),

                    const SizedBox(height: 20),

                    // From/To Row
                    _buildFromToRow(shipment),

                    const SizedBox(height: 20),

                    // Customer & Order Cost Row
                    _buildCustomerOrderRow(),

                    const SizedBox(height: 20),

                    // Quantity & Weight Row
                    _buildQuantityWeightRow(),

                    // Extra padding at bottom for safe area
                    SizedBox(
                      height: MediaQuery.of(context).padding.bottom + 40,
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  /// Drag handle pill at the top center of the panel
  Widget _buildDragHandle() {
    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 16),
        width: 48,
        height: 5,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(3),
        ),
      ),
    );
  }

  /// Header section with Booking ID and Status badge
  Widget _buildHeaderSection(Shipment shipment) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Booking ID
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Booking ID',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.6),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '#${shipment.trackingNumber.replaceAll('TRK-', 'RQ')}',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: const Color(0xFF4FC3F7),
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),

        // Status Badge
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              'Status',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.6),
              ),
            ),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
              ),
              child: Text(
                shipment.status == 'In Transit' ? 'Transit' : shipment.status,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  /// Progress indicator with dots and dashed lines
  Widget _buildProgressIndicator(Shipment shipment) {
    // Determine progress step based on status
    int currentStep;
    switch (shipment.statusEnum) {
      case ShipmentStatus.processing:
        currentStep = 0;
        break;
      case ShipmentStatus.pickedUp:
        currentStep = 1;
        break;
      case ShipmentStatus.inTransit:
      case ShipmentStatus.customs:
      case ShipmentStatus.customsCleared:
      case ShipmentStatus.arrivedAtHub:
        currentStep = 2;
        break;
      case ShipmentStatus.outForDelivery:
        currentStep = 3;
        break;
      case ShipmentStatus.delivered:
        currentStep = 4;
        break;
      case ShipmentStatus.exception:
      case ShipmentStatus.returned:
      case ShipmentStatus.cancelled:
        currentStep = 2; // Show mid-progress for exceptions
        break;
    }

    return Row(
      children: List.generate(5, (index) {
        final isActive = index <= currentStep;
        final isLast = index == 4;

        return Expanded(
          child: Row(
            children: [
              // Circle
              Container(
                width: 16,
                height: 16,
                decoration: BoxDecoration(
                  color: isActive
                      ? const Color(0xFF4FC3F7)
                      : Colors.transparent,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isActive
                        ? const Color(0xFF4FC3F7)
                        : Colors.white.withValues(alpha: 0.3),
                    width: 2,
                  ),
                ),
              ),
              // Dashed Line (except for last)
              if (!isLast)
                Expanded(
                  child: Container(
                    height: 2,
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    child: CustomPaint(
                      painter: _DashedLinePainter(
                        color: isActive && index < currentStep
                            ? const Color(0xFF4FC3F7)
                            : Colors.white.withValues(alpha: 0.3),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        );
      }),
    );
  }

  /// Row showing created and estimated dates with locations
  Widget _buildDateLocationRow(Shipment shipment) {
    final createdDate = DateTime.now().subtract(const Duration(days: 2));
    final estimatedDate = shipment.estimatedDelivery;

    return Row(
      children: [
        // Created
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Created ${_formatDate(createdDate)}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.6),
                  fontSize: 11,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                shipment.origin.split(',').first,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),

        // Estimated
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'Estimated ${_formatDate(estimatedDate)}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.6),
                  fontSize: 11,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                shipment.destination.split(',').first,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  /// Row showing from and to locations
  Widget _buildFromToRow(Shipment shipment) {
    return Row(
      children: [
        // From
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'From',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.6),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                shipment.origin,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),

        // To
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'To',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.6),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                shipment.destination,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  /// Row showing customer name and order cost
  Widget _buildCustomerOrderRow() {
    return Row(
      children: [
        // Customer
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Customer',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.6),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'John Mathew',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),

        // Order Cost
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'Order Cost',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.6),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '\$120.00',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  /// Row showing quantity and weight
  Widget _buildQuantityWeightRow() {
    return Row(
      children: [
        // Quantity
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Quantity',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.6),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '1 Box',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),

        // Weight
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'Weight',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.6),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '10 Kg',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  /// Formats a date as "DD Mon YYYY"
  String _formatDate(DateTime date) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }
}

/// Custom painter for dashed lines in the progress indicator
class _DashedLinePainter extends CustomPainter {
  final Color color;

  _DashedLinePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round;

    const dashWidth = 6.0;
    const dashSpace = 4.0;
    double startX = 0;

    while (startX < size.width) {
      canvas.drawLine(
        Offset(startX, size.height / 2),
        Offset(startX + dashWidth, size.height / 2),
        paint,
      );
      startX += dashWidth + dashSpace;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

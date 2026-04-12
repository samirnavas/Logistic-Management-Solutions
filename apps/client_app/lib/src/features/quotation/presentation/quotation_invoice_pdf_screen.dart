import 'dart:io';

import 'package:bb_logistics/src/core/theme/theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_pdfview/flutter_pdfview.dart';
import 'package:open_file/open_file.dart';
import 'package:printing/printing.dart';

/// Full-screen viewer for a locally saved quotation invoice PDF.
class QuotationInvoicePdfScreen extends StatefulWidget {
  final String filePath;
  final String title;

  /// Suggested filename when saving or sharing (e.g. `B&B_Quotation_QT-....pdf`).
  final String fileName;

  const QuotationInvoicePdfScreen({
    super.key,
    required this.filePath,
    this.title = 'Quotation invoice',
    this.fileName = 'quotation_invoice.pdf',
  });

  @override
  State<QuotationInvoicePdfScreen> createState() =>
      _QuotationInvoicePdfScreenState();
}

class _QuotationInvoicePdfScreenState extends State<QuotationInvoicePdfScreen> {
  int _pages = 0;

  Future<void> _saveOrSharePdf() async {
    final file = File(widget.filePath);
    if (!await file.exists()) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('PDF file is no longer available.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final bytes = await file.readAsBytes();

    try {
      await Printing.sharePdf(bytes: bytes, filename: widget.fileName);
    } on MissingPluginException catch (_) {
      // Hot reload does not register new plugins — open with the default PDF app instead.
      await _openExternally(
        notifyIfFail: true,
        extraHint: 'Restart the app with a full rebuild (stop → flutter run) to enable sharing.',
      );
    } catch (e) {
      if (!mounted) return;
      await _openExternally(priorError: e);
    }
  }

  Future<void> _openExternally({
    Object? priorError,
    bool notifyIfFail = false,
    String? extraHint,
  }) async {
    final result = await OpenFile.open(
      widget.filePath,
      type: 'application/pdf',
    );
    if (!mounted) return;
    if (result.type != ResultType.done) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            [
              if (priorError != null) '$priorError ',
              result.message,
              if (extraHint != null) extraHint,
              if (priorError == null && extraHint == null)
                'Fully stop the app and run it again (do not use hot reload) after package changes.',
            ].where((s) => s.trim().isNotEmpty).join(' '),
          ),
          backgroundColor: Colors.red.shade800,
          duration: const Duration(seconds: 8),
        ),
      );
    } else if (notifyIfFail) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            [
              'Opened in your PDF app — use Share or Save there if needed.',
              if (extraHint != null) extraHint,
            ].join(' '),
          ),
          duration: const Duration(seconds: 5),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade200,
      appBar: AppBar(
        title: Text(widget.title),
        backgroundColor: AppTheme.primaryBlue,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.download_rounded),
            tooltip: 'Save or share PDF',
            onPressed: _saveOrSharePdf,
          ),
        ],
      ),
      body: PDFView(
        filePath: widget.filePath,
        enableSwipe: true,
        swipeHorizontal: false,
        autoSpacing: true,
        pageFling: true,
        onRender: (pages) {
          if (mounted) setState(() => _pages = pages ?? 0);
        },
        onError: (err) {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Could not render PDF: $err')),
          );
        },
      ),
      bottomNavigationBar: _pages > 0
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: Text(
                  '$_pages page${_pages == 1 ? '' : 's'}',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey.shade700, fontSize: 12),
                ),
              ),
            )
          : null,
    );
  }
}

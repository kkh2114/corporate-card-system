import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/colors.dart';
import '../../providers/auth_provider.dart';
import '../../api/transactions_api.dart';
import '../../models/transaction.dart';
import '../../utils/format.dart';
import '../../widgets/status_badge.dart';
import '../../widgets/loading_widget.dart';

class TransactionDetailScreen extends StatefulWidget {
  final String transactionId;

  const TransactionDetailScreen({super.key, required this.transactionId});

  @override
  State<TransactionDetailScreen> createState() => _TransactionDetailScreenState();
}

class _TransactionDetailScreenState extends State<TransactionDetailScreen> {
  TransactionDetail? _transaction;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    final auth = context.read<AuthNotifier>();
    final api = TransactionsApi(auth.apiClient.dio);
    try {
      final detail = await api.getDetail(widget.transactionId);
      if (mounted) setState(() { _transaction = detail; _isLoading = false; });
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  static const _verTypeLabels = {
    'location': '위치',
    'category': '업종',
    'region': '지역',
    'limit': '한도',
    'time': '시간',
  };

  static const _verResultConfig = {
    'pass': (Icons.check_circle, AppColors.success, '통과'),
    'warning': (Icons.error, AppColors.warning, '주의'),
    'fail': (Icons.cancel, AppColors.error, '실패'),
  };

  @override
  Widget build(BuildContext context) {
    if (_isLoading || _transaction == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('거래 상세')),
        body: const LoadingWidget(fullScreen: true, message: '상세 정보 로딩 중...'),
      );
    }

    final tx = _transaction!;

    return Scaffold(
      appBar: AppBar(title: const Text('거래 상세')),
      body: ListView(
        children: [
          // Status row
          Container(
            color: AppColors.surface,
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('상태',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                StatusBadge(status: tx.status),
              ],
            ),
          ),

          // Transaction info
          _buildSection('거래 정보', [
            _infoRow('상호명', tx.merchantName),
            _infoRow('금액', '${formatCurrency(tx.amount)} (VAT ${formatCurrency(tx.vat)})'),
            _infoRow('일시', formatDateTime(tx.transactionDate)),
            _infoRow('업종', tx.category),
            if (tx.businessNumber != null) _infoRow('사업자번호', tx.businessNumber!),
          ]),

          // Receipt
          if (tx.receipt != null)
            _buildSection('영수증', [
              if (tx.receipt!.fileUrl.isNotEmpty)
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    tx.receipt!.fileUrl,
                    height: 200,
                    width: double.infinity,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) => Container(
                      height: 200,
                      color: AppColors.border,
                      child: const Center(child: Icon(Icons.broken_image, size: 48)),
                    ),
                  ),
                ),
              const SizedBox(height: 12),
              _infoRow('OCR 신뢰도', '${(tx.receipt!.ocrConfidence * 100).round()}%'),
            ]),

          // Location
          if (tx.location != null)
            _buildSection('위치 정보', [
              _infoRow('업로드 위치',
                  '${tx.location!.uploadGps.latitude.toStringAsFixed(4)}, ${tx.location!.uploadGps.longitude.toStringAsFixed(4)}'),
              _infoRow('영수증 주소', tx.location!.receiptAddress),
              _infoRow('거리 차이', '${tx.location!.distance.round()}m'),
            ]),

          // Verification logs
          if (tx.verificationLogs.isNotEmpty)
            _buildSection('검증 결과', [
              ...tx.verificationLogs.map((log) {
                final cfg = _verResultConfig[log.result] ?? _verResultConfig['fail']!;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(cfg.$1, size: 20, color: cfg.$2),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _verTypeLabels[log.type] ?? log.type,
                              style: const TextStyle(
                                  fontSize: 14, fontWeight: FontWeight.w600),
                            ),
                          ),
                          Text(cfg.$3,
                              style: TextStyle(
                                  fontSize: 14, fontWeight: FontWeight.w600, color: cfg.$2)),
                        ],
                      ),
                      Padding(
                        padding: const EdgeInsets.only(left: 28, top: 2),
                        child: Text(log.reason,
                            style: const TextStyle(
                                fontSize: 13, color: AppColors.textSecondary)),
                      ),
                    ],
                  ),
                );
              }),
            ]),

          // Rejection reason
          if (tx.rejectionReason != null)
            Card(
              margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: AppColors.error, width: 2),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('거절 사유',
                        style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.error)),
                    const SizedBox(height: 4),
                    Text(tx.rejectionReason!,
                        style: const TextStyle(fontSize: 15, color: AppColors.textPrimary)),
                  ],
                ),
              ),
            ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Card(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary)),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 14, color: AppColors.textSecondary)),
          const SizedBox(width: 16),
          Flexible(
            child: Text(
              value,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }
}

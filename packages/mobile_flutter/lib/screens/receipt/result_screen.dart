import 'package:flutter/material.dart';
import '../../config/colors.dart';
import '../../utils/format.dart';

class ResultScreen extends StatelessWidget {
  final String transactionId;
  final String status;
  final String message;
  final String? rejectionReason;
  final int? amount;
  final String? merchantName;

  const ResultScreen({
    super.key,
    required this.transactionId,
    required this.status,
    required this.message,
    this.rejectionReason,
    this.amount,
    this.merchantName,
  });

  @override
  Widget build(BuildContext context) {
    final isApproved = status == 'approved';
    final isFlagged = status == 'flagged';
    final statusColor =
        isApproved ? AppColors.success : (isFlagged ? AppColors.warning : AppColors.error);
    final statusLabel = isApproved ? '승인' : (isFlagged ? '주의' : '거절');
    final statusIcon =
        isApproved ? Icons.check_circle : (isFlagged ? Icons.warning : Icons.cancel);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(statusIcon, size: 80, color: statusColor),
              const SizedBox(height: 16),
              Text(
                statusLabel,
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  color: statusColor,
                ),
              ),
              const SizedBox(height: 8),
              if (merchantName != null)
                Text(merchantName!,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
              if (amount != null) ...[
                const SizedBox(height: 4),
                Text(formatCurrency(amount!),
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
              ],
              const SizedBox(height: 16),
              Text(message,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 14, color: AppColors.textSecondary)),
              if (rejectionReason != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.error.withAlpha(20),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(rejectionReason!,
                      style: const TextStyle(color: AppColors.error, fontSize: 14)),
                ),
              ],
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.of(context)
                      .pushNamed('/transaction-detail', arguments: transactionId),
                  child: const Text('상세 보기'),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () =>
                      Navigator.of(context).pushNamedAndRemoveUntil('/main', (_) => false),
                  child: const Text('홈으로'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

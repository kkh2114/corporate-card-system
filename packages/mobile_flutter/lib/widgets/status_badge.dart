import 'package:flutter/material.dart';
import '../config/colors.dart';

class StatusBadge extends StatelessWidget {
  final String status;

  const StatusBadge({super.key, required this.status});

  static const _config = {
    'approved': {'label': '승인', 'color': AppColors.success},
    'rejected': {'label': '거절', 'color': AppColors.error},
    'flagged': {'label': '주의', 'color': AppColors.warning},
    'pending': {'label': '대기', 'color': AppColors.disabled},
  };

  @override
  Widget build(BuildContext context) {
    final cfg = _config[status] ?? _config['pending']!;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: cfg['color'] as Color,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        cfg['label'] as String,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

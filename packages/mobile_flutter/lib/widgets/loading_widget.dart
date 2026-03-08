import 'package:flutter/material.dart';
import '../config/colors.dart';

class LoadingWidget extends StatelessWidget {
  final String? message;
  final bool fullScreen;

  const LoadingWidget({super.key, this.message, this.fullScreen = false});

  @override
  Widget build(BuildContext context) {
    final content = Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const CircularProgressIndicator(color: AppColors.primary),
        if (message != null) ...[
          const SizedBox(height: 12),
          Text(message!, style: const TextStyle(fontSize: 14, color: AppColors.textSecondary)),
        ],
      ],
    );

    if (fullScreen) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: content),
      );
    }
    return Center(child: Padding(padding: const EdgeInsets.all(24), child: content));
  }
}

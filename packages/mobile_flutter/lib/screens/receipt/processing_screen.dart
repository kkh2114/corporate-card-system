import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../../config/colors.dart';
import '../../config/app_config.dart';
import '../../providers/auth_provider.dart';

class ProcessingScreen extends StatefulWidget {
  final String transactionId;
  final String websocketChannel;

  const ProcessingScreen({
    super.key,
    required this.transactionId,
    required this.websocketChannel,
  });

  @override
  State<ProcessingScreen> createState() => _ProcessingScreenState();
}

class _ProcessingStep {
  final String key;
  final String label;
  bool completed;

  _ProcessingStep({required this.key, required this.label, this.completed = false});
}

class _ProcessingScreenState extends State<ProcessingScreen> {
  late final List<_ProcessingStep> _steps;
  io.Socket? _socket;
  bool _timedOut = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _steps = [
      _ProcessingStep(key: 'upload', label: '이미지 업로드'),
      _ProcessingStep(key: 'ocr', label: 'OCR 텍스트 추출'),
      _ProcessingStep(key: 'location', label: '위치 검증'),
      _ProcessingStep(key: 'category', label: '업종 검증'),
      _ProcessingStep(key: 'limit', label: '한도 검증'),
      _ProcessingStep(key: 'final', label: '최종 판정'),
    ];
    _connectSocket();
    _timer = Timer(const Duration(seconds: 30), () {
      if (mounted) setState(() => _timedOut = true);
    });
  }

  void _connectSocket() {
    final token = context.read<AuthNotifier>().accessToken;
    _socket = io.io(
      '${AppConfig.wsUrl}/notifications',
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .build(),
    );

    _socket!.onConnect((_) {
      _socket!.emit('subscribe', {'channels': [widget.websocketChannel]});
      _updateStep('upload', true);
    });

    _socket!.on('transaction:status', (data) {
      if (data is! Map) return;
      final type = data['type'] as String?;
      switch (type) {
        case 'ocr_processing':
          _updateStep('upload', true);
          break;
        case 'ocr_complete':
          _updateStep('ocr', true);
          break;
        case 'verification_processing':
          _updateStep('location', true);
          _updateStep('category', true);
          _updateStep('limit', true);
          break;
        case 'transaction_complete':
          _updateStep('final', true);
          if (mounted) {
            Navigator.of(context).pushReplacementNamed(
              '/result',
              arguments: {
                'transactionId': data['transactionId'],
                'status': data['status'],
                'message': data['message'] ?? '',
                'rejectionReason': data['rejectionReason'],
                'amount': data['amount'],
                'merchantName': data['merchantName'],
              },
            );
          }
          break;
      }
    });
  }

  void _updateStep(String key, bool completed) {
    if (!mounted) return;
    setState(() {
      for (final step in _steps) {
        if (step.key == key) step.completed = completed;
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _socket?.disconnect();
    _socket?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final completedCount = _steps.where((s) => s.completed).length;
    final progress = completedCount / _steps.length;

    if (_timedOut) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline, size: 48, color: AppColors.warning),
                const SizedBox(height: 16),
                const Text('처리 시간이 초과되었습니다.',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                const Text('잠시 후 거래 내역에서 결과를 확인해주세요.',
                    style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
                    textAlign: TextAlign.center),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => Navigator.of(context).pushNamedAndRemoveUntil('/main', (_) => false),
                  child: const Text('돌아가기'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('처리 중...',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
              const SizedBox(height: 32),
              ..._steps.map((step) => Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Row(
                      children: [
                        Icon(
                          step.completed ? Icons.check_circle : Icons.circle_outlined,
                          size: 24,
                          color: step.completed ? AppColors.success : AppColors.disabled,
                        ),
                        const SizedBox(width: 12),
                        Text(
                          step.label,
                          style: TextStyle(
                            fontSize: 16,
                            color: step.completed
                                ? AppColors.textPrimary
                                : AppColors.textSecondary,
                            fontWeight: step.completed ? FontWeight.w600 : FontWeight.normal,
                          ),
                        ),
                      ],
                    ),
                  )),
              const SizedBox(height: 16),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 8,
                  backgroundColor: AppColors.border,
                  valueColor: const AlwaysStoppedAnimation(AppColors.primary),
                ),
              ),
              const SizedBox(height: 8),
              const Text('예상 소요 시간: 3초 이내',
                  style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
            ],
          ),
        ),
      ),
    );
  }
}

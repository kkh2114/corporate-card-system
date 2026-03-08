import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';
import '../../config/colors.dart';
import '../../providers/auth_provider.dart';
import '../../api/transactions_api.dart';

class ReceiptUploadScreen extends StatefulWidget {
  const ReceiptUploadScreen({super.key});

  @override
  State<ReceiptUploadScreen> createState() => _ReceiptUploadScreenState();
}

class _ReceiptUploadScreenState extends State<ReceiptUploadScreen> {
  final _picker = ImagePicker();
  XFile? _imageFile;
  Position? _position;
  bool _isUploading = false;
  double _uploadProgress = 0;
  String? _error;

  Future<void> _takePhoto() async {
    try {
      final file = await _picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 2048,
        maxHeight: 2048,
        imageQuality: 80,
      );
      if (file != null) {
        setState(() { _imageFile = file; _error = null; });
        await _getLocation();
      }
    } catch (e) {
      setState(() => _error = '카메라를 사용할 수 없습니다.');
    }
  }

  Future<void> _pickFromGallery() async {
    try {
      final file = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 2048,
        maxHeight: 2048,
        imageQuality: 80,
      );
      if (file != null) {
        setState(() { _imageFile = file; _error = null; });
        await _getLocation();
      }
    } catch (e) {
      setState(() => _error = '갤러리에 접근할 수 없습니다.');
    }
  }

  Future<void> _getLocation() async {
    try {
      final permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        final requested = await Geolocator.requestPermission();
        if (requested == LocationPermission.denied ||
            requested == LocationPermission.deniedForever) {
          setState(() => _error = '위치 권한이 필요합니다.');
          return;
        }
      }
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );
      setState(() => _position = pos);
    } catch (e) {
      setState(() => _error = 'GPS 위치를 가져올 수 없습니다.');
    }
  }

  Future<void> _upload() async {
    if (_imageFile == null || _position == null) return;
    setState(() { _isUploading = true; _error = null; _uploadProgress = 0; });

    final auth = context.read<AuthNotifier>();
    final api = TransactionsApi(auth.apiClient.dio);

    try {
      final result = await api.uploadReceipt(
        filePath: _imageFile!.path,
        fileName: _imageFile!.name,
        latitude: _position!.latitude,
        longitude: _position!.longitude,
        accuracy: _position!.accuracy,
        onSendProgress: (sent, total) {
          if (mounted) setState(() => _uploadProgress = sent / total);
        },
      );
      if (mounted) {
        Navigator.of(context).pushReplacementNamed(
          '/processing',
          arguments: {
            'transactionId': result.transactionId,
            'websocketChannel': result.websocketChannel,
          },
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isUploading = false;
          _error = '업로드에 실패했습니다. 다시 시도해주세요.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('영수증 업로드')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Image preview
            Expanded(
              child: _imageFile != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.file(
                        File(_imageFile!.path),
                        fit: BoxFit.contain,
                      ),
                    )
                  : Container(
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border, width: 2),
                      ),
                      child: const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.receipt_long, size: 64, color: AppColors.disabled),
                          SizedBox(height: 16),
                          Text('영수증 사진을 촬영하거나\n갤러리에서 선택해주세요.',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
            ),

            const SizedBox(height: 16),

            // Location info
            if (_position != null)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.success.withAlpha(20),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.location_on, color: AppColors.success, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'GPS: ${_position!.latitude.toStringAsFixed(4)}, ${_position!.longitude.toStringAsFixed(4)}',
                      style: const TextStyle(fontSize: 13, color: AppColors.textPrimary),
                    ),
                  ],
                ),
              ),

            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13)),
            ],

            if (_isUploading) ...[
              const SizedBox(height: 12),
              LinearProgressIndicator(value: _uploadProgress),
              const SizedBox(height: 4),
              Text('${(_uploadProgress * 100).round()}% 업로드 중...',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
            ],

            const SizedBox(height: 16),

            // Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _isUploading ? null : _takePhoto,
                    icon: const Icon(Icons.camera_alt),
                    label: const Text('촬영'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _isUploading ? null : _pickFromGallery,
                    icon: const Icon(Icons.photo_library),
                    label: const Text('갤러리'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: (_imageFile != null && _position != null && !_isUploading)
                  ? _upload
                  : null,
              child: _isUploading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('업로드', style: TextStyle(fontSize: 16)),
            ),
          ],
        ),
      ),
    );
  }
}

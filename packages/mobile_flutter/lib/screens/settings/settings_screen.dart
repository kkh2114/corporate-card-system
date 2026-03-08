import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/colors.dart';
import '../../providers/auth_provider.dart';
import '../../utils/format.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _pushEnabled = true;
  bool _approvalAlert = true;
  bool _rejectionAlert = true;
  bool _limitWarning = true;

  void _handleLogout() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('로그아웃'),
        content: const Text('정말 로그아웃하시겠습니까?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('취소')),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.read<AuthNotifier>().logout();
              Navigator.of(context).pushNamedAndRemoveUntil('/login', (_) => false);
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('로그아웃'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthNotifier>().user;

    return Scaffold(
      appBar: AppBar(title: const Text('설정')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Profile
          _buildSection('프로필', [
            _infoItem('이름', user?.name ?? '-'),
            _infoItem('사번', user?.employeeId ?? '-'),
            _infoItem('부서', user?.department ?? '-'),
            _infoItem('이메일', user?.email ?? '-'),
          ]),

          const SizedBox(height: 16),

          // Notification settings
          _buildSection('알림 설정', [
            _switchItem('푸시 알림', _pushEnabled, (v) => setState(() => _pushEnabled = v)),
            _switchItem('승인 알림', _approvalAlert, (v) => setState(() => _approvalAlert = v)),
            _switchItem('거절 알림', _rejectionAlert, (v) => setState(() => _rejectionAlert = v)),
            _switchItem('한도 경고', _limitWarning, (v) => setState(() => _limitWarning = v)),
          ]),

          const SizedBox(height: 16),

          // Card info
          _buildSection('카드 정보', [
            _infoItem('카드번호', maskCardNumber('1234567890121234')),
            _infoItem('월 한도', formatCurrency(2000000)),
            _infoItem('일 한도', formatCurrency(300000)),
            _infoItem('건별 한도', formatCurrency(200000)),
          ]),

          const SizedBox(height: 16),

          // App info
          _buildSection('앱 정보', [
            _infoItem('버전', '1.0.0'),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('이용약관'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {},
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('개인정보처리방침'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {},
            ),
          ]),

          const SizedBox(height: 16),

          OutlinedButton(
            onPressed: _handleLogout,
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.error,
              side: const BorderSide(color: AppColors.error),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            child: const Text('로그아웃'),
          ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style: const TextStyle(
                    fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _infoItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 14, color: AppColors.textSecondary)),
          Text(value, style: const TextStyle(fontSize: 14, color: AppColors.textPrimary)),
        ],
      ),
    );
  }

  Widget _switchItem(String label, bool value, ValueChanged<bool> onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 14)),
          Switch(value: value, onChanged: onChanged, activeTrackColor: AppColors.primary),
        ],
      ),
    );
  }
}

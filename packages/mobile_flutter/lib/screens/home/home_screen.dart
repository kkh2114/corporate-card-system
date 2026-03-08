import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/colors.dart';
import '../../providers/auth_provider.dart';
import '../../api/transactions_api.dart';
import '../../models/transaction.dart';
import '../../utils/format.dart';
import '../../widgets/transaction_card.dart';
import '../../widgets/loading_widget.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Transaction> _recentTransactions = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final auth = context.read<AuthNotifier>();
    final api = TransactionsApi(auth.apiClient.dio);
    try {
      final result = await api.getList(limit: 3, sortBy: 'transactionDate', sortOrder: 'desc');
      if (mounted) {
        setState(() {
          _recentTransactions = result.data;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthNotifier>().user;

    // TODO: Replace with real card policy data from API
    const monthlyLimit = 2000000;
    const monthlyUsed = 1234567;
    const monthlyRemaining = monthlyLimit - monthlyUsed;
    const usageRatio = monthlyUsed / monthlyLimit;
    const dailyLimit = 300000;
    const dailyRemaining = 200000;

    if (_isLoading) {
      return const LoadingWidget(fullScreen: true, message: '로딩 중...');
    }

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: ListView(
          children: [
            // Header
            Container(
              color: AppColors.primary,
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '안녕하세요, ${user?.name ?? '직원'}님',
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${user?.department ?? ''} | 사번: ${user?.employeeId ?? ''}',
                    style: const TextStyle(fontSize: 14, color: Color(0xCCFFFFFF)),
                  ),
                ],
              ),
            ),

            // Monthly usage card
            Transform.translate(
              offset: const Offset(0, -12),
              child: Card(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                elevation: 4,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        '이번 달 사용 현황',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _usageRow('사용액', formatCurrency(monthlyUsed)),
                      _usageRow('한도', formatCurrency(monthlyLimit)),
                      _usageRow('잔여', formatCurrency(monthlyRemaining),
                          valueColor: AppColors.success),
                      const SizedBox(height: 12),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: usageRatio,
                          minHeight: 8,
                          backgroundColor: AppColors.border,
                          valueColor: AlwaysStoppedAnimation(
                            usageRatio > 0.8 ? AppColors.warning : AppColors.primary,
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Align(
                        alignment: Alignment.centerRight,
                        child: Text(
                          '${(usageRatio * 100).round()}% 사용',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Limit cards
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Expanded(
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('일일 한도',
                                style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                            const SizedBox(height: 4),
                            Text(formatCurrency(dailyLimit),
                                style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.textPrimary)),
                            const SizedBox(height: 4),
                            Text('잔여 ${formatCurrency(dailyRemaining)}',
                                style: const TextStyle(fontSize: 12, color: AppColors.success)),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('건별 한도',
                                style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                            const SizedBox(height: 4),
                            Text(formatCurrency(200000),
                                style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.textPrimary)),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Recent transactions
            const SizedBox(height: 20),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                '최근 거래',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
            const SizedBox(height: 8),
            if (_recentTransactions.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Center(
                  child: Text('거래 내역이 없습니다.',
                      style: TextStyle(color: AppColors.textSecondary)),
                ),
              )
            else
              ..._recentTransactions.map(
                (tx) => TransactionCard(
                  transaction: tx,
                  onPress: (id) =>
                      Navigator.of(context).pushNamed('/transaction-detail', arguments: id),
                ),
              ),

            // Upload button
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
              child: ElevatedButton.icon(
                onPressed: () => Navigator.of(context).pushNamed('/receipt-upload'),
                icon: const Icon(Icons.camera_alt),
                label: const Text('영수증 업로드하기', style: TextStyle(fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _usageRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 14, color: AppColors.textSecondary)),
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: valueColor ?? AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

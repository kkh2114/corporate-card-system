import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/colors.dart';
import '../../config/app_config.dart';
import '../../providers/auth_provider.dart';
import '../../api/transactions_api.dart';
import '../../models/transaction.dart';
import '../../utils/format.dart';
import '../../widgets/transaction_card.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/empty_state.dart';

class TransactionListScreen extends StatefulWidget {
  const TransactionListScreen({super.key});

  @override
  State<TransactionListScreen> createState() => _TransactionListScreenState();
}

class _TransactionListScreenState extends State<TransactionListScreen> {
  final List<Transaction> _transactions = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  int _currentPage = 1;
  int _totalPages = 1;
  String? _selectedStatus;

  final _statusFilters = [
    (null, '전체'),
    ('approved', '승인'),
    ('rejected', '거절'),
    ('flagged', '주의'),
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData({bool reset = true}) async {
    if (reset) {
      setState(() {
        _isLoading = true;
        _currentPage = 1;
        _transactions.clear();
      });
    }

    final auth = context.read<AuthNotifier>();
    final api = TransactionsApi(auth.apiClient.dio);
    try {
      final result = await api.getList(
        page: _currentPage,
        limit: AppConfig.transactionPageSize,
        status: _selectedStatus,
        sortBy: 'transactionDate',
        sortOrder: 'desc',
      );
      if (mounted) {
        setState(() {
          _transactions.addAll(result.data);
          _totalPages = result.metadata.totalPages;
          _isLoading = false;
          _isLoadingMore = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() { _isLoading = false; _isLoadingMore = false; });
    }
  }

  void _loadMore() {
    if (_isLoadingMore || _currentPage >= _totalPages) return;
    setState(() { _isLoadingMore = true; _currentPage++; });
    _loadData(reset: false);
  }

  Map<String, List<Transaction>> _groupByDate() {
    final grouped = <String, List<Transaction>>{};
    for (final tx in _transactions) {
      final dateKey = tx.transactionDate.split('T')[0];
      grouped.putIfAbsent(dateKey, () => []).add(tx);
    }
    return Map.fromEntries(
      grouped.entries.toList()..sort((a, b) => b.key.compareTo(a.key)),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const LoadingWidget(fullScreen: true, message: '내역을 불러오는 중...');
    }

    final grouped = _groupByDate();

    return Scaffold(
      appBar: AppBar(title: const Text('거래 내역')),
      body: Column(
        children: [
          // Filter chips
          Container(
            padding: const EdgeInsets.all(12),
            color: AppColors.surface,
            child: Row(
              children: _statusFilters.map((f) {
                final isSelected = _selectedStatus == f.$1;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(f.$2),
                    selected: isSelected,
                    onSelected: (_) {
                      setState(() => _selectedStatus = f.$1);
                      _loadData();
                    },
                    selectedColor: AppColors.primaryLight.withAlpha(50),
                    checkmarkColor: AppColors.primary,
                  ),
                );
              }).toList(),
            ),
          ),

          // Transaction list
          Expanded(
            child: _transactions.isEmpty
                ? const EmptyState(icon: Icons.receipt_long, message: '거래 내역이 없습니다.')
                : NotificationListener<ScrollNotification>(
                    onNotification: (scroll) {
                      if (scroll.metrics.pixels >= scroll.metrics.maxScrollExtent - 200) {
                        _loadMore();
                      }
                      return false;
                    },
                    child: RefreshIndicator(
                      onRefresh: () => _loadData(),
                      child: ListView.builder(
                        itemCount: grouped.length + (_isLoadingMore ? 1 : 0),
                        itemBuilder: (context, index) {
                          if (index == grouped.length) {
                            return const LoadingWidget(message: '더 불러오는 중...');
                          }
                          final entry = grouped.entries.elementAt(index);
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                                child: Text(
                                  formatDateGroup(entry.key),
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ),
                              ...entry.value.map(
                                (tx) => TransactionCard(
                                  transaction: tx,
                                  onPress: (id) => Navigator.of(context)
                                      .pushNamed('/transaction-detail', arguments: id),
                                ),
                              ),
                            ],
                          );
                        },
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

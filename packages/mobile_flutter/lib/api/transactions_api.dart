import 'package:dio/dio.dart';
import '../models/transaction.dart';

class TransactionsApi {
  final Dio dio;

  TransactionsApi(this.dio);

  Future<PaginatedResponse> getList({
    int page = 1,
    int limit = 20,
    String? status,
    String? startDate,
    String? endDate,
    String sortBy = 'transactionDate',
    String sortOrder = 'desc',
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'limit': limit,
      'sortBy': sortBy,
      'sortOrder': sortOrder,
    };
    if (status != null) params['status'] = status;
    if (startDate != null) params['startDate'] = startDate;
    if (endDate != null) params['endDate'] = endDate;

    final response = await dio.get('/transactions', queryParameters: params);
    return PaginatedResponse.fromJson(response.data);
  }

  Future<TransactionDetail> getDetail(String id) async {
    final response = await dio.get('/transactions/$id');
    return TransactionDetail.fromJson(response.data['data']);
  }

  Future<void> submitReason(String id, String reason) async {
    await dio.post('/transactions/$id/reason', data: {'reason': reason});
  }

  Future<UploadReceiptResponse> uploadReceipt({
    required String filePath,
    required String fileName,
    required double latitude,
    required double longitude,
    required double accuracy,
    Function(int, int)? onSendProgress,
  }) async {
    final formData = FormData.fromMap({
      'receipt': await MultipartFile.fromFile(filePath, filename: fileName),
      'latitude': latitude,
      'longitude': longitude,
      'accuracy': accuracy,
    });
    final response = await dio.post(
      '/receipts/upload',
      data: formData,
      onSendProgress: onSendProgress,
    );
    return UploadReceiptResponse.fromJson(response.data['data']);
  }
}

class PaginatedResponse {
  final List<Transaction> data;
  final PaginationMeta metadata;

  PaginatedResponse({required this.data, required this.metadata});

  factory PaginatedResponse.fromJson(Map<String, dynamic> json) {
    return PaginatedResponse(
      data: (json['data'] as List).map((e) => Transaction.fromJson(e)).toList(),
      metadata: PaginationMeta.fromJson(json['metadata']),
    );
  }
}

class PaginationMeta {
  final int page;
  final int limit;
  final int total;
  final int totalPages;

  PaginationMeta({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });

  factory PaginationMeta.fromJson(Map<String, dynamic> json) {
    return PaginationMeta(
      page: json['page'] as int,
      limit: json['limit'] as int,
      total: json['total'] as int,
      totalPages: json['totalPages'] as int,
    );
  }
}

class UploadReceiptResponse {
  final String transactionId;
  final String receiptId;
  final String websocketChannel;

  UploadReceiptResponse({
    required this.transactionId,
    required this.receiptId,
    required this.websocketChannel,
  });

  factory UploadReceiptResponse.fromJson(Map<String, dynamic> json) {
    return UploadReceiptResponse(
      transactionId: json['transactionId'] as String,
      receiptId: json['receiptId'] as String,
      websocketChannel: json['websocketChannel'] as String,
    );
  }
}

class Transaction {
  final String id;
  final String transactionNumber;
  final TransactionEmployee employee;
  final int amount;
  final int vat;
  final String merchantName;
  final String category;
  final String transactionDate;
  final String status;
  final String? rejectionReason;
  final String receiptUrl;
  final Verification verification;
  final String createdAt;
  final String updatedAt;

  Transaction({
    required this.id,
    required this.transactionNumber,
    required this.employee,
    required this.amount,
    required this.vat,
    required this.merchantName,
    required this.category,
    required this.transactionDate,
    required this.status,
    this.rejectionReason,
    required this.receiptUrl,
    required this.verification,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    // Server returns amount/vat as string (decimal), convert to int
    final rawAmount = json['amount'];
    final rawVat = json['vat'];
    return Transaction(
      id: json['id'] as String,
      transactionNumber: json['transactionNumber'] as String,
      employee: TransactionEmployee.fromJson(json['employee'] ?? {}),
      amount: rawAmount is int ? rawAmount : (double.tryParse(rawAmount?.toString() ?? '0') ?? 0).round(),
      vat: rawVat is int ? rawVat : (double.tryParse(rawVat?.toString() ?? '0') ?? 0).round(),
      merchantName: json['merchantName'] as String? ?? '',
      category: json['category'] as String? ?? '',
      transactionDate: json['transactionDate'] as String? ?? '',
      status: json['status'] as String? ?? '',
      rejectionReason: json['rejectionReason'] as String?,
      receiptUrl: json['receipt']?['fileUrl'] as String? ?? json['receiptUrl'] as String? ?? '',
      verification: Verification.fromJson(json['verification'] ?? json),
      createdAt: json['createdAt'] as String? ?? '',
      updatedAt: json['updatedAt'] as String? ?? '',
    );
  }
}

class TransactionEmployee {
  final String id;
  final String name;
  final String department;
  final String? employeeId;
  final String? position;

  TransactionEmployee({
    required this.id,
    required this.name,
    required this.department,
    this.employeeId,
    this.position,
  });

  factory TransactionEmployee.fromJson(Map<String, dynamic> json) {
    return TransactionEmployee(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      department: json['department'] as String? ?? '',
      employeeId: json['employeeId'] as String?,
      position: json['position'] as String?,
    );
  }
}

class Verification {
  final bool locationVerified;
  final bool categoryVerified;
  final bool regionVerified;
  final bool limitVerified;
  final double distanceDifference;

  Verification({
    this.locationVerified = false,
    this.categoryVerified = false,
    this.regionVerified = false,
    this.limitVerified = false,
    this.distanceDifference = 0,
  });

  factory Verification.fromJson(Map<String, dynamic> json) {
    return Verification(
      locationVerified: json['locationVerified'] as bool? ?? false,
      categoryVerified: json['categoryVerified'] as bool? ?? false,
      regionVerified: json['regionVerified'] as bool? ?? false,
      limitVerified: json['limitVerified'] as bool? ?? false,
      distanceDifference: (json['distanceDifference'] as num?)?.toDouble() ?? 0,
    );
  }
}

class TransactionDetail extends Transaction {
  final String? businessNumber;
  final Receipt? receipt;
  final OcrResult? ocrResult;
  final LocationInfo? location;
  final List<VerificationLog> verificationLogs;

  TransactionDetail({
    required super.id,
    required super.transactionNumber,
    required super.employee,
    required super.amount,
    required super.vat,
    required super.merchantName,
    required super.category,
    required super.transactionDate,
    required super.status,
    super.rejectionReason,
    required super.receiptUrl,
    required super.verification,
    required super.createdAt,
    required super.updatedAt,
    this.businessNumber,
    this.receipt,
    this.ocrResult,
    this.location,
    this.verificationLogs = const [],
  });

  factory TransactionDetail.fromJson(Map<String, dynamic> json) {
    final rawAmount = json['amount'];
    final rawVat = json['vat'];
    return TransactionDetail(
      id: json['id'] as String,
      transactionNumber: json['transactionNumber'] as String? ?? '',
      employee: TransactionEmployee.fromJson(json['employee'] ?? {}),
      amount: rawAmount is int ? rawAmount : (double.tryParse(rawAmount?.toString() ?? '0') ?? 0).round(),
      vat: rawVat is int ? rawVat : (double.tryParse(rawVat?.toString() ?? '0') ?? 0).round(),
      merchantName: json['merchantName'] as String? ?? '',
      category: json['category'] as String? ?? '',
      transactionDate: json['transactionDate'] as String? ?? '',
      status: json['status'] as String? ?? '',
      rejectionReason: json['rejectionReason'] as String?,
      receiptUrl: json['receipt']?['fileUrl'] as String? ?? json['receiptUrl'] as String? ?? '',
      verification: Verification.fromJson(json['verification'] ?? json),
      createdAt: json['createdAt'] as String? ?? '',
      updatedAt: json['updatedAt'] as String? ?? '',
      businessNumber: json['businessNumber'] as String?,
      receipt: json['receipt'] != null ? Receipt.fromJson(json['receipt']) : null,
      ocrResult: json['ocrResult'] != null ? OcrResult.fromJson(json['ocrResult']) : null,
      location: json['location'] != null ? LocationInfo.fromJson(json['location']) : null,
      verificationLogs: (json['verificationLogs'] as List<dynamic>?)
              ?.map((e) => VerificationLog.fromJson(e))
              .toList() ??
          [],
    );
  }
}

class Receipt {
  final String id;
  final String fileUrl;
  final String uploadedAt;
  final double ocrConfidence;

  Receipt({
    required this.id,
    required this.fileUrl,
    required this.uploadedAt,
    required this.ocrConfidence,
  });

  factory Receipt.fromJson(Map<String, dynamic> json) {
    return Receipt(
      id: json['id'] as String,
      fileUrl: json['fileUrl'] as String? ?? '',
      uploadedAt: json['uploadedAt'] as String? ?? json['createdAt'] as String? ?? '',
      ocrConfidence: (json['ocrConfidence'] as num?)?.toDouble() ?? 0,
    );
  }
}

class OcrResult {
  final String merchantName;
  final String address;
  final int amount;

  OcrResult({
    required this.merchantName,
    required this.address,
    required this.amount,
  });

  factory OcrResult.fromJson(Map<String, dynamic> json) {
    return OcrResult(
      merchantName: json['merchantName'] as String,
      address: json['address'] as String,
      amount: json['amount'] as int,
    );
  }
}

class LocationInfo {
  final GpsPoint uploadGps;
  final String receiptAddress;
  final GpsPoint receiptGps;
  final double distance;

  LocationInfo({
    required this.uploadGps,
    required this.receiptAddress,
    required this.receiptGps,
    required this.distance,
  });

  factory LocationInfo.fromJson(Map<String, dynamic> json) {
    return LocationInfo(
      uploadGps: GpsPoint.fromJson(json['uploadGps']),
      receiptAddress: json['receiptAddress'] as String,
      receiptGps: GpsPoint.fromJson(json['receiptGps']),
      distance: (json['distance'] as num).toDouble(),
    );
  }
}

class GpsPoint {
  final double latitude;
  final double longitude;
  final double? accuracy;

  GpsPoint({required this.latitude, required this.longitude, this.accuracy});

  factory GpsPoint.fromJson(Map<String, dynamic> json) {
    return GpsPoint(
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      accuracy: (json['accuracy'] as num?)?.toDouble(),
    );
  }
}

class VerificationLog {
  final String type;
  final String result;
  final String? expectedValue;
  final String? actualValue;
  final String reason;
  final String verifiedAt;

  VerificationLog({
    required this.type,
    required this.result,
    this.expectedValue,
    this.actualValue,
    required this.reason,
    required this.verifiedAt,
  });

  factory VerificationLog.fromJson(Map<String, dynamic> json) {
    return VerificationLog(
      type: json['verificationType'] as String? ?? json['type'] as String? ?? '',
      result: json['result'] as String? ?? '',
      expectedValue: json['expectedValue'] as String?,
      actualValue: json['actualValue'] as String?,
      reason: json['reason'] as String? ?? '',
      verifiedAt: json['verifiedAt'] as String? ?? '',
    );
  }
}

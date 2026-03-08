import 'package:intl/intl.dart';

final _currencyFormat = NumberFormat('#,###', 'ko_KR');

String formatCurrency(int amount) {
  return '₩${_currencyFormat.format(amount)}';
}

String formatDate(String dateStr) {
  final date = DateTime.parse(dateStr);
  return DateFormat('yyyy-MM-dd').format(date);
}

String formatTime(String dateStr) {
  final date = DateTime.parse(dateStr);
  return DateFormat('HH:mm').format(date);
}

String formatDateTime(String dateStr) {
  final date = DateTime.parse(dateStr);
  return DateFormat('yyyy-MM-dd HH:mm').format(date);
}

String formatDateGroup(String dateStr) {
  final date = DateTime.parse(dateStr);
  const days = ['월', '화', '수', '목', '금', '토', '일'];
  final dayOfWeek = days[date.weekday - 1];
  return '${date.year}년 ${date.month}월 ${date.day}일 ($dayOfWeek)';
}

String maskCardNumber(String cardNumber) {
  if (cardNumber.length < 4) return cardNumber;
  return '****-${cardNumber.substring(cardNumber.length - 4)}';
}

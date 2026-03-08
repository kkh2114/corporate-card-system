import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'config/theme.dart';
import 'providers/auth_provider.dart';
import 'screens/auth/splash_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/main_shell.dart';
import 'screens/transactions/transaction_detail_screen.dart';
import 'screens/receipt/receipt_upload_screen.dart';
import 'screens/receipt/processing_screen.dart';
import 'screens/receipt/result_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const CorporateCardApp());
}

class CorporateCardApp extends StatelessWidget {
  const CorporateCardApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthNotifier(),
      child: MaterialApp(
        title: '법인카드',
        theme: appTheme,
        debugShowCheckedModeBanner: false,
        initialRoute: '/',
        onGenerateRoute: (settings) {
          switch (settings.name) {
            case '/':
              return MaterialPageRoute(builder: (_) => const SplashScreen());
            case '/login':
              return MaterialPageRoute(builder: (_) => const LoginScreen());
            case '/main':
              return MaterialPageRoute(builder: (_) => const MainShell());
            case '/transaction-detail':
              final id = settings.arguments as String;
              return MaterialPageRoute(
                builder: (_) => TransactionDetailScreen(transactionId: id),
              );
            case '/receipt-upload':
              return MaterialPageRoute(builder: (_) => const ReceiptUploadScreen());
            case '/processing':
              final args = settings.arguments as Map<String, dynamic>;
              return MaterialPageRoute(
                builder: (_) => ProcessingScreen(
                  transactionId: args['transactionId'] as String,
                  websocketChannel: args['websocketChannel'] as String,
                ),
              );
            case '/result':
              final args = settings.arguments as Map<String, dynamic>;
              return MaterialPageRoute(
                builder: (_) => ResultScreen(
                  transactionId: args['transactionId'] as String,
                  status: args['status'] as String,
                  message: args['message'] as String? ?? '',
                  rejectionReason: args['rejectionReason'] as String?,
                  amount: args['amount'] as int?,
                  merchantName: args['merchantName'] as String?,
                ),
              );
            default:
              return MaterialPageRoute(builder: (_) => const SplashScreen());
          }
        },
      ),
    );
  }
}

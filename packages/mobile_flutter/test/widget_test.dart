import 'package:flutter_test/flutter_test.dart';
import 'package:corporate_card/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const CorporateCardApp());
    expect(find.text('Smart Corporate Card'), findsOneWidget);
  });
}

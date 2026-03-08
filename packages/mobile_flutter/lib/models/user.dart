class User {
  final String id;
  final String employeeId;
  final String name;
  final String email;
  final String department;
  final String role;

  User({
    required this.id,
    required this.employeeId,
    required this.name,
    required this.email,
    required this.department,
    required this.role,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      employeeId: json['employeeId'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      department: json['department'] as String,
      role: json['role'] as String,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'employeeId': employeeId,
    'name': name,
    'email': email,
    'department': department,
    'role': role,
  };
}

class Tokens {
  final String accessToken;
  final String refreshToken;
  final int expiresIn;

  Tokens({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresIn,
  });

  factory Tokens.fromJson(Map<String, dynamic> json) {
    return Tokens(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      expiresIn: json['expiresIn'] as int,
    );
  }
}

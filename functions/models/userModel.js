class User {
  constructor(firstName, lastName, email, hashedPassword) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = hashedPassword; // hashed password
    this.createdAt = new Date();
    this.history = [];
  }
}

module.exports = User;

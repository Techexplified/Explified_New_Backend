class EmailAutomationUser {
  constructor({
    userId,
    gmailAccessToken,
    gmailRefreshToken,
    email,
    telegramChatId,
    lastProcessed,
    intervalMinutes,
    userGeminiApiKey,
  }) {
    this.userId = userId;
    this.gmailAccessToken = gmailAccessToken || null;
    this.gmailRefreshToken = gmailRefreshToken || null;
    this.email = email || null;
    this.telegramChatId = telegramChatId || null;
    this.lastProcessed = lastProcessed || null;
    this.intervalMinutes = intervalMinutes || 5;
    this.userGeminiApiKey = userGeminiApiKey || null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  toFirestore() {
    return { ...this };
  }
}

module.exports = EmailAutomationUser;

const express = require("express");
const router = express.Router();
const passport = require("passport");
const { db } = require("../config/db");

const COLLECTION = "email_automation_users";

router.get(
    "/auth/google",
    passport.authenticate("google", {
        scope: [
            "profile",
            "email",
            "https://www.googleapis.com/auth/gmail.readonly",
        ],
        accessType: "offline",
        prompt: "consent",
    })
);

router.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        res.redirect(`${frontendUrl}/email-updates?connected=gmail`);
    }
);

router.get("/connect-telegram", async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Missing email" });

    try {
        const snapshot = await db.collection(COLLECTION).where("email", "==", email).limit(1).get();
        if (snapshot.empty) return res.status(404).json({ message: "User not found. Please connect Gmail first." });

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        const link = `https://t.me/explifiedbot?start=${userData.userId}`;
        res.json({ link });
    } catch (err) {
        console.error("Error in connect-telegram:", err);
        res.status(500).json({ error: err.message });
    }
});

router.post("/telegram-webhook", express.json(), async (req, res) => {
    const msg = req.body.message;
    if (!msg) return res.sendStatus(200);

    const chatId = msg.chat.id;
    const text = msg.text || "";

    try {
        if (text.startsWith("/start")) {
            const userId = text.split(" ")[1];
            if (userId) {
                const snapshot = await db.collection(COLLECTION).where("userId", "==", userId).limit(1).get();
                if (!snapshot.empty) {
                    const docRef = snapshot.docs[0].ref;
                    await docRef.update({ telegramChatId: String(chatId), updatedAt: new Date() });
                    console.log("Saved Telegram Chat ID:", chatId, "for user:", userId);
                }
            }
        }
    } catch (err) {
        console.error("Telegram webhook error:", err);
    }

    res.sendStatus(200);
});

router.get("/getUsers", async (req, res) => {
    try {
        const snapshot = await db.collection(COLLECTION).get();
        const users = [];
        snapshot.forEach((doc) => users.push({ id: doc.id, ...doc.data() }));
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/updateLastProcessed", async (req, res) => {
    const { userId, lastProcessed } = req.body;

    if (!userId) return res.status(400).json({ message: "Missing userId" });
    if (!lastProcessed) return res.status(400).json({ message: "Missing lastProcessed" });

    const parsedDate = new Date(lastProcessed);
    if (isNaN(parsedDate)) return res.status(400).json({ message: "Invalid lastProcessed date" });

    try {
        const snapshot = await db.collection(COLLECTION).where("userId", "==", userId).limit(1).get();
        if (snapshot.empty) return res.status(404).json({ message: "User not found" });

        await snapshot.docs[0].ref.update({ lastProcessed: parsedDate, updatedAt: new Date() });
        return res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/updateIntervalMinutes", async (req, res) => {
    const { email, intervalMinutes } = req.body;

    if (!email) return res.status(400).json({ message: "Missing email" });
    if (intervalMinutes === undefined || intervalMinutes === null)
        return res.status(400).json({ message: "Missing intervalMinutes" });
    if (isNaN(intervalMinutes) || intervalMinutes < 1)
        return res.status(400).json({ message: "intervalMinutes must be a positive number" });

    try {
        const snapshot = await db.collection(COLLECTION).where("email", "==", email).limit(1).get();
        if (snapshot.empty) return res.status(404).json({ message: "User not found" });

        await snapshot.docs[0].ref.update({ intervalMinutes: parseInt(intervalMinutes), updatedAt: new Date() });
        return res.json({ success: true, intervalMinutes: parseInt(intervalMinutes) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/updateGeminiApiKey", async (req, res) => {
    const { email, geminiApiKey } = req.body;

    if (!email) return res.status(400).json({ message: "Missing email" });
    if (!geminiApiKey) return res.status(400).json({ message: "Missing geminiApiKey" });

    const encoded = Buffer.from(geminiApiKey).toString("base64");

    try {
        const snapshot = await db.collection(COLLECTION).where("email", "==", email).limit(1).get();
        if (snapshot.empty) return res.status(404).json({ message: "User not found" });

        await snapshot.docs[0].ref.update({ userGeminiApiKey: encoded, updatedAt: new Date() });
        return res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/status/:email", async (req, res) => {
    try {
        const email = req.params.email;
        console.log("Fetching status for email:", email);
        const snapshot = await db.collection(COLLECTION).where("email", "==", email).limit(1).get();

        if (snapshot.empty) {
            console.log("User not found for email:", email);
            return res.json({ found: false });
        }

        const userData = snapshot.docs[0].data();
        console.log("User found:", userData.email);

        res.json({
            found: true,
            gmailConnected: !!(userData.gmailAccessToken),
            telegramConnected: !!(userData.telegramChatId),
            geminiKeySet: !!(userData.userGeminiApiKey),
            intervalMinutes: userData.intervalMinutes || 5,
            email: userData.email,
            userId: userData.userId,
        });
    } catch (err) {
        console.error("Error in status route:", err);
        res.status(500).json({ error: err.message });
    }
});

router.post("/disconnect/:service", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Missing email" });

    const { service } = req.params;
    const update = { updatedAt: new Date() };

    switch (service) {
        case "gmail":
            update.gmailAccessToken = null;
            update.gmailRefreshToken = null;
            break;
        case "telegram":
            update.telegramChatId = null;
            break;
        case "gemini":
            update.userGeminiApiKey = null;
            break;
        default:
            return res.status(400).json({ message: "Invalid service" });
    }

    try {
        const snapshot = await db.collection(COLLECTION).where("email", "==", email).limit(1).get();
        if (snapshot.empty) return res.status(404).json({ message: "User not found" });

        await snapshot.docs[0].ref.update(update);
        return res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/disconnect-all", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Missing email" });

    try {
        const snapshot = await db.collection(COLLECTION).where("email", "==", email).limit(1).get();
        if (snapshot.empty) return res.status(404).json({ message: "User not found" });

        await snapshot.docs[0].ref.delete();
        console.log("Deleted email automation user:", email);
        return res.json({ success: true });
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
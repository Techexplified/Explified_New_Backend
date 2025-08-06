const admin = require("firebase-admin");
const serviceAccount = require("./functions/confidential/leaveit.json"); // Adjust path if needed

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

db.collection("users")
  .get()
  .then((snapshot) => {
    console.log("Successfully connected to Firestore.");
    snapshot.forEach((doc) => {
      console.log(doc.id, "=>", doc.data());
    });
  })
  .catch((error) => {
    console.error("Error reading from Firestore:", error.message);
  });

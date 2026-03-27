const admin = require("firebase-admin");

let serviceAccount = require("../confidential/leaveit.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://explified-app.firebaseio.com",
});

const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket("explified-app.appspot.com");

module.exports = { db, auth };
module.exports.mybucket = bucket;

This is the backend of the **Explified App**, built using **Firebase Cloud Functions** with **Express.js**. It includes user authentication with JWT, secure cookies, Firestore as the database, and CORS support.

### FOLDER STRUCTURE

explified-app/
├── public/
├── functions/
│ ├── index.js
│ ├── package.json
│ └── ...  
├── firebase.json
├── .firebaserc

### AUTHENTICATION

functions/models/userModel.js
functions/routes/userRoute.js
functions/controllers/userController.js

### GITHUB PULL

git pull origin "master"

# GITHUB PUSH

git add .
git commit -m "your message"
git push origin "Branchname"

### FIREBASE SETUP

firebase init

### DEPLOY

npm run build
firebase deploy

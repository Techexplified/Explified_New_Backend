require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const db = require("./src/config/db");
const userRouter = require("./src/routes/userRoute");

const port = process.env.PORT || 3000;
const app = express();

// const corsOptions = {
//   origin: "http://localhost:5173",
//   methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
//   credentials: true,
// };

//MIDDLEWARES
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

//ROUTES
app.use("/api/users", userRouter);

app.get("/firebase-status", async (req, res) => {
  try {
    // Simple Firestore read to verify connection
    res.status(200).json({ message: "Firebase connected successfully!" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Firebase connection failed!", error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}...`);
});

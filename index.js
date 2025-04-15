const dotenv = require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const userRouter = require("./src/routes/userRoute");

const port = process.env.PORT || 3000;
const app = express();

// origin: "https://localhost:5173",
const corsOptions = {
  origin: "*",
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  credentials: true,
};

//MIDDLEWARES
app.use(cors(corsOptions));
// app.options("*", cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

//ROUTES
app.use("/api/users", userRouter);

app.get("/firebase-status", async (req, res) => {
  try {
    res.status(200).json({
      message: "Firebase connected successfully!"
    });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Firebase connection failed!",
        error: error.message
      });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}...`);
});
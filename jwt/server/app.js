const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const cors = require("cors");
const userRoute = require("./routes/userRoutes");

const { authUser } = require("./controller/authController");
require("dotenv").config();
const app = express();
const option = { useNewUrlParser: true, useUnifiedTopology: true };

mongoose
  .connect(
    "mongodb+srv://grade:kYeTcVAvw76nl5Od@cluster0.rk1ef.mongodb.net/grade?retryWrites=true&w=majority",
    option
  )
  .then(() => {
    console.log("database connected");
    app.listen(3001, () => {
      console.log("server connected");
    });
  });
app.use(cors({ origin: true }));
app.use(express.json());

app.use("/user", userRoute);

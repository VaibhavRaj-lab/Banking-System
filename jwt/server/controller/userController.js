const User = require("../model/userSchema");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const crypto = require("crypto");
require("dotenv").config();

const CLIENT_ID =
  "292681487564-9jt70crm3k06nl5827t2svaue4lu7mpp.apps.googleusercontent.com";
const CLIENT_SECRET = "ygI11qJarpAxPO_TBcNo98sI";
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const REFRESH_TOKEN =
  "1//04cyzfsA9pJYRCgYIARAAGAQSNwF-L9IrYdtmkFDqec6PshGIUyPHL3I39nLIN0lzMaOpAZV_aprJNfGn9C9xestj10Pl_rfu3TQ";

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

exports.postLogin = (req, res) => {
  const { email, password, phone, token } = req.body;
  console.log(email);
  console.log(token);
  User.findOne({ $or: [{ email }, { phone }] }).then(async (user) => {
    console.log(user);
    if (user) {
      if (!token) {
        const doMatch = await bcrypt.compare(password, user.password);
        if (doMatch) {
          jwt.sign(
            { user: { id: user.id } },
            process.env.TOKEN_SECRET,
            { expiresIn: "1h" },
            async (err, token) => {
              user.isLoggedIn = true;
              await user.save();
              console.log(token);
              res.json({
                token: token,
                user: user,
              });
            }
          );
        } else {
          res.status(401).json({ error: "Password Incorrect" });
        }
      } else {
        res.status(400).json({
          error: "User Already Logged In",
        });
      }
    } else {
      res.status(400).json({ error: "No User Exist" });
    }
  });
};

exports.postSignup = async (req, res) => {
  const { email, password, name, phone, interest } = req.body;
  const emailExist = await User.findOne({ email: email });
  if (emailExist)
    return res.status(400).json({ error: "email already exists" });
  const hashed = await bcrypt.hash(password, 12);
  if (hashed) {
    const user = new User({
      name,
      email,
      phone,
      interest,
      password: hashed,
    });
    user.save().then(() => {
      const token = jwt.sign({ user: user._id }, process.env.TOKEN_SECRET);
      return res.json({ user, token });
    });
  }
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.json({ err });
    }
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          return res.json({ error: "User Not Found" });
        }

        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save().then(async (result) => {
          const accessToken = await oAuth2Client.getAccessToken();
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              type: "OAuth2",
              user: "vaibhav456654@gmail.com",
              clientId: CLIENT_ID,
              clientSecret: CLIENT_SECRET,
              refreshToken: REFRESH_TOKEN,
              accessToken: accessToken,
            },
          });

          transporter
            .sendMail({
              to: req.body.email,
              from: "vaibhav456654@gmail.com",
              subject: "Securely Reset Password",
              html: `
            <p>Someone (hopefully you) has requested a password reset for your account. Follow the link below to set a new password:

            <h4>Click this 'http://localhost:3000/newpassword/?id=${token}' to set a new password.</h4>
            
            If you don't wish to reset your password, disregard this email and no action will be taken.
            
            Grado Team
            </p>
            
          `,
            })
            .then((result) => {
              res.json({ user: "Email Sent" });
            });
        });
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};
exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      let message = req.flash("error");
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "New Password",
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postNewPassword = (req, res, next) => {
  const password = req.body.password;
  // const userId = req.body.userId;
  const passwordToken = req.body.id;

  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(password, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.postLogout = (req, res, next) => {};

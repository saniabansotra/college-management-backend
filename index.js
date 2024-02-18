const express = require("express");
const app = express();
app.use(express.json());
const cookies = require("cookie-parser");
app.use(cookies());
const verifyToken = require("./tokens/verifyToken");
const generateToken = require("./tokens/generateToken");
require("dotenv").config();
const connectDatabase = require("./connection/db");
const USER_MODEL = require("./models/User");
const { encrytPassword, verifyPassword } = require("./functions/encryption");
const { sendLoginOtp, verifyOtp } = require("./functions/otp");

app.get("/public", (req, res) => {
  try {
    return res.json({ success: true, message: "Hello from the public api " });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, error: error.message });
  }
});

const checkIfUserLoggedIn = (req, res, next) => {
  if (verifyToken(req.cookies.auth_tk)) {
    const userinfo = verifyToken(req.cookies.auth_tk);
    req.userid = userinfo.id;
    next();
  } else {
    return res.status(401).json({ success: false, error: "UNAUTHORIZED" });
  }
};
app.get("/savedposts", checkIfUserLoggedIn, (req, res) => {
  try {
    let loggedId = req.userid;
    let notifications = {
      "65aaaa10b10198488ee3434": "Notificaiton 1",
      "65aaaa10b10198488e4546": "Notification 22",
      "65aaaa10b10198488ee3e12f": "Notification of logged in user",
      "65abff80c224b1a6dbdcf629": "Notification of new user",
    };
    return res.json({ success: true, message: notifications[loggedId] });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get("/youtubehistory", checkIfUserLoggedIn, (req, res) => {
  try {
    return res.json({ success: true, message: "hello this is your friends" });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get("/getloggedinuser", checkIfUserLoggedIn, async (req, res) => {
  try {
    const loggedInuser = await USER_MODEL.findOne({ _id: req.userid });

    return res.json({ success: true, loggedInuser });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get("/chats", checkIfUserLoggedIn, (req, res) => {
  try {
    return res.json({ success: true, message: "hello this is your chats" });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get("/test", checkIfUserLoggedIn, (req, res) => {
  try {
    return res.json({ success: true, message: "Hello from the middleware" });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post("/signup", async (req, res) => {
  try {
    const checkuser = await USER_MODEL.findOne({
      email: req.body.email.toLowerCase(),
    });
    if (checkuser) {
      return res
        .status(400)
        .json({ success: false, error: "User already registered" });
    }
    const newUser = new USER_MODEL({
      email: req.body.email,
      password: await encrytPassword(req.body.password),
      name: req.body.name,
      dob: req.body.dob,
      phonenumber: req.body.phonenumber,
      isUnder18: req.body.isUnder18,
    });
    await newUser.save();
    return res.json({ success: true, message: "Signed up success" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, error: error.message });
  }
});
// app.post("/login", (req, res) => {
//   try {
//     console.log(req.body);
//     let userid = req.body.userid;
//     if (req.body.password === "backendstorepassword") {
//       const token = generateToken(userid);
//       console.log(token);
//       res.cookie("ashu_tk", token); // cookie set code
//       return res.json({ success: true, message: "Cookie generate success" });
//     } else {
//       return res
//         .status(400)
//         .json({ success: false, error: "Incorrect credentials" });
//     }
//   } catch (error) {
//     res.status(400).json({ success: false, error: error.message });
//   }
// });

app.post("/login", async (req, res) => {
  try {
    let email = req.body.useremail;
    let inputpassword = req.body.userpassword;
    const checkUser = await USER_MODEL.findOne({ email: email });
    if (!checkUser) {
      return res
        .status(400)
        .json({ success: false, error: "User not found, please signup first" });
    }
    let originalpassword = checkUser.password;

    if (await verifyPassword(inputpassword, originalpassword)) {
      sendLoginOtp(`+91${checkUser.phonenumber}`);
      // here we will do 2fa processs which we will send otp to the logged in user
      // const token = generateToken(checkUser._id);
      // res.cookie("auth_tk", token);
      return res.json({ success: true, message: "Please enter OTP to login" });
    } else {
      return res
        .status(400)
        .json({ success: false, error: "Incorrect password" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, error: error.message });
  }
});

//first factor
app.post("/mfaverify", async (req, res) => {
  try {
    let email = req.body.useremail;
    let inputpassword = req.body.userpassword;
    let code = req.body.code;
    const checkUser = await USER_MODEL.findOne({ email: email });
    if (!checkUser) {
      return res
        .status(400)
        .json({ success: false, error: "User not found, please signup first" });
    }
    let originalpassword = checkUser.password;

    if (
      (await verifyPassword(inputpassword, originalpassword)) &&
      (await verifyOtp(`+91${checkUser.phonenumber}`, code))
    ) {
      const token = generateToken(checkUser._id);
      res.cookie("auth_tk", token);
      return res.json({ success: true, message: "Logged in success" });
    } else {
      return res
        .status(400)
        .json({ success: false, error: "Incorrect credentials" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, error: error.message });
  }
});

app.get("/currentuser", checkIfUserLoggedIn, async (req, res) => {
  try {
    const userid = req.userid;
    const userdetails = await USER_MODEL.findOne(
      { _id: userid },
      { email: 1, name: 1, dob: 1, phonenumber: 1, isUnder18: 1, createdAt: 1 }
    );
    if (userdetails) {
      return res.json({ success: true, data: userdetails });
    } else {
      return res.status(400).json({ success: false, error: "User not found" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, error: error.message });
  }
});

app.get("/logout", (req, res) => {
  try {
    res.clearCookie("auth_tk");
    return res.json({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, error: error.message });
  }
});

connectDatabase();
app.listen(5000, () => {
  console.log("Server is running at port 5000");
});

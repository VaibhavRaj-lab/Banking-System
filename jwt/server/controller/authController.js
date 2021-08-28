const jwt = require("jsonwebtoken");
require("dotenv").config();

const checkToken = (req) => {
  const header = req.headers["authorization"];
  console.log(header);
  if (typeof header !== "undefined") {
    const bearer = header.split(" ");
    return { success: true, token: bearer[1] };
  } else {
    return { success: false };
  }
};
exports.authUser = async (req, res, next) => {
  var result = await checkToken(req);
  console.log(result);
  if (result.success === true && result.token != undefined) {
    try {
      const decoded = await jwt.verify(result.token, process.env.TOKEN_SECRET);
      if (decoded.user) {
        req.user = decoded.user;
        next();
      } else {
        return res
          .status(401)
          .json({ success: false, msg: "Token Is Not Valid" });
      }
    } catch (ex) {
      return res
        .status(403)
        .json({ success: false, msg: "Token Is Not Valid" });
    }
  } else {
    return res.status(403).json({ success: false, msg: "Token Is Not Valid" });
  }
};

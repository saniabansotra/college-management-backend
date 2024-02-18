const jwt = require("jsonwebtoken");

const generateToken = (userid) => {
  try {
    const token = jwt.sign({ id: userid }, "secretKey", { expiresIn: "24h" });
    return token;
  } catch (error) {
    console.log(error);
  }
};

//payload is the details of user from which the cookie is generated.
//  While verifying we can decode the details of the user who generated cookie

module.exports = generateToken;

//jsonwebtoken

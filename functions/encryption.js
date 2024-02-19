const bcrypt = require("bcryptjs");

//this will be used when signup
const encrytPassword = async (originalpassword) => {
  try {
    let encryptedPassword = await bcrypt.hash(originalpassword, 10);
    return encryptedPassword;
  } catch (error) {
    console.log(error);
  }
};

//this will be used on login
const verifyPassword = async (inputPassword, encryptedPassword) => {
  try {
    const checkPass = await bcrypt.compare(inputPassword, encryptedPassword);
    return checkPass;
  } catch (error) {
    console.log(error);
  }
};

module.exports = { encrytPassword, verifyPassword };
const nodemailer = require("nodemailer");

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "om003med@gmail.com", // Your Gmail ID
    pass: "zjyo xlnp dtyw bint", // Your Gmail App Password
  },
});






module.exports = { transporter };

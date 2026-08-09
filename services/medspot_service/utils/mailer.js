const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOtpEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"MedSpot" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Password Reset OTP",
    html: `
      <h3>Your OTP Code</h3>
      <p><b>${otp}</b></p>
      <p>This OTP is valid for 3 minutes.</p>
    `
  });
};

const sendApprovalEmail = async (email, pharmacyName) => {
  await transporter.sendMail({
    from: `"MedSpot" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Pharmacy Approved",
    html: `
      <h2>Congratulations</h2>
      <p>${pharmacyName} has been approved.</p>
      <p>You may now login.</p>
    `
  });
};

const sendRejectionEmail = async (email, pharmacyName) => {
  await transporter.sendMail({
    from: `"MedSpot" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Pharmacy Registration Rejected",
    html: `
      <h2>Registration Rejected</h2>
      <p>${pharmacyName} could not be approved.</p>
    `
  });
};


module.exports = {
  sendOtpEmail,
  sendApprovalEmail,
  sendRejectionEmail
};
var nodemailer = require("nodemailer");

async function sendNewMail(email, title, body) {
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "support@oxhain.com",
      pass: "Ql3w5wwe@",
    },
  });

  var mailOptions = {
    from: "support@oxhain.com",
    to: email,
    subject: title,
    text: body,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return "false";
    } else {
      return "true";
    }
  });
}
module.exports = {
  sendMail: sendNewMail,
};

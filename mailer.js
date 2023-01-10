var nodemailer = require("nodemailer");
// const { Vonage } = require("@vonage/server-sdk");

async function sendNewMail(email, title, body) {
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "support@oxhain.com",
      pass: "Ql3w5wwe@",
    },
  });

  let htmlTemplate =
    `<div style='width:500px; height:auto; background-color:white; border:1px solid #9932CC; border-radius:5px; margin:0 auto; text-align:center;'>
   
    <h1 style='color:gray'>Oxhain Exchange</h1>
    <img src='https://pbs.twimg.com/profile_images/1584899893746978817/1Rv7NKve_400x400.jpg' style='width:100px; height:100px; margin:0 auto;'>
    <p style='margin:0 auto; margin-top:15px; font-size:18px;'><b>` +
    title +
    `</b></p>
    <p style='margin:0 auto; margin-top:5px; color:gray;'>` +
    body +
    `</p></br>

    <div style='width:90%; height:1px; background-color:#9932CC; margin:0 auto;'></div></br>
    

    <a href='#' style='text-decoration:none; color:gray; font-size:12px;'>Privacy Policy</a>
    <a href='#' style='text-decoration:none; color:gray; font-size:12px;'>Terms of Use</a>
    <a href='#' style='text-decoration:none; color:gray; font-size:12px;'>Contact Us</a>
    </br></br>

    <p style='margin:0 auto; margin-top:5px; color:gray;'>Oxhain Exchange</p>
    <p style='margin:0 auto; margin-top:5px; color:gray;'>
    Esentepe, Büyükdere Cd.</br>
    34394 Şişli/İstanbul</br>
    </p>

    <p style='margin:0 auto; margin-top:5px; color:gray;'>1-800-555-1234</br>
    
    </p>
    </br>
    <a href='#'><img src='https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/2048px-Instagram_logo_2016.svg.png' style='width:20px; height:20px; margin:0 auto;'></a>
    <a href='#'><img src='https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Twitter-logo.svg/512px-Twitter-logo.svg.png' style='width:20px; height:20px; margin:0 auto;'></a>
    <a href='#'><img src='https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/1024px-Facebook_Logo_%282019%29.png' style='width:20px; height:20px; margin:0 auto;'></a>

    </br></br>

    <p style='margin:0 auto; margin-top:5px; margin-bottom:15px; color:gray;'>© 2022 Oxhain Exchange. All rights reserved.</p>
    </div>`;
  var mailOptions = {
    from: "support@oxhain.com",
    to: email,
    subject: title,
    html: htmlTemplate,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return "false";
    } else {
      return "true";
    }
  });
}

async function sendNewSMS(phone, body) {
  return "true";
}

// const Vonage = require("@vonage/server-sdk");
// const vonage = new Vonage({
//   apiKey: "7a0824e9",
//   apiSecret: "dKIx7aTAEr21jEDN",
// });
// async function sendNewSMS(mobileNumber, params) {
//   const from = "Vonage APIs";
//   const to = mobileNumber ;
//   const text = params;
//   await vonage.sms
//     .send({ to, from, text })
//     .then((resp) => {
//       console.log("Message sent successfully");
//       console.log(resp);
//     })
//     .catch((err) => {
//       console.log("There was an error sending the messages.");
//       console.error(err);
//     });
//   return true;
// }
module.exports = {
  sendMail: sendNewMail,
  sendSMS: sendNewSMS,
};

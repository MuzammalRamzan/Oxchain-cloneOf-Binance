const mailer = require('../mailer');


const sender = async (req, res) => {


    //create mail template



    let htmlTemplate = `<div style='width:500px; height:auto; background-color:white; border:1px solid #9932CC; border-radius:5px; margin:0 auto; text-align:center;'>
   
    <h1 style='color:gray'>Oxhain Exchange</h1>
    <img src='https://pbs.twimg.com/profile_images/1584899893746978817/1Rv7NKve_400x400.jpg' style='width:100px; height:100px; margin:0 auto;'>
    <p style='margin:0 auto; margin-top:15px; font-size:18px;'><b>Order Filled</b></p>
    <p style='margin:0 auto; margin-top:5px; color:gray;'>Your limit order has been filled.</p></br>

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


    mailer.sendMail('volkansaka1@hotmail.com', 'Test', htmlTemplate);

    res.json({ message: 'Mail sent' });



}

module.exports = sender;


const User = require("../../models/User");
const Wallet = require("../../models/Wallet");
const WalletAddress = require("../../models/WalletAddress");
const Network = require("../../models/Network");
const CoinList = require("../../models/CoinList");
const Referral = require("../../models/Referral");
const RegisterMail = require("../../models/RegisterMail");
const RegisterSMS = require("../../models/RegisterSMS");
const UserRef = require("../../models/UserRef");
const LoginLogs = require("../../models/LoginLogs");
const SecurityKey = require("../../models/SecurityKey");
const axios = require("axios");
const Device = require("../../models/Device");
const NotificationTokens = require("../../models/NotificationTokens");
var authFile = require("../../auth.js");
var utilities = require("../../utilities.js");
const MarginCrossWallet = require("../../models/MarginCrossWallet");
const MarginIsolatedWallet = require("../../models/MarginIsolatedWallet");
const { getApplicantStatus } = require("../../sumsub");
const FutureWalletModel = require("../../models/FutureWalletModel");
const WithdrawalWhiteListModel = require("../../models/WithdrawalWhiteList");
const OneStepWithdrawModel = require("../../models/OneStepWithdraw");
const SiteNotificationsModel = require("../../models/SiteNotifications");
const VerificationIdModel = require("../../models/VerificationId");
const ApiRequest = require("../../models/ApiRequests");
const ApiKeysModel = require("../../models/ApiKeys");
const AITradeWalletModel = require("../../models/AITradeWallet");
const mailer = require("../../mailer");


const SMSVerificationModel = require("../../models/SMSVerification");
const MailVerificationModel = require("../../models/MailVerification");



const moment = require("moment");

const momenttz = require("moment-timezone");

const { getToken } = require("../../auth");

const MarginWalletId = "62ff3c742bebf06a81be98fd";

const login = async (req, res) => {

  let mailVerificationSent = false;
  let smsVerificationSent = false;

  let pinSent = false;
  let newRegisteredId;
  var api_key_result = req.body.api_key;
  var deviceName = "null";
  var deviceToken = "null";
  var deviceOS = "null";
  var deviceVersion = "null";
  var deviceType = "null";
  var manufacturer = "null";

  var ip = req.headers["client-ip"] || "null";

  console.log("IP: " + ip);
  var searchType = req.body.searchType;
  var deviceModel = "null";
  var user_id = req.body.user_id;
  var loginType = req.body.loginType;
  var pin = req.body.pin;
  let city = "";



  if (req.body.deviceName != undefined) {
    deviceName = req.body.deviceName;
  }

  if (req.body.deviceModel != undefined) {
    deviceModel = req.body.deviceModel;
  }
  if (req.body.deviceVersion != undefined) {
    deviceVersion = req.body.deviceVersion;
  }
  if (req.body.deviceOS != undefined) {
    deviceOS = req.body.deviceOS;
  }

  if (req.body.deviceType != undefined) {
    deviceModel = req.body.deviceType;
  }

  if (req.body.manufacturer != undefined) {
    manufacturer = req.body.manufacturer;
  }


  let cCode = "";
  let getIP = await axios.get("http://ip-api.com/json/" + ip);
  if (getIP.data.status == "success") {
    city = getIP.data.country + ", " + getIP.data.city;
    cCode = getIP.data.countryCode;
  }



  var notificationToken = req.body.notificationToken;
  let result = await authFile.apiKeyChecker(api_key_result);
  let UserApiKey = false;
  let checkApiKeys = "";
  if (result === false) {

    checkApiKeys = await ApiKeysModel.findOne({
      api_key: api_key_result,
    }).exec();

    if (checkApiKeys != null) {
      UserApiKey = true;
    }
  }

  if (result === true || UserApiKey === true) {


    if (UserApiKey === true) {

      let newApiKeyRequest = new ApiRequest({
        user_id: checkApiKeys.user_id,
        request: "login",
        ip: ip,
        api_key: api_key_result,
      });
      newApiKeyRequest.save();
    }

    let user = "";

    if (searchType == "email") {

      user = await User.findOne({
        email: req.body.user,
      }).exec();
      if (user) {
        user = await User.findOne({
          email: req.body.user,
          password: utilities.hashData(req.body.password),
        }).exec();
        if (!user) {
          return res.json({
            status: "fail",
            message: "Incorrect Password",
            showableMessage: "Incorrect Password",
          });
        }
      }


    }
    else {
      user = await User.findOne({
        phone_number: req.body.user,
      }).exec();
      if (user) {
        user = await User.findOne({
          phone_number: req.body.user,
          password: utilities.hashData(req.body.password),
        }).exec();

        if (!user) {
          return res.json({
            status: "fail",
            message: "Incorrect Password",
            showableMessage: "Incorrect Password",
          });
        }
      }

    }

    let securityLevel = 0;
    if (user?.deleted) {
      return res.json({
        status: "fail",
        message: "user deleted",
        showableMessage: "User deleted",
      });
    }
    if (user != null) {


      let AITradeWalletCheck = await AITradeWalletModel.findOne({
        user_id: user._id,
      }).exec();

      if (AITradeWalletCheck == null) {
        let newAITradeWallet = new AITradeWalletModel({
          user_id: user._id,
          balance: 0,
          enabled: 0,
          status: 0,
        });

        newAITradeWallet.save();
      }


      let emailVerifyCheck = await RegisterMail.findOne({
        email: user.email,
        pin: pin,
        status: "1",
      });

      let smsVerifyCheck = await RegisterSMS.findOne({
        phone_number: user.phone_number,
        pin: pin,
        status: "1",
      });

      let emailVerifyExist = "";
      let smsVerifyExist = "";

      if (emailVerifyCheck != null) {
        emailVerifyExist = "yes";
      } else {
        emailVerifyExist = "no";
      }

      if (smsVerifyCheck != null) {
        smsVerifyExist = "yes";
      } else {
        smsVerifyExist = "no";
      }
      if (emailVerifyCheck && smsVerifyCheck) securityLevel = securityLevel + 1;

      if (req.body.city != undefined) {
        city = req.body.city;
      }

      let checkSiteNotifications = await SiteNotificationsModel.findOne({
        user_id: user._id,
      }).exec();

      if (checkSiteNotifications == null) {
        let siteNotifications = new SiteNotificationsModel({
          user_id: user._id,
          activities: 1,
          trade: 1,
          news: 1,
          system_messages: 1,
        });
        await siteNotifications.save();
      }
      let device_id = "";


      let requestDeviceId = req.body.device_id;

      if (requestDeviceId == undefined || requestDeviceId == null || requestDeviceId == "") {
        requestDeviceId = "No Device Id";
      }

      let checkDevice = await Device.findOne({
        user_id: user._id,
        deviceId: requestDeviceId,
      }).exec();

      if (checkDevice == null) {
        let device = new Device({
          user_id: user._id,
          deviceId: requestDeviceId,
          deviceName: deviceName,
          deviceType: deviceType,
          deviceOs: deviceOS,
          deviceVersion: deviceVersion,
          loginTime: Date.now(),
          loginRequest: "",
          ip: ip,
          city: city,
        });
        await device.save();

        device_id = device._id;
      }
      else {
        device_id = checkDevice._id;
      }

      req.session.device_id = device_id;

      var twofaStatus = user["twofa"];
      if (twofaStatus) securityLevel = securityLevel + 1;

      var results = [];
      var refId = "";
      let userRef = await UserRef.findOne({
        user_id: user._id,
      }).exec();

      const securityKey = await SecurityKey.find({
        user_id: user_id,
        status: 1,
      }).lean();
      if (securityKey) securityLevel = securityLevel + 1;

      let logs = await LoginLogs.find({
        user_id: user["_id"],
        deviceName: deviceName,
        manufacturer: manufacturer,
        model: deviceModel,
      })
        .sort({ $natural: -1 })
        .limit(1)
        .exec();

      //date now of istanbul

      let dateNow = moment().format("YYYY-MM-DD HH:mm:ss");

      //get timezone of user with country

      let timezoneList = [
        { name: "Afghanistan", code: "AF", gmt: "(UTC+04:30)", moment: "Asia/Kabul" },
        { name: "Albania", code: "AL", gmt: "(UTC+01:00)", moment: "Europe/Tirane" },
        { name: "Algeria", code: "DZ", gmt: "(UTC+01:00)", moment: "Africa/Algiers" },
        { name: "Argentina", code: "AR", gmt: "(UTC-03:00)", moment: "America/Argentina/Buenos_Aires" },
        { name: "Armenia", code: "AM", gmt: "(UTC+04:00)", moment: "Asia/Yerevan" },
        { name: "Australia", code: "AU", gmt: "(UTC+11:00)", moment: "Australia/Sydney" },
        { name: "Austria", code: "AT", gmt: "(UTC+01:00)", moment: "Europe/Vienna" },
        { name: "Azerbaijan", code: "AZ", gmt: "(UTC+04:00)", moment: "Asia/Baku" },
        { name: "Bahrain", code: "BH", gmt: "(UTC+03:00)", moment: "Asia/Bahrain" },
        { name: "Bangladesh", code: "BD", gmt: "(UTC+06:00)", moment: "Asia/Dhaka" },
        { name: "Belarus", code: "BY", gmt: "(UTC+03:00)", moment: "Europe/Minsk" },
        { name: "Belgium", code: "BE", gmt: "(UTC+01:00)", moment: "Europe/Brussels" },
        { name: "Belize", code: "BZ", gmt: "(UTC-06:00)", moment: "America/Belize" },
        { name: "Bhutan", code: "BT", gmt: "(UTC+06:00)", moment: "Asia/Thimphu" },
        { name: "Bolivia", code: "BO", gmt: "(UTC-04:00)", moment: "America/La_Paz" },
        { name: "Bosnia and Herzegovina", code: "BA", gmt: "(UTC+01:00)", moment: "Europe/Sarajevo" },
        { name: "Botswana", code: "BW", gmt: "(UTC+02:00)", moment: "Africa/Gaborone" },
        { name: "Brazil", code: "BR", gmt: "(UTC-02:00)", moment: "America/Sao_Paulo" },
        { name: "Brunei", code: "BN", gmt: "(UTC+08:00)", moment: "Asia/Brunei" },
        { name: "Bulgaria", code: "BG", gmt: "(UTC+02:00)", moment: "Europe/Sofia" },
        { name: "Cambodia", code: "KH", gmt: "(UTC+07:00)", moment: "Asia/Phnom_Penh" },
        { name: "Cameroon", code: "CM", gmt: "(UTC+01:00)", moment: "Africa/Douala" },
        { name: "Canada", code: "CA", gmt: "(UTC-03:30)", moment: "America/St_Johns" },
        { name: "Chile", code: "CL", gmt: "(UTC-04:00)", moment: "America/Santiago" },
        { name: "China", code: "CN", gmt: "(UTC+08:00)", moment: "Asia/Shanghai" },
        { name: "Colombia", code: "CO", gmt: "(UTC-05:00)", moment: "America/Bogota" },
        { name: "Congo (DRC)", code: "CD", gmt: "(UTC+01:00)", moment: "Africa/Kinshasa" },
        { name: "Costa Rica", code: "CR", gmt: "(UTC-06:00)", moment: "America/Costa_Rica" },
        { name: "Côte d’Ivoire", code: "CI", gmt: "(UTC+00:00)", moment: "Africa/Abidjan" },
        { name: "Croatia", code: "HR", gmt: "(UTC+01:00)", moment: "Europe/Zagreb" },
        { name: "Cuba", code: "CU", gmt: "(UTC-05:00)", moment: "America/Havana" },
        { name: "Czech Republic", code: "CZ", gmt: "(UTC+01:00)", moment: "Europe/Prague" },
        { name: "Denmark", code: "DK", gmt: "(UTC+01:00)", moment: "Europe/Copenhagen" },
        { name: "Djibouti", code: "DJ", gmt: "(UTC+03:00)", moment: "Africa/Djibouti" },
        { name: "Dominican Republic", code: "DO", gmt: "(UTC-04:00)", moment: "America/Santo_Domingo" },
        { name: "Ecuador", code: "EC", gmt: "(UTC-05:00)", moment: "America/Guayaquil" },
        { name: "Egypt", code: "EG", gmt: "(UTC+02:00)", moment: "Africa/Cairo" },
        { name: "El Salvador", code: "SV", gmt: "(UTC-06:00)", moment: "America/El_Salvador" },
        { name: "Eritrea", code: "ER", gmt: "(UTC+03:00)", moment: "Africa/Asmara" },
        { name: "Estonia", code: "EE", gmt: "(UTC+02:00)", moment: "Europe/Tallinn" },
        { name: "Ethiopia", code: "ET", gmt: "(UTC+03:00)", moment: "Africa/Addis_Ababa" },
        { name: "Faroe Islands", code: "FO", gmt: "(UTC+00:00)", moment: "Atlantic/Faroe" },
        { name: "Finland", code: "FI", gmt: "(UTC+02:00)", moment: "Europe/Helsinki" },
        { name: "France", code: "FR", gmt: "(UTC+01:00)", moment: "Europe/Paris" },
        { name: "Georgia", code: "GE", gmt: "(UTC+04:00)", moment: "Asia/Tbilisi" },
        { name: "Germany", code: "DE", gmt: "(UTC+01:00)", moment: "Europe/Berlin" },
        { name: "Greece", code: "GR", gmt: "(UTC+02:00)", moment: "Europe/Athens" },
        { name: "Greenland", code: "GL", gmt: "(UTC-03:00)", moment: "America/Godthab" },
        { name: "Guatemala", code: "GT", gmt: "(UTC-06:00)", moment: "America/Guatemala" },
        { name: "Haiti", code: "HT", gmt: "(UTC-05:00)", moment: "America/Port-au-Prince" },
        { name: "Honduras", code: "HN", gmt: "(UTC-06:00)", moment: "America/Tegucigalpa" },
        { name: "Hong Kong SAR", code: "HK", gmt: "(UTC+08:00)", moment: "Asia/Hong_Kong" },
        { name: "Hungary", code: "HU", gmt: "(UTC+01:00)", moment: "Europe/Budapest" },
        { name: "Iceland", code: "IS", gmt: "(UTC+00:00)", moment: "Atlantic/Reykjavik" },
        { name: "India", code: "IN", gmt: "(UTC+05:30)", moment: "Asia/Kolkata" },
        { name: "Indonesia", code: "ID", gmt: "(UTC+07:00)", moment: "Asia/Jakarta" },
        { name: "Iran", code: "IR", gmt: "(UTC+03:30)", moment: "Asia/Tehran" },
        { name: "Iraq", code: "IQ", gmt: "(UTC+03:00)", moment: "Asia/Baghdad" },
        { name: "Ireland", code: "IE", gmt: "(UTC+00:00)", moment: "Europe/Dublin" },
        { name: "Israel", code: "IL", gmt: "(UTC+02:00)", moment: "Asia/Jerusalem" },
        { name: "Italy", code: "IT", gmt: "(UTC+01:00)", moment: "Europe/Rome" },
        { name: "Jamaica", code: "JM", gmt: "(UTC-05:00)", moment: "America/Jamaica" },
        { name: "Japan", code: "JP", gmt: "(UTC+09:00)", moment: "Asia/Tokyo" },
        { name: "Jordan", code: "JO", gmt: "(UTC+02:00)", moment: "Asia/Amman" },
        { name: "Kazakhstan", code: "KZ", gmt: "(UTC+06:00)", moment: "Asia/Almaty" },
        { name: "Kenya", code: "KE", gmt: "(UTC+03:00)", moment: "Africa/Nairobi" },
        { name: "Korea", code: "KR", gmt: "(UTC+09:00)", moment: "Asia/Seoul" },
        { name: "Kuwait", code: "KW", gmt: "(UTC+03:00)", moment: "Asia/Kuwait" },
        { name: "Kyrgyzstan", code: "KG", gmt: "(UTC+06:00)", moment: "Asia/Bishkek" },
        { name: "Laos", code: "LA", gmt: "(UTC+07:00)", moment: "Asia/Vientiane" },
        { name: "Latvia", code: "LV", gmt: "(UTC+02:00)", moment: "Europe/Riga" },
        { name: "Lebanon", code: "LB", gmt: "(UTC+02:00)", moment: "Asia/Beirut" },
        { name: "Libya", code: "LY", gmt: "(UTC+02:00)", moment: "Africa/Tripoli" },
        { name: "Liechtenstein", code: "LI", gmt: "(UTC+01:00)", moment: "Europe/Vaduz" },
        { name: "Lithuania", code: "LT", gmt: "(UTC+02:00)", moment: "Europe/Vilnius" },
        { name: "Luxembourg", code: "LU", gmt: "(UTC+01:00)", moment: "Europe/Luxembourg" },
        { name: "Macao SAR", code: "MO", gmt: "(UTC+08:00)", moment: "Asia/Macau" },
        { name: "Macedonia, FYRO", code: "MK", gmt: "(UTC+01:00)", moment: "Europe/Skopje" },
        { name: "Malaysia", code: "MY", gmt: "(UTC+08:00)", moment: "Asia/Kuala_Lumpur" },
        { name: "Maldives", code: "MV", gmt: "(UTC+05:00)", moment: "Indian/Maldives" },
        { name: "Mali", code: "ML", gmt: "(UTC+00:00)", moment: "Africa/Bamako" },
        { name: "Malta", code: "MT", gmt: "(UTC+01:00)", moment: "Europe/Malta" },
        { name: "Mexico", code: "MX", gmt: "(UTC-06:00)", moment: "America/Mexico_City" },
        { name: "Moldova", code: "MD", gmt: "(UTC+02:00)", moment: "Europe/Chisinau" },
        { name: "Monaco", code: "MC", gmt: "(UTC+01:00)", moment: "Europe/Monaco" },
        { name: "Mongolia", code: "MN", gmt: "(UTC+08:00)", moment: "Asia/Ulaanbaatar" },
        { name: "Montenegro", code: "ME", gmt: "(UTC+01:00)", moment: "Europe/Podgorica" },
        { name: "Morocco", code: "MA", gmt: "(UTC+00:00)", moment: "Africa/Casablanca" },
        { name: "Myanmar", code: "MM", gmt: "(UTC+06:30)", moment: "Asia/Rangoon" },
        { name: "Nepal", code: "NP", gmt: "(UTC+05:45)", moment: "Asia/Kathmandu" },
        { name: "Netherlands", code: "NL", gmt: "(UTC+01:00)", moment: "Europe/Amsterdam" },
        { name: "New Zealand", code: "NZ", gmt: "(UTC+12:00)", moment: "Pacific/Auckland" },
        { name: "Nicaragua", code: "NI", gmt: "(UTC-06:00)", moment: "America/Managua" },
        { name: "Nigeria", code: "NG", gmt: "(UTC+01:00)", moment: "Africa/Lagos" },
        { name: "Norway", code: "NO", gmt: "(UTC+01:00)", moment: "Europe/Oslo" },
        { name: "Oman", code: "OM", gmt: "(UTC+04:00)", moment: "Asia/Muscat" },
        { name: "Pakistan", code: "PK", gmt: "(UTC+05:00)", moment: "Asia/Karachi" },
        { name: "Panama", code: "PA", gmt: "(UTC-05:00)", moment: "America/Panama" },
        { name: "Paraguay", code: "PY", gmt: "(UTC-04:00)", moment: "America/Asuncion" },
        { name: "Peru", code: "PE", gmt: "(UTC-05:00)", moment: "America/Lima" },
        { name: "Philippines", code: "PH", gmt: "(UTC+08:00)", moment: "Asia/Manila" },
        { name: "Poland", code: "PL", gmt: "(UTC+01:00)", moment: "Europe/Warsaw" },
        { name: "Portugal", code: "PT", gmt: "(UTC+00:00)", moment: "Europe/Lisbon" },
        { name: "Puerto Rico", code: "PR", gmt: "(UTC-04:00)", moment: "America/Puerto_Rico" },
        { name: "Qatar", code: "QA", gmt: "(UTC+03:00)", moment: "Asia/Qatar" },
        { name: "Réunion", code: "RE", gmt: "(UTC+04:00)", moment: "Indian/Reunion" },
        { name: "Romania", code: "RO", gmt: "(UTC+02:00)", moment: "Europe/Bucharest" },
        { name: "Russia", code: "RU", gmt: "(UTC+02:00)", moment: "Europe/Moscow" },
        { name: "Rwanda", code: "RW", gmt: "(UTC+02:00)", moment: "Africa/Kigali" },
        { name: "Saudi Arabia", code: "SA", gmt: "(UTC+03:00)", moment: "Asia/Riyadh" },
        { name: "Senegal", code: "SN", gmt: "(UTC+00:00)", moment: "Africa/Dakar" },
        { name: "Serbia", code: "RS", gmt: "(UTC+01:00)", moment: "Europe/Belgrade" },
        { name: "Singapore", code: "SG", gmt: "(UTC+08:00)", moment: "Asia/Singapore" },
        { name: "Slovakia", code: "SK", gmt: "(UTC+01:00)", moment: "Europe/Bratislava" },
        { name: "Slovenia", code: "SI", gmt: "(UTC+01:00)", moment: "Europe/Ljubljana" },
        { name: "Somalia", code: "SO", gmt: "(UTC+03:00)", moment: "Africa/Mogadishu" },
        { name: "South Africa", code: "ZA", gmt: "(UTC+02:00)", moment: "Africa/Johannesburg" },
        { name: "Spain", code: "ES", gmt: "(UTC+01:00)", moment: "Europe/Madrid" },
        { name: "Sri Lanka", code: "LK", gmt: "(UTC+05:30)", moment: "Asia/Colombo" },
        { name: "Sweden", code: "SE", gmt: "(UTC+01:00)", moment: "Europe/Stockholm" },
        { name: "Switzerland", code: "CH", gmt: "(UTC+01:00)", moment: "Europe/Zurich" },
        { name: "Syria", code: "SY", gmt: "(UTC+02:00)", moment: "Asia/Damascus" },
        { name: "Taiwan", code: "TW", gmt: "(UTC+08:00)", moment: "Asia/Taipei" },
        { name: "Tajikistan", code: "TJ", gmt: "(UTC+05:00)", moment: "Asia/Dushanbe" },
        { name: "Thailand", code: "TH", gmt: "(UTC+07:00)", moment: "Asia/Bangkok" },
        { name: "Trinidad and Tobago", code: "TT", gmt: "(UTC-04:00)", moment: "America/Port_of_Spain" },
        { name: "Tunisia", code: "TN", gmt: "(UTC+01:00)", moment: "Africa/Tunis" },
        { name: "Turkey", code: "TR", gmt: "(UTC+02:00)", moment: "Europe/Istanbul" },
        { name: "Turkmenistan", code: "TM", gmt: "(UTC+05:00)", moment: "Asia/Ashgabat" },
        { name: "Ukraine", code: "UA", gmt: "(UTC+02:00)", moment: "Europe/Kiev" },
        { name: "United Arab Emirates", code: "AE", gmt: "(UTC+04:00)", moment: "Asia/Dubai" },
        { name: "United Kingdom", code: "GB", gmt: "(UTC+00:00)", moment: "Europe/London" },
        { name: "United States", code: "US", gmt: "(UTC-05:00)", moment: "America/New_York" },
        { name: "Uruguay", code: "UY", gmt: "(UTC-03:00)", moment: "America/Montevideo" },
        { name: "Uzbekistan", code: "UZ", gmt: "(UTC+05:00)", moment: "Asia/Tashkent" },
        { name: "Venezuela", code: "VE", gmt: "(UTC-04:00)", moment: "America/Caracas" },
        { name: "Vietnam", code: "VN", gmt: "(UTC+07:00)", moment: "Asia/Ho_Chi_Minh" },
        { name: "Yemen", code: "YE", gmt: "(UTC+03:00)", moment: "Asia/Aden" },
        { name: "Zimbabwe", code: "ZW", gmt: "(UTC+02:00)", moment: "Africa/Harare" }
      ];





      let createdAt = "";
      if (logs.length > 0) {


        //moment.tz.setDefault("Europe/Istanbul");

        let timezone = timezoneList.find((item) => item.code == cCode);
        console.log("timezone", timezone.moment);
        //set the timezone
        momenttz.tz.setDefault(timezone.moment.toString());
        createdAt = moment(logs[0]["createdAt"]);
        logs[0]["createdAt"] = createdAt;
      }



      if (userRef != null) refId = userRef["refCode"] ?? "";
      else refId = "";

      let VerificationCheck = await VerificationIdModel.findOne({
        user_id: user._id,
      }).exec();

      let verificationStatus;
      if (VerificationCheck != null) {
        if (VerificationCheck.status == 1) {
          verificationStatus = "verified";
        }

        if (VerificationCheck.status == 0) {
          verificationStatus = "pending";
        }

        if (VerificationCheck.status == 2) {
          verificationStatus = "rejected";
        }
      } else {
        verificationStatus = "Not Verified";
      }

      let loginLogCheck = await LoginLogs.findOne({
        user_id: user._id,
        deviceId: requestDeviceId,
        status: "completed"
      }).exec();


      console.log("User: " + user._id);
      console.log("Login Loglar: " + loginLogCheck);
      if (loginLogCheck == null) {

        console.log("Login Logu Yok");
        //burada pin göndereceğiz 

        pinSent = true;
        //generate random pin
        var verificationPin = Math.floor(100000 + Math.random() * 900000);


        if (user.email != undefined && user.email != "" && user.email != null) {

          let mailCheck = await MailVerificationModel.findOne({
            user_id: user._id,
            reason: "login_verification",
          }).exec();

          if (mailCheck != null) {
            mailCheck.pin = verificationPin;
            mailCheck.status = "0";
            await mailCheck.save();
          }
          else {
            let newMailVerification = new MailVerificationModel({
              user_id: user._id,
              pin: verificationPin,
              reason: "login_verification",
              status: "0",
            });

            await newMailVerification.save();
          }

          console.log("Mail Gönderildi");
          mailVerificationSent = true;
          await mailer.sendMail(user.email, "New Login", "An unusual login has been detected from your account. </br><p style='font-weight:bold'>Pin:" + verificationPin + "</p> If you did not authorize this login, please contact support immediately.");

        }
        else {
          verificationPin = "000000";
          if (user.phone_number != undefined && user.phone_number != "" && user.phone_number != null) {
            smsVerificationSent = true;

            let smsCheck = await SMSVerificationModel.findOne({
              user_id: user._id,
              reason: "login_verification",
            }).exec();

            if (smsCheck != null) {
              smsCheck.pin = verificationPin;
              smsCheck.status = "0";
              await smsCheck.save();
            }
            else {
              let newSMSVerification = new SMSVerificationModel({
                user_id: user._id,
                pin: verificationPin,
                reason: "login_verification",
                status: "0",
              });
              await newSMSVerification.save();
            }
            let smsText = "An unusual login has been detected from your account. Verification Pin:" + verificationPin + " If you did not authorize this login, please contact support immediately.";
            mailer.sendSMS(user.country_code, user.phone_number, smsText);
          }
        }
      }


      //get timezone of user from
      var data = {
        response: "success",
        email: user.email,
        country_code: user.country_code ?? "",
        phone_number: user.phone_number ?? "",
        twofa: twofaStatus,
        emailVerify: emailVerifyExist,
        smsVerify: smsVerifyExist,
        device_id: device_id,
        status: user["status"],
        user_id: user["_id"],
        ref_id: refId,
        securityLevel,
        device_token: device_id,
        avatar: user.avatar ?? "",
        token: getToken({ user: user_id }),
        name: user.name,
        nickname: user.nickname,
        showableUserId: user.showableUserId,
        last_login: logs,
        verificationStatus: verificationStatus,
        mailVerificationSent: mailVerificationSent,
        smsVerificationSent: smsVerificationSent,
      };


      var status = user["status"];

      if (status == "1") {
        let coins = await CoinList.find({ status: 1 }).exec();

        let networks = await Network.find({ status: 1 }).exec();

        for (let x = 0; x < networks.length; x++) {
          let walletAddressCheck = await WalletAddress.findOne({
            user_id: user._id,
            network_id: networks[x]._id,
          }).exec();

          if (walletAddressCheck == null) {
            let privateKey = "";
            let address = "";
            if (networks[x].symbol === "ERC") {
              let url = "http://" + process.env.ERC20HOST + "/create_address";
              let walletTest = await axios.post(url);
              privateKey = walletTest.data.data.privateKey;
              address = walletTest.data.data.address;
            }

            if (networks[x].symbol === "BSC") {
              let url = "http://" + process.env.BSC20HOST + "/create_address";
              let walletTest = await axios.post(url);
              privateKey = walletTest.data.data.privateKey;
              address = walletTest.data.data.address;
            }

            if (networks[x].symbol === "TRC") {
              let url = "http://" + process.env.TRC20HOST + "/create_address";
              let walletTest = await axios.post(url);
              privateKey = walletTest.data.data.privateKey;
              address = walletTest.data.data.address.base58;
            }

            if (networks[x].symbol === "SEGWIT") {
              let createBTC = await axios.request({
                method: "post",
                url: "http://" + process.env.BTCSEQHOST,
                data: "request=create_address",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
              });

              address = createBTC.data.message;
            }

            if (networks[x].symbol === "SOL") {
              let url = "http://" + process.env.SOLANAHOST + "/create_address";
              let walletTest = await axios.post(url);
              privateKey = JSON.stringify(walletTest.data.data.pKey);
              address = walletTest.data.data.address;
            }

            let walletAddress = new WalletAddress({
              user_id: user._id,
              network_id: networks[x]._id,
              address: address,
              private_key: privateKey,
              wallet_address: address,
            });

            await walletAddress.save();
          }
        }
        for (let i = 0; i < coins.length; i++) {
          let walletResult = await WalletAddress.findOne({
            user_id: user._id,
            coin_id: coins[i]._id,
          }).exec();

          if (walletResult === null) {
          } else {
          }

          //Margin Wallet Check
          let margin_cross_check = await MarginCrossWallet.findOne({
            user_id: user._id,
            coin_id: coins[i]._id,
          });
          if (margin_cross_check == null) {
            let createWallet = new MarginCrossWallet({
              user_id: user._id,
              coin_id: coins[i]._id,
              symbol: coins[i].symbol,
              amount: 0.0,
              type: "margin_cross",
              pnl: 0.0,
              totalBonus: 0.0,
              status: 1,
            });
            await createWallet.save();
          }

          let margin_isole_check = await MarginIsolatedWallet.findOne({
            user_id: user._id,
            coin_id: coins[i]._id,
          });
          if (margin_isole_check == null) {
            let createWallet = new MarginIsolatedWallet({
              user_id: user._id,
              coin_id: coins[i]._id,
              symbol: coins[i].symbol,
              amount: 0.0,
              type: "margin_isolated",
              pnl: 0.0,
              totalBonus: 0.0,
              status: 1,
            });
            await createWallet.save();
          }

          //End check
          const newWallet = new Wallet({
            name: coins[i]["name"],
            symbol: coins[i]["symbol"],
            user_id: user["id"],
            amount: 0,
            coin_id: coins[i]["id"],
            type: "spot",
            status: 1,
          });

          let wallets = await Wallet.findOne({
            user_id: user["_id"],
            coin_id: coins[i]["id"],
          }).exec();

          if (wallets == null) {
            newWallet.save();
          } else {
          }
        }

        // Future Wallet Check

        let future_wallet_check = await FutureWalletModel.findOne({
          user_id: user._id,
        });
        if (future_wallet_check == null) {
          let createWallet = new FutureWalletModel({
            user_id: user._id,
            coin_id: MarginWalletId,
            symbol: "USDT",
            amount: 0.0,
            type: "future",
            pnl: 0.0,
            totalBonus: 0.0,
            status: 1,
          });
          await createWallet.save();
        }

        //get ip of user
        const newUserLog = new LoginLogs({
          user_id: user["_id"],
          ip: ip,
          deviceName: deviceName,
          manufacturer: manufacturer,
          deviceId: requestDeviceId,
          model: deviceModel,
          deviceOS: req.body.deviceOS ?? "Unknown",
          status: pinSent ? "pin_sent" : "success",
        });
        let room = await newUserLog.save();
        newRegisteredId = room.id;

        if (logs != null) {
          if (logs["trust"] == "yes") {
            data.trust = "yes";
            data.log_id = logs["_id"];
          } else {
            data.trust = "no";
            data.log_id = logs["_id"];
          }
        } else {
          data.trust = "no";
          data.log_id = newRegisteredId;
        }

        const withdrawalWhiteList = await WithdrawalWhiteListModel.findOne({
          user_id: user._id,
        }).lean();
        data.withdrawalWhiteList = !!withdrawalWhiteList?.status;
        const oneStepWithdraw = await OneStepWithdrawModel.findOne({
          user_id: user._id,
        }).lean();
        data.oneStepWithdraw = !!oneStepWithdraw?.status;

        if (user.applicantId) {
          const applicantData = await getApplicantStatus(user.applicantId);
          const applicantStatus =
            applicantData?.reviewResult?.reviewAnswer == "GREEN" ? 1 : 0;
          await User.updateOne(
            { _id: user_id },
            { $set: { applicantStatus } }
          );
        }



        let notificationCheck = await SiteNotificationsModel.findOne({
          user_id: user["_id"],
        }).exec();

        console.log("notificationCheck", notificationCheck);

        if (notificationCheck != null) {

          if (notificationCheck.system_messages == 1 || notificationCheck.system_messages == "1") {
            await mailer.sendMail(user.email, "Login", "Successfully logged in from " + ip);
          }
        }








        if (loginType == "mobile") {
          let response = await NotificationTokens.findOne({
            user_id: user["_id"],
            token_id: notificationToken,
          });

          if (response == null) {
            const newNotificationToken = new NotificationTokens({
              user_id: user["_id"],
              token_id: notificationToken,
            });
            newNotificationToken.save(function (err, room) {
              if (err) {
                throw err;
              } else {

                return res.json({ status: "success", data: data });
              }
            });
          } else {

            return res.json({ status: "success", data: data });
          }
        } else {
          return res.json({ status: "success", data: data });
        }
      }
      if (status == "0") {
        return res.json({
          status: "fail",
          message: "account_not_active",
          showableMessage: "Account not active",
        });
      }

      if (status == "5") {
        res.json({
          status: "fail",
          message: "account_disabled",
          showableMessage: "Account is disabled",
        });
      }
    }
    else {
      return res.json({
        status: "fail",
        message: "user_not_found",
        showableMessage: "User not Found",
      });
    }
  } else {
    return res.json({
      status: "fail",
      message: "Forbidden 403",
      showableMessage: "Forbidden 403",
    });
  }
};

module.exports = login;


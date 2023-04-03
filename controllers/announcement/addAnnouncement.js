const AnnouncementsModel = require("../../models/Announcements");
var authFile = require("../../auth");

const addAnnouncement = async (req, res) => {
  const { title, message } = req.body;

  let result = await authFile.apiKeyChecker(req.body.api_key);
  if (result == false) {
    return res.json({
      status: "false",
      message: "Forbidden 403",
    });
  }

  let key = req.headers["key"];

  if (!key) {
    return res.json({ status: "fail", message: "key_not_found" });
  }

  if (!req.body.device_id || !req.body.user_id) {
    return res.json({ status: "fail", message: "invalid_params" });
  }

  let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);


  if (checkKey === "expired") {
    return res.json({ status: "fail", message: "key_expired" });
  }

  if (!checkKey) {
    return res.json({ status: "fail", message: "invalid_key" });
  }


  const newAnnouncement = new AnnouncementsModel({
    title: title,
    message: message,
  });

  const save = await newAnnouncement.save();

  if (save) {
    return res.json({
      status: 200,
      message: "Announcement added",
      data: save,
    });
  } else {
    return res.json({
      status: 404,
      message: "Announcement not added",
    });
  }
};

module.exports = addAnnouncement;

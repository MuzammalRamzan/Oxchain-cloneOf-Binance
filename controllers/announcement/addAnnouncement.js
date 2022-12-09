const AnnouncementsModel = require("../../models/Announcements");

const addAnnouncement = async (req, res) => {
  const { title, message } = req.body;

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

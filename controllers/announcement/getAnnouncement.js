const AnnouncementsModel = require("../../models/Announcements");

const getAnnouncement = async (req, res) => {
  const find = await AnnouncementsModel.find({ status: 1 });
  if (find.length > 0) {
    return res.json({
      status: 200,
      message: "Announcement found",
      data: find,
    });
  } else
    return res.json({
      status: 404,
      message: "Announcement not found",
    });
};

module.exports = getAnnouncement;

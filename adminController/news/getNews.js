const NewsModal = require("../../models/News");
const Admin = require("../../models/Admin");
const authFile = require('../../auth');


const getNews = async (req, res) => {

    const { user_id, api_key,newsId } = req.body;

    const isAuthenticated = await authFile.apiKeyChecker(api_key);
    if (!isAuthenticated) {
        return res.status(403).json({
            status: 'Failed',
            message: '403 Forbidden',
            showableMessage: 'Forbidden 403, Please provide valid api key'
        });
    }

    var admin = await Admin.findOne({
        _id: user_id,
        status: 1
    });
    if (admin == null) {
        return res.json({
            status: "error",
            message: "Authorization Failed",
            showableMessage: "You are not authorized"
        });
    }
    const filter={}
    filter.status=1
    if(newsId){
        filter._id=newsId
    }
   

    const news = await NewsModal.find(filter).sort({ createdAt: -1 });

    if (news) {
        return res.status(200).json({
            status: "Success",
            message: "News found",
            showableMessage: "News found",
            news: news
        })
    }

    return res.status(200).json({
        status: "Success",
        message: "No News found",
        showableMessage: "No News found",
        news: []
    })


}

module.exports = getNews;
const { OAuth2Client } = require('google-auth-library');
const UserModel = require('../../models/User');

const client = new OAuth2Client('CLIENT_ID')

const googleLogin =  async (req, res) => {
    const { token }  = req.body
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: "CLIENT_ID",
    });
    const { name, email } = ticket.getPayload();    
    const user = await UserModel.updateOne({ email: email }, { name }, { upsert: true });
    res.json(user)
}

module.exports = googleLogin;
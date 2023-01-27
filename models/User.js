const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: false, default: null },
  surname: { type: String, required: false, default: null },
  email: { type: String, required: false, default: null },
  country_code: { type: String, required: false, default: null },
  phone_number: { type: String, required: false, default: null },
  birthday: { type: String, required: false, default: null },
  birth_place: { type: String, required: false, default: null },
  city: { type: String, required: false, default: null },
  country: { type: String, required: false, default: null },
  address: { type: String, required: false, default: null },
  id_type: { type: String, required: false, default: null },
  id_number: { type: String, required: false, default: null },
  id_type: { type: String, required: false, default: null },
  password: { type: String, required: false, default: null },
  twofa: { type: String, required: false, default: null, maxLength: 50 },
  nickname: { type: String, required: false, default: null },
  avatar: { type: String, required: false, default: null },
  applicantId: { type: String, required: false, default: null },
  status: { type: String, required: false, default: 0 },
  applicantStatus: { type: Number, required: false, default: 0 },
  showableUserId: { type: String, required: false, default: null },
  deleted: { type: Boolean, default: false },
  reason: { type: String, required: false },
  twitter_username: {type: String, default: ""},
  facebook_username: {type: String, default: ""},
  instagram_username: {type: String, default: ""},
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", UserSchema);

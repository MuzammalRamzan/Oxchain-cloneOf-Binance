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
  status: { type: String, required: false, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", UserSchema);

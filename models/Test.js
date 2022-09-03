const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: false },
  surname: { type: String, required: false },
  email: { type: String, required: true, unique: false},
  country_code: { type: String, required: false },
  phone_number: { type: String, required: false, unique: true },
  birthday: { type: String, required: false },
  birth_place: { type: String, required: false },
  city: { type: String, required: false },
  country: { type: String, required: false },
  address: { type: String, required: false },
  id_type: { type: String, required: false },
  id_number: { type: String, required: false },
  id_type: { type: String, required: false },
  password: { type: String, required: false },
  twofa: { type: String, required: false, default: null, maxLength: 50 },
  status: { type: String, required: false, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", UserSchema);

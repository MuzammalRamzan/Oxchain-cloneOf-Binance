const mongoose = require("mongoose");
var uniqueValidator = require('mongoose-unique-validator');



const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  surname: { type: String, required: true },
  surname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  country_code: { type: String, required: true },
  phone_number: { type: String, required: true ,unique: true},
  birthday: { type: String, required: true },
  birth_place: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  address: { type: String, required: true },
  id_type: { type: String, required: true },
  id_number: { type: String, required: true },
  id_type: { type: String, required: true },
  password: { type: String, required: true },
  twofa: { type: String, required: false, default:null,maxLength: 50},
  status: { type: String, required: false,default:0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Test", UserSchema);

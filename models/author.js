const mongoose = require("mongoose");

//create schema (table in database)
const authorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

// Author is name of table in database
module.exports = mongoose.model("Author", authorSchema);

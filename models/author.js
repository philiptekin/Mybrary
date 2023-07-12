const mongoose = require("mongoose");
const Book = require("./book");
//create schema (table in database)
const authorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

// This function runs before we try to delete an author in the database.
// Document true and query false is to specify that it is the delete one for a document not for a query.
authorSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    try {
      const hasBook = await Book.exists({ author: this.id }); // Finds out if a book exists for a given author that is getting deleted

      if (hasBook) {
        next(new Error("Cannot delete, Author still has books on the webpage"));
      } else {
        next();
      }
    } catch (err) {
      next(err);
    }
  }
);

// Author is name of table in database
module.exports = mongoose.model("Author", authorSchema);

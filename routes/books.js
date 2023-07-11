const express = require("express");
const router = express.Router();
const multer = require("multer"); // Allow files to be uploaded to page and database
const path = require("path"); // Needed for finding path to image
const fs = require("fs"); // Filesystem library to delete unused book covers

const Book = require("../models/book");
const Author = require("../models/author");

const uploadPath = path.join("public", Book.coverImageBasePath); // Joins the public folder with the book cover path
const imageMimeTypes = ["image/jpeg", "image/png", "image.gif"]; // Acceptable image types
// Upload file code
const upload = multer({
  dest: uploadPath,
  fileFilter: (req, file, callback) => {
    callback(null, imageMimeTypes.includes(file.mimetype));
  },
});

// All Books route
router.get("/", async (req, res) => {
  let query = Book.find();
  // Filters for our search method for books, if we have filled in a filter then we query for that filter
  if (req.query.title != null && req.query.title != "") {
    query = query.regex("title", new RegExp(req.query.title), "i"); // Define query for database, look for all books containing the conditions in the database
  }
  if (req.query.publishedBefore != null && req.query.publishedBefore != "") {
    query = query.lte("publishDate", req.query.publishedBefore); // lte means less than or equal to
  }
  if (req.query.publishedAfter != null && req.query.publishedAfter != "") {
    query = query.gte("publishDate", req.query.publishedAfter); // gte means greater than or equal to
  }
  try {
    const books = await query.exec(); // Wait to execute query
    res.render("books/index", { books: books, searchOptions: req.query });
  } catch {
    res.redirect("/");
  }
});

// New Book route
router.get("/new", async (req, res) => {
  renderNewPage(res, new Book());
});

// Create Book route
router.post("/", upload.single("cover"), async (req, res) => {
  const fileName = req.file != null ? req.file.filename : null;
  const book = new Book({
    title: req.body.title,
    author: req.body.author,
    publishDate: new Date(req.body.publishDate),
    pageCount: req.body.pageCount,
    coverImageName: fileName,
    description: req.body.description,
  });
  try {
    const newBook = await book.save();
    console.log("worked");
    //res.redirect(`books/${newBook.id}`)
    res.redirect("books");
  } catch {
    if (book.coverImageName != null) {
      removeBookCover(book.coverImageName);
    }
    renderNewPage(res, Book(), true);
  }
});

function removeBookCover(fileName) {
  fs.unlink(path.join(uploadPath, fileName), (err) => {
    if (err) console.error(err); // Log error if delete fails
  }); // Remove file we don't want on server which is on uploadPath which is public/uploads/bookcover
}

async function renderNewPage(res, book, hasError = false) {
  try {
    const authors = await Author.find({}); // wait to find all authors in db
    const params = { authors: authors, book: book };
    if (hasError) {
      params.errorMessage = "Error Creating Book";
    }
    res.render("books/new", params);
  } catch {
    res.redirect("/books");
  }
}

module.exports = router;

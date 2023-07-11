const express = require("express");
const router = express.Router();
const Book = require("../models/book");
const Author = require("../models/author");

const imageMimeTypes = ["image/jpeg", "image/png", "image.gif"]; // Acceptable image types

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
router.post("/", async (req, res) => {
  const book = new Book({
    title: req.body.title,
    author: req.body.author,
    publishDate: new Date(req.body.publishDate),
    pageCount: req.body.pageCount,
    description: req.body.description,
  });
  saveCover(book, req.body.cover);

  try {
    const newBook = await book.save();
    //res.redirect(`books/${newBook.id}`)
    res.redirect("books");
  } catch {
    renderNewPage(res, Book(), true);
  }
});

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

function saveCover(book, coverEncoded) {
  if (coverEncoded == null) return;
  const cover = JSON.parse(coverEncoded);
  console.log(cover);
  if (cover != null && imageMimeTypes.includes(cover.type)) {
    book.coverImage = new Buffer.from(cover.data, "base64"); // Convert from base64
    book.coverImageType = cover.type;
  }
}

module.exports = router;

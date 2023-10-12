const express = require("express");
const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");
const router = express.Router();

const bookCtrl = require("../controllers/book");

router.get("/", bookCtrl.getAllBooks);
router.get("/bestrating", bookCtrl.getBestRatedBooks);
router.get("/:id", bookCtrl.getOneBook);
router.post("/", auth, multer, bookCtrl.createBook);
router.put("/:id", auth, multer, bookCtrl.modifyBook);
router.delete("/:id", auth, bookCtrl.deleteBook);
router.post("/:id/rating", auth, bookCtrl.rateBook);

module.exports = router;

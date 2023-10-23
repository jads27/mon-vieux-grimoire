const Book = require("../models/Book");
const fs = require("fs");
const sharp = require("sharp");
const path = require("path");

exports.getAllBooks = (req, res, next) => {
    Book.find()
        .then((books) => res.status(200).json(books))
        .catch((error) => res.status(400).json({ error }));
};

exports.getOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then((book) => res.status(200).json(book))
        .catch((error) => res.status(400).json({ error }));
};

exports.createBook = async (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;
    const imagePath = req.file.filename;

    await sharp(req.file.path)
        .resize(500)
        .jpeg({ quality: 80 })
        .toFile(path.resolve(req.file.destination, "resized", imagePath))
        .then(() => {
            fs.unlinkSync(req.file.path);
        })
        .catch((error) => {
            console.error(error);
        });

    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get("host")}/images/resized/${req.file.filename}`,
    });
    book.save()
        .then(() => res.status(201).json({ message: "Livre enregistré !" }))
        .catch((error) => {
            res.status(400).json({ error });
        });
};

exports.modifyBook = (req, res, next) => {
    const bookObject = req.file
        ? {
              ...JSON.parse(req.body.book),
              imageUrl: `${req.protocol}://${req.get("host")}/images/resized/${req.file.filename}`,
          }
        : { ...req.body };

    delete bookObject._userId;

    if (req.file) {
        const imagePath = req.file.filename;
        Book.findOne({ _id: req.params.id })
            .then((book) => {
                if (book.userId != req.auth.userId) {
                    res.status(400).json({ message: "Non autorisé" });
                } else {
                    const inputFilename = book.imageUrl.split("/images/resized/")[1];
                    fs.unlink(`images/resized/${inputFilename}`, () => {
                        sharp(req.file.path)
                            .resize(500)
                            .jpeg({ quality: 80 })
                            .toFile(path.resolve(req.file.destination, "resized", imagePath))
                            .then(() => {
                                fs.unlinkSync(req.file.path);
                                Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                                    .then(() => res.status(200).json({ message: "Livre modifié !" }))
                                    .catch((error) => res.status(403).json({ error }));
                            })
                            .catch((error) => {
                                console.error(error);
                            });
                    });
                }
            })
            .catch((error) => res.status(400).json({ error }));
    } else {
        Book.findOne({ _id: req.params.id })
            .then((book) => {
                if (book.userId != req.auth.userId) {
                    res.status(400).json({ message: "Non autorisé" });
                } else {
                    Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                        .then(() => res.status(200).json({ message: "Livre modifié !" }))
                        .catch((error) => res.status(403).json({ error }));
                }
            })
            .catch((error) => res.status(400).json({ error }));
    }
};

exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then((book) => {
            if (book.userId != req.auth.userId) {
                res.status(403).json({ message: "Non autorisé" });
            } else {
                const filename = book.imageUrl.split("/images/resized/")[1];
                fs.unlink(`images/resized/${filename}`, () => {
                    Book.deleteOne({ _id: req.params.id })
                        .then(() => res.status(200).json({ message: "Livre supprimé !" }))
                        .catch((error) => res.status(403).json({ error }));
                });
            }
        })
        .catch((error) => res.status(500).json({ error }));
};

exports.rateBook = (req, res, next) => {
    const userId = req.body.userId;
    const rating = req.body.rating;

    Book.findById(req.params.id)
        .then((book) => {
            if (!book) {
                return res.status(404).json({ message: "Livre non trouvé" });
            }

            if (book.ratings.find((rating) => rating.userId === userId)) {
                return res.status(400).json({ message: "L'utilisateur a déjà noté ce livre." });
            } else {
                book.ratings.push({
                    userId: userId,
                    grade: rating,
                });

                const totalRatings = book.ratings.length;
                const sumOfRatings = book.ratings.reduce((sum, rating) => sum + rating.grade, 0);
                book.averageRating = sumOfRatings / totalRatings;

                book.save()
                    .then((book) => res.status(200).json(book))
                    .catch((error) => res.status(400).json({ error }));
            }
        })
        .catch((error) => res.status(500).json({ error }));
};

exports.getBestRatedBooks = (req, res, next) => {
    Book.find()
        .sort({ averageRating: -1 })
        .limit(3)
        .then((books) => res.status(200).json(books))
        .catch((error) => res.status(500).json({ error }));
};

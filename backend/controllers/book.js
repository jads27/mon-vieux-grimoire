const Book = require("../models/Book");
const fs = require("fs");

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

exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;
    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
    });
    book.save()
        .then(() => res.status(201).json({ message: "Objet enregistré !" }))
        .catch((error) => {
            res.status(400).json({ error });
        });
};

exports.modifyBook = (req, res, next) => {
    const bookObject = req.file
        ? {
              ...JSON.parse(req.body.book),
              imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
          }
        : { ...req.body };

    delete bookObject._userId;

    Book.findOne({ _id: req.params.id })
        .then((book) => {
            if (book.userId != req.auth.userId) {
                res.status(400).json({ message: "Non autorisé" });
            } else {
                Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                    .then(() => res.status(200).json({ message: "Objet modifié !" }))
                    .catch((error) => res.status(403).json({ error }));
            }
        })
        .catch((error) => res.status(400).json({ error }));
};

exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then((book) => {
            if (book.userId != req.auth.userId) {
                res.status(403).json({ message: "Non autorisé" });
            } else {
                const filename = book.imageUrl.split("/images/")[1];
                fs.unlink(`images/"${filename}`, () => {
                    Book.deleteOne({ _id: req.params.id })
                        .then(() => res.status(200).json({ message: "Objet supprimé !" }))
                        .catch((error) => res.status(403).json({ error }));
                });
            }
        })
        .catch((error) => res.status(500).json({ error }));
};

exports.rateBook = (req, res, next) => {
    const userId = req.body.userId;
    const rating = req.body.rating;
    console.log(req.body);

    Book.findById(req.params.id)
        .then((book) => {
            console.log(book);
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

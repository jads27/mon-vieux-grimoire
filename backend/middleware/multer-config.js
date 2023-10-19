const multer = require("multer");

const MIME_TYPES = {
    "image/jpg": "jpg",
    "image/jpeg": "jpeg",
    "image/png": "png",
};

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, "images");
    },
    filename: (req, file, callback) => {
        const nameWithoutExtension = file.originalname.replace(/\.[^/.]+$/, "");
        const cleanName = nameWithoutExtension.split(" ").join("_");
        const extension = MIME_TYPES[file.mimetype];
        const finalFileName = `${cleanName}-${Date.now()}.${extension}`;
        callback(null, finalFileName);
    },
});

module.exports = multer({ storage }).single("image");

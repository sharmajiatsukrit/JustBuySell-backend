import multer from "multer";
import fs from 'fs';
import path from 'path';

// const storage = multer.memoryStorage();

// const upload = multer({
//     storage,
// });

// export default upload;

var attach_files = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync("uploads")) {
            fs.mkdir("uploads", function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("New directory successfully created.");
                }
            });
        }
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        // const userId = req.user.id || "anonamus";
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        let ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    },
});
var Fileupload = multer({
    storage: attach_files,
    fileFilter: function (req, file, callback) {
        if (
            file.mimetype == "image/jpeg" ||
            file.mimetype == "image/png" ||
            file.mimetype == "image/jpg" ||
            //   file.mimetype == "application/pdf" ||
            file.mimetype == "application/octet-stream"
        ) {
            callback(null, true);
        } else {
            console.log("only use jpeg, png, jpg, pdf");
            callback(null, false);
        }
    },
});

export default Fileupload;
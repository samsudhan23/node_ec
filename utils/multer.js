const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, 'assets/Products')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)) //extname --> it gives extension of files
    }
})
const upload = multer({ storage: storage })

module.exports = upload;
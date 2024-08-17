import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: function (req : any, file : any, cb) {
        cb(null, './dist/public/images')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        let extension = path.extname(file.originalname)
        cb(null, Date.now() + uniqueSuffix + extension)
    }
})

export const upload = multer({ storage: storage })
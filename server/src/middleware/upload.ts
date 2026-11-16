import multer from "multer";
import { IMPORT_IMAGE_MAX_BYTES, IMPORT_IMAGE_TYPES } from "../shared/canvas";

const UNSUPPORTED_IMAGE_MESSAGE = "Only JPEG, PNG, WebP, and GIF images are allowed";
const UPLOAD_MAX_FILES = 1;
const UPLOAD_MAX_FIELDS = 5;

const allowedTypes: readonly string[] = IMPORT_IMAGE_TYPES;

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: IMPORT_IMAGE_MAX_BYTES, files: UPLOAD_MAX_FILES, fields: UPLOAD_MAX_FIELDS },
  fileFilter: (_req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    const err = new multer.MulterError("LIMIT_UNEXPECTED_FILE");
    err.message = UNSUPPORTED_IMAGE_MESSAGE;
    cb(err);
  },
});

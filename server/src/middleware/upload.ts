import multer from "multer";

const storage = multer.memoryStorage();

export const uploadImage = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new multer.MulterError("LIMIT_UNEXPECTED_FILE");
      err.message = "Only JPEG, PNG, WebP, and GIF images are allowed";
      cb(err);
    }
  },
});



const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// ================= CLOUDINARY STORAGE =================
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'shopnet_immo',
    allowed_formats: ['jpg', 'png', 'jpeg'],

    // ================= TRANSFORMATION IMAGE =================
    transformation: [
      {
        width: 1200,
        height: 900,
        crop: 'limit',
        quality: 'auto'
      },

      // ================= WATERMARK =================
      {
        overlay: 'text:arial_35:SHOPNET-IMMOBILIER',
        gravity: 'south_east',
        x: 25,
        y: 25,
        opacity: 60,
        color: '#0d47c7'
      }
    ]
  }
});

// ================= MULTER CONFIG =================
const upload = multer({ storage });

module.exports = upload;


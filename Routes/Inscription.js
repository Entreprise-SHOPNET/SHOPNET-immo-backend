


const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ================= UPLOAD CONFIG =================
const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 🔐 File filter (sécurité)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Format d'image non supporté"), false);
  }
  cb(null, true);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage, fileFilter }).fields([
  { name: 'carte_recto', maxCount: 1 },
  { name: 'carte_verso', maxCount: 1 },
  { name: 'photo_profil', maxCount: 1 }
]);

// ================= REGISTER COMMISSIONNAIRE =================
router.post('/register', upload, async (req, res) => {
  try {
    const db = req.db;

    const clean = (v) => v ? v.trim() : null;

    let {
      nom_complet,
      sexe,
      date_naissance,
      commune,
      quartier,
      avenue,
      numero_maison,
      telephone,
      whatsapp,
      email,
      password,
      numero_carte,
      specialisation,
      zone_activite,
      experience,
      agence,
      ville
    } = req.body;

    // ================= CLEAN DATA =================
    nom_complet = clean(nom_complet);
    email = clean(email);
    telephone = clean(telephone);

    // ================= VALIDATION =================
    if (!nom_complet || !telephone || !password) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants"
      });
    }

    if (!req.files || !req.files.carte_recto || !req.files.carte_verso) {
      return res.status(400).json({
        success: false,
        message: "Carte d'électeur recto et verso obligatoires"
      });
    }

    // 🔞 AGE CHECK
    if (date_naissance) {
      const birth = new Date(date_naissance);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();

      if (age < 18) {
        return res.status(400).json({
          success: false,
          message: "Vous devez avoir au moins 18 ans"
        });
      }
    }

    // ================= CHECK EXISTING =================
    let existing;

    if (email) {
      [existing] = await db.query(
        'SELECT * FROM commissionnaires WHERE email = ? OR telephone = ?',
        [email, telephone]
      );
    } else {
      [existing] = await db.query(
        'SELECT * FROM commissionnaires WHERE telephone = ?',
        [telephone]
      );
    }

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email ou numéro déjà utilisé"
      });
    }

    // 🔐 HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    // 📸 FILES
    const carteRecto = `/uploads/${req.files.carte_recto[0].filename}`;
    const carteVerso = `/uploads/${req.files.carte_verso[0].filename}`;
    const photoProfil = req.files.photo_profil
      ? `/uploads/${req.files.photo_profil[0].filename}`
      : null;

    // 💾 INSERT DB
    await db.query(`
      INSERT INTO commissionnaires (
        nom_complet,
        sexe,
        date_naissance,
        commune,
        quartier,
        avenue,
        numero_maison,
        telephone,
        whatsapp,
        email,
        password,
        numero_carte,
        carte_recto,
        carte_verso,
        photo_profil,
        specialisation,
        zone_activite,
        experience,
        agence,
        ville,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `, [
      nom_complet,
      sexe,
      date_naissance,
      commune,
      quartier,
      avenue,
      numero_maison,
      telephone,
      whatsapp,
      email,
      hashedPassword,
      numero_carte,
      carteRecto,
      carteVerso,
      photoProfil,
      specialisation,
      zone_activite,
      experience,
      agence,
      ville
    ]);

    return res.json({
      success: true,
      message: "Compte commissionnaire créé. En attente de validation admin."
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});

module.exports = router;
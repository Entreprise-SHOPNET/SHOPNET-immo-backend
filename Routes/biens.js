



const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadCloudinary');

// ✅ middleware SHOPNET CORE (copié dans ce serveur)
const authMiddleware = require('../middleware/authMiddleware');


// ================= GET PUBLIC BIENS (CLIENT) =================
router.get('/public', async (req, res) => {
  try {
    const db = req.db;

    const [biens] = await db.query(
      `SELECT * FROM biens_immobiliers 
       WHERE status = 'approved' 
       ORDER BY id DESC`
    );

    const cleanBiens = biens.map(bien => {
      let images = [];

      try {
        if (bien.images) {
          if (typeof bien.images === 'string') {
            images = bien.images.startsWith('[')
              ? JSON.parse(bien.images)
              : [bien.images];
          } else if (Array.isArray(bien.images)) {
            images = bien.images;
          }
        }
      } catch (e) {
        images = [];
      }

      return {
        ...bien,
        images
      };
    });

    res.json({
      success: true,
      count: cleanBiens.length,
      biens: cleanBiens
    });

  } catch (err) {
    console.error("PUBLIC BIENS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// ================= CREATE BIEN =================
router.post(
  '/create',
  authMiddleware,
  upload.array('images', 8),
  async (req, res) => {
    try {
      const db = req.db;

      const {
        titre,
        type_bien,
        type_offre,
        prix,
        devise,
        ville,
        commune,
        quartier,
        reference,
        latitude,
        longitude,
        superficie,
        chambres,
        salles_bain,
        accessibilite,
        description,
        whatsapp,
        telephone
      } = req.body;

      const images = req.files ? req.files.map(file => file.path) : [];

      await db.query(
        `INSERT INTO biens_immobiliers (
          commissionnaire_id,
          titre,
          type_bien,
          type_offre,
          prix,
          devise,
          ville,
          commune,
          quartier,
          reference,
          latitude,
          longitude,
          superficie,
          chambres,
          salles_bain,
          accessibilite,
          images,
          description,
          whatsapp,
          telephone,
          status
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          req.userId, // ✅ FIX IMPORTANT
          titre,
          type_bien,
          type_offre,
          prix,
          devise || 'USD',
          ville,
          commune,
          quartier,
          reference,
          latitude,
          longitude,
          superficie,
          chambres || 0,
          salles_bain || 0,
          accessibilite,
          JSON.stringify(images),
          description,
          whatsapp || null,
          telephone || null,
          'pending'
        ]
      );

      res.json({
        success: true,
        message: 'Bien publié avec succès',
        images
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
);


// ================= GET BIEN BY ID =================
router.get('/:id', async (req, res) => {
  try {
    const db = req.db;
    const id = req.params.id;

    const [rows] = await db.query(
      `SELECT * FROM biens_immobiliers WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Bien introuvable"
      });
    }

    const bien = rows[0];

    let images = [];

    try {
      if (bien.images) {
        if (typeof bien.images === 'string') {
          images = bien.images.startsWith('[')
            ? JSON.parse(bien.images)
            : [bien.images];
        } else if (Array.isArray(bien.images)) {
          images = bien.images;
        }
      }
    } catch (e) {
      images = [];
    }

    res.json({
      success: true,
      bien: {
        ...bien,
        images
      }
    });

  } catch (err) {
    console.error("DETAIL BIEN ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// ================= GET MY BIENS (AGENT) =================
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const db = req.db;

    const [rows] = await db.query(
      `SELECT * FROM biens_immobiliers 
       WHERE commissionnaire_id = ? 
       ORDER BY id DESC`,
      [req.userId]
    );

    res.json({
      success: true,
      count: rows.length,
      biens: rows
    });

  } catch (err) {
    console.error("AGENT BIENS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});




// ================= UPDATE BIEN =================
router.put('/update/:id', authMiddleware, async (req, res) => {
  try {
    const db = req.db;
    const bienId = req.params.id;
    const userId = req.userId;

    const {
      titre,
      type_bien,
      type_offre,
      prix,
      devise,
      ville,
      commune,
      quartier,
      reference,
      description,
      whatsapp,
      telephone
    } = req.body;

    // 🔐 Vérifier que le bien appartient à l'utilisateur
    const [rows] = await db.query(
      `SELECT id FROM biens_immobiliers 
       WHERE id = ? AND commissionnaire_id = ?`,
      [bienId, userId]
    );

    if (rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Non autorisé"
      });
    }

    // 🔄 UPDATE
    await db.query(
      `UPDATE biens_immobiliers SET
        titre = ?,
        type_bien = ?,
        type_offre = ?,
        prix = ?,
        devise = ?,
        ville = ?,
        commune = ?,
        quartier = ?,
        reference = ?,
        description = ?,
        whatsapp = ?,
        telephone = ?,
        status = 'pending' -- 🔥 revalidation après modification
      WHERE id = ?`,
      [
        titre,
        type_bien,
        type_offre,
        prix,
        devise,
        ville,
        commune,
        quartier,
        reference,
        description,
        whatsapp,
        telephone,
        bienId
      ]
    );

    res.json({
      success: true,
      message: "Bien modifié avec succès (en attente de validation)"
    });

  } catch (err) {
    console.error("UPDATE BIEN ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});



module.exports = router;
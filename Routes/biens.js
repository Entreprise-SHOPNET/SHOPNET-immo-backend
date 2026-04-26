



const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadCloudinary');
const authToken = require('../middleware/authToken');


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
  authToken,
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
          req.user.id,
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


// ================= GET BIEN BY ID (CLIENT / DETAIL) =================
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


// ================= GET BIENS AGENT (SECURISE) =================
router.get('/agent/:id', authToken, async (req, res) => {
  try {
    const db = req.db;
    const agentId = req.params.id;

    const [rows] = await db.query(
      `SELECT * FROM biens_immobiliers WHERE commissionnaire_id = ? ORDER BY id DESC`,
      [agentId]
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


module.exports = router;




const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// ======================================================
// 🔵 GET BIENS DE L'UTILISATEUR CONNECTÉ (SIMPLIFIÉ)
// ======================================================
router.get('/my-biens', authMiddleware, async (req, res) => {
  try {
    const db = req.db;

    const userId = req.userId;

    console.log("🔐 USER CONNECTÉ =", userId);

    const [biens] = await db.query(
      `SELECT 
        id,
        titre,
        type_bien,
        type_offre,
        prix,
        devise,
        ville,
        commune,
        quartier,
        reference,
        images,
        status,
        created_at
      FROM biens_immobiliers
      WHERE commissionnaire_id = ?
      ORDER BY id DESC`,
      [userId]
    );

    const cleanBiens = biens.map(bien => {
      let images = [];

      try {
        images = typeof bien.images === 'string'
          ? JSON.parse(bien.images)
          : bien.images || [];
      } catch (e) {
        images = [];
      }

      return { ...bien, images };
    });

    res.json({
      success: true,
      count: cleanBiens.length,
      biens: cleanBiens
    });

  } catch (err) {
    console.error("❌ MY BIENS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});

module.exports = router;
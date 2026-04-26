


const express = require('express');
const router = express.Router();
const authToken = require('../middleware/authToken');

// ======================================================
// 🔵 GET BIENS DE L'AGENT CONNECTÉ
// ======================================================
router.get('/my-biens', authToken, async (req, res) => {
  try {
    const db = req.db;

    const agentId = req.user.id; // 🔐 sécurisé via token

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
      [agentId]
    );

    // ================= CLEAN IMAGES =================
    const cleanBiens = biens.map(bien => {
      let images = [];

      try {
        images = typeof bien.images === 'string'
          ? JSON.parse(bien.images)
          : bien.images || [];
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
    console.error("MY BIENS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});

module.exports = router;


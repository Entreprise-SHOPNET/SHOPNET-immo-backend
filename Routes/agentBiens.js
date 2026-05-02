

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// ======================================================
// 🔵 GET MY BIENS (SHOPNET CORE LINKED VERSION)
// ======================================================
router.get('/my-biens', authMiddleware, async (req, res) => {
  try {
    const db = req.db;

    const userId = req.userId;

    console.log("\n==============================");
    console.log("🔐 USER CONNECTÉ SHOPNET CORE =", userId);
    console.log("==============================");

    // 🔥 1. Trouver commissionnaire lié au user SHOPNET CORE
    const [agent] = await db.query(
      `SELECT id FROM commissionnaires WHERE user_id = ?`,
      [userId]
    );

    console.log("👤 AGENT TROUVÉ =", agent);

    // ❌ si aucun lien
    if (!agent || agent.length === 0) {
      console.log("⚠️ Aucun commissionnaire lié");
      return res.json({
        success: true,
        count: 0,
        biens: []
      });
    }

    const commissionnaireId = agent[0].id;

    console.log("🏠 COMMISSIONNAIRE ID =", commissionnaireId);

    // 🔥 2. Récupérer biens liés
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
      [commissionnaireId]
    );

    console.log("📦 BIENS TROUVÉS =", biens.length);

    // 🧹 CLEAN IMAGES
    const cleanBiens = biens.map(bien => {
      let images = [];

      try {
        images =
          typeof bien.images === 'string'
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

    console.log("==============================\n");

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
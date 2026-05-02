

const express = require('express');
const router = express.Router();


// ======================================================
// 🔵 1. LISTE DES BIENS EN ATTENTE (PENDING)
// ======================================================
router.get('/pending', async (req, res) => {
  try {
    const db = req.db;

    const [biens] = await db.query(
      `SELECT * FROM biens_immobiliers WHERE status = 'pending' ORDER BY id DESC`
    );

    const cleanBiens = biens.map(bien => {
      let images = [];

      try {
        if (bien.images) {
          images = typeof bien.images === 'string'
            ? JSON.parse(bien.images)
            : bien.images;
        }
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
    console.error("PENDING ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// ======================================================
// 🟢 2. APPROUVER UN BIEN
// ======================================================
router.put('/approve/:id', async (req, res) => {
  try {
    const db = req.db;

    const [result] = await db.query(
      `UPDATE biens_immobiliers SET status = 'approved' WHERE id = ?`,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Bien introuvable"
      });
    }

    res.json({
      success: true,
      message: "Bien approuvé avec succès"
    });

  } catch (err) {
    console.error("APPROVE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// ======================================================
// 🔴 3. REJETER UN BIEN (SUPPRESSION)
// ======================================================
router.delete('/reject/:id', async (req, res) => {
  try {
    const db = req.db;

    const [result] = await db.query(
      `DELETE FROM biens_immobiliers WHERE id = ?`,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Bien introuvable"
      });
    }

    res.json({
      success: true,
      message: "Bien rejeté et supprimé"
    });

  } catch (err) {
    console.error("REJECT ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// ======================================================
// 🟣 4. LISTE DES BIENS APPROUVÉS
// ======================================================
router.get('/approved', async (req, res) => {
  try {
    const db = req.db;

    const [biens] = await db.query(
      `SELECT * FROM biens_immobiliers WHERE status = 'approved' ORDER BY id DESC`
    );

    const cleanBiens = biens.map(bien => {
      let images = [];

      try {
        if (bien.images) {
          images = typeof bien.images === 'string'
            ? JSON.parse(bien.images)
            : bien.images;
        }
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
    console.error("APPROVED ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});

module.exports = router;
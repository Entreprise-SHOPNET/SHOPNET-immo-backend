

const express = require('express');
const router = express.Router();


// ==========================
// 📊 DASHBOARD (STATS + LISTE COMPLETE)
// ==========================
router.get('/commissionnaires', async (req, res) => {
  try {
    const db = req.db;

    // 📊 STATISTIQUES
    const [[stats]] = await db.query(`
      SELECT 
        SUM(status = 'PENDING') AS pending,
        SUM(status = 'ACTIVE') AS active,
        SUM(status = 'REJECTED') AS rejected
      FROM commissionnaires
    `);

    // 👥 LISTE COMPLETE USERS
    const [users] = await db.query(`
      SELECT 
        id,
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
        numero_carte,
        carte_recto,
        carte_verso,
        photo_profil,
        specialisation,
        zone_activite,
        experience,
        agence,
        ville,
        status,
        created_at
      FROM commissionnaires
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      stats,
      users
    });

  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// ==========================
// 👁️ DETAILS USER COMPLET
// ==========================
router.get('/commissionnaires/:id', async (req, res) => {
  try {
    const db = req.db;
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT * FROM commissionnaires WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable"
      });
    }

    res.json({
      success: true,
      user: rows[0]
    });

  } catch (err) {
    console.error("DETAIL ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// ==========================
// ✅ APPROUVER (ACTIVER)
// ==========================
router.put('/commissionnaires/:id/approve', async (req, res) => {
  try {
    const db = req.db;
    const { id } = req.params;

    const [result] = await db.query(
      "UPDATE commissionnaires SET status = 'ACTIVE' WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable"
      });
    }

    res.json({
      success: true,
      message: "✅ Compte activé avec succès"
    });

  } catch (err) {
    console.error("APPROVE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// ==========================
// ❌ REJETER
// ==========================
router.put('/commissionnaires/:id/reject', async (req, res) => {
  try {
    const db = req.db;
    const { id } = req.params;

    const [result] = await db.query(
      "UPDATE commissionnaires SET status = 'REJECTED' WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable"
      });
    }

    res.json({
      success: true,
      message: "❌ Compte rejeté"
    });

  } catch (err) {
    console.error("REJECT ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


// ==========================
// 🗑️ SUPPRESSION
// ==========================
router.delete('/commissionnaires/:id', async (req, res) => {
  try {
    const db = req.db;
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM commissionnaires WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable"
      });
    }

    res.json({
      success: true,
      message: "🗑️ Utilisateur supprimé"
    });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});

module.exports = router;
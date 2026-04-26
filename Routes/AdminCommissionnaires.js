

const express = require('express');
const router = express.Router();

// ================= GET STATISTIQUES + LISTE =================
router.get('/dashboard', async (req, res) => {
  try {
    const db = req.db;

    // 📊 COUNT PENDING
    const [pending] = await db.query(
      "SELECT COUNT(*) AS total FROM commissionnaires WHERE status = 'PENDING'"
    );

    // 📊 COUNT ACTIVE
    const [active] = await db.query(
      "SELECT COUNT(*) AS total FROM commissionnaires WHERE status = 'ACTIVE'"
    );

    // 📊 COUNT REJECTED
    const [rejected] = await db.query(
      "SELECT COUNT(*) AS total FROM commissionnaires WHERE status = 'REJECTED'"
    );

    // 👤 LISTE DES DEMANDES (derniers inscrits)
    const [users] = await db.query(
      "SELECT id, nom_complet, telephone, email, status, created_at FROM commissionnaires ORDER BY created_at DESC LIMIT 50"
    );

    return res.json({
      success: true,
      stats: {
        pending: pending[0].total,
        active: active[0].total,
        rejected: rejected[0].total
      },
      users
    });

  } catch (err) {
    console.error("ADMIN DASHBOARD ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});

module.exports = router;
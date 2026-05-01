

const express = require('express');
const router = express.Router();

// ✅ NOUVEAU MIDDLEWARE CENTRAL (SHOPNET CORE)
const authMiddleware = require('../middleware/authMiddleware');


// ======================================================
// 👁️ 1. INCREMENT VIEW (client view)
// ======================================================
router.post('/view/:bienId', async (req, res) => {
  try {
    const db = req.db;
    const bienId = req.params.bienId;

    const [rows] = await db.query(
      `SELECT * FROM bien_stats WHERE bien_id = ?`,
      [bienId]
    );

    if (rows.length === 0) {
      await db.query(
        `INSERT INTO bien_stats (bien_id, commissionnaire_id, views)
         VALUES (?, (SELECT commissionnaire_id FROM biens_immobiliers WHERE id = ?), 1)`,
        [bienId, bienId]
      );
    } else {
      await db.query(
        `UPDATE bien_stats 
         SET views = views + 1, last_view_at = NOW()
         WHERE bien_id = ?`,
        [bienId]
      );
    }

    res.json({
      success: true,
      message: "View recorded"
    });

  } catch (err) {
    console.error("VIEW ERROR:", err);
    res.status(500).json({ success: false });
  }
});


// ======================================================
// 📲 2. WHATSAPP CLICK
// ======================================================
router.post('/whatsapp/:bienId', async (req, res) => {
  try {
    const db = req.db;
    const bienId = req.params.bienId;

    await db.query(
      `UPDATE bien_stats 
       SET whatsapp_clicks = whatsapp_clicks + 1
       WHERE bien_id = ?`,
      [bienId]
    );

    res.json({
      success: true,
      message: "WhatsApp click recorded"
    });

  } catch (err) {
    console.error("WHATSAPP ERROR:", err);
    res.status(500).json({ success: false });
  }
});


// ======================================================
// 📩 3. CONTACT CLIENT
// ======================================================
router.post('/contact/:bienId', async (req, res) => {
  try {
    const db = req.db;
    const bienId = req.params.bienId;

    await db.query(
      `UPDATE bien_stats 
       SET contact_requests = contact_requests + 1
       WHERE bien_id = ?`,
      [bienId]
    );

    res.json({
      success: true,
      message: "Contact recorded"
    });

  } catch (err) {
    console.error("CONTACT ERROR:", err);
    res.status(500).json({ success: false });
  }
});


// ======================================================
// 📊 4. STATS D'UN BIEN (AGENT SECURISÉ)
// ======================================================
router.get('/stats/:bienId', authMiddleware, async (req, res) => {
  try {
    const db = req.db;
    const bienId = req.params.bienId;

    const [stats] = await db.query(
      `SELECT * FROM bien_stats WHERE bien_id = ?`,
      [bienId]
    );

    if (stats.length === 0) {
      return res.json({
        success: true,
        stats: {
          views: 0,
          whatsapp_clicks: 0,
          contact_requests: 0
        }
      });
    }

    res.json({
      success: true,
      stats: stats[0]
    });

  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ success: false });
  }
});


// ======================================================
// 📊 5. DETAIL STATS BIEN (VERSION CLEAN)
// ======================================================
router.get('/bien/:id', authMiddleware, async (req, res) => {
  try {
    const db = req.db;
    const bienId = req.params.id;

    const [rows] = await db.query(
      `SELECT * FROM bien_stats WHERE bien_id = ?`,
      [bienId]
    );

    if (rows.length === 0) {
      return res.json({
        success: true,
        stats: {
          views: 0,
          whatsapp_clicks: 0,
          contact_requests: 0
        }
      });
    }

    res.json({
      success: true,
      stats: rows[0]
    });

  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});


module.exports = router;
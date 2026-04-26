const authToken = require('../middleware/authToken'); // adapte le chemin
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ================= LOGIN =================
router.post('/login', async (req, res) => {
  try {
    const db = req.db;

    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Requête invalide"
      });
    }

    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: "Email ou téléphone + mot de passe requis"
      });
    }

    // 🔍 trouver utilisateur
    const [rows] = await db.query(
      `SELECT * FROM commissionnaires 
       WHERE telephone = ? OR email = ?`,
      [login, login]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Aucun compte trouvé avec ces identifiants"
      });
    }

    const user = rows[0];

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: "Compte en attente de validation"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Mot de passe incorrect"
      });
    }

    // 🎫 TOKEN
    const token = jwt.sign(
      {
        id: user.id,
        role: "commissionnaire"
      },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );

    // 🍪 COOKIE
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60 * 1000
    });

    // ✅ RÉPONSE (TOKEN AJOUTÉ)
    return res.json({
      success: true,
      message: "Connexion réussie",
      token: token, // 👈 IMPORTANT
      user: {
        id: user.id,
        nom_complet: user.nom_complet,
        email: user.email,
        telephone: user.telephone,
        status: user.status
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});




// ================= PROFILE USER CONNECTÉ =================
router.get('/me', authToken, async (req, res) => {
  try {
    const db = req.db;

    // 🔑 récupéré depuis le middleware
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT 
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
      WHERE id = ?`,
      [userId]
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
    console.error("PROFILE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});
// ================= PROFILE USER CONNECTÉ =================


module.exports = router;
/* ════════════════════════════════════════════════════════════════════
   PROXY SERVEUR — OCI Bot
   ────────────────────────────────────────────────────────────────────
   Ce fichier est une fonction serverless Vercel. Elle reçoit le message
   du chatbot depuis le navigateur, appelle l'API Anthropic avec la
   VRAIE clé API (gardée côté serveur, jamais exposée au navigateur),
   puis renvoie la réponse.

   DÉPLOIEMENT SUR VERCEL :
   1. Placez ce fichier dans un dossier "api/" à la racine de votre
      projet (déjà fait si vous avez gardé la structure fournie) :
        mon-projet/
          index.html   (ou oci-bot.html)
          api/
            chat.js     ← ce fichier
   2. Sur vercel.com → votre projet → Settings → Environment Variables,
      ajoutez une variable nommée   ANTHROPIC_API_KEY   avec votre clé
      API Anthropic (obtenue sur https://console.anthropic.com).
   3. Déployez (via l'intégration GitHub ou la commande "vercel deploy").
   4. Dans oci-bot.html, le chatbot appelle déjà "/api/chat" — aucune
      autre modification n'est nécessaire.

   Si vous hébergez ailleurs que Vercel (Netlify, serveur Node perso...),
   la logique ci-dessous reste valable : il suffit d'adapter l'enveloppe
   (req/res) au framework utilisé. Dites-le-moi si besoin, je l'adapte.
   ════════════════════════════════════════════════════════════════════ */

module.exports = async (req, res) => {
  // Autorise uniquement les requêtes POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  // Sécurité de base : la clé doit être configurée côté serveur
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: "Clé API manquante. Ajoutez la variable d'environnement ANTHROPIC_API_KEY dans les paramètres de votre projet Vercel."
    });
    return;
  }

  const { system, messages } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'Requête invalide : "messages" est requis.' });
    return;
  }

  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: system || '',
        messages: messages
      })
    });

    const data = await apiRes.json();
    res.status(apiRes.status).json(data);
  } catch (err) {
    console.error('[OCI Bot proxy] Erreur appel Anthropic :', err);
    res.status(502).json({ error: "Impossible de contacter l'assistant pour le moment. Réessayez dans un instant." });
  }
};

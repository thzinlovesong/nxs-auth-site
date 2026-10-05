const fetch = require('node-fetch');
const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = async (req, res) => {
  const { code } = req.query;

  if (!code) return res.redirect('/?error=no_code');

  try {
    // 1. Troca o code por access_token
    const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      console.error('Token error:', tokenData);
      return res.redirect('/?error=falha_token');
    }

    // 2. Pega dados do usuário
    const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userResponse.json();

    // 3. Gera código único (formato NXS-XXXXXX)
    const gerarCodigo = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem I, O, 0, 1 pra evitar confusão
      let codigo = 'NXS-';
      for (let i = 0; i < 6; i++) {
        codigo += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return codigo;
    };

    const codigo = gerarCodigo();

    // 4. Salva no Redis com expiração de 10 minutos
    await redis.set(`codigo:${codigo}`, userData.id, { ex: 600 });

    console.log(`✅ Código ${codigo} gerado para ${userData.username} (${userData.id})`);

    // 5. Redireciona pra página com o código
    res.redirect(`/success.html?code=${codigo}&user=${encodeURIComponent(userData.username)}`);
  } catch (err) {
    console.error('Callback error:', err);
    res.redirect('/?error=auth_failed');
  }
};

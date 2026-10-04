const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect('/?error=no_code');
  }

  try {
    // 1. Troca o code por access_token
    const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Token error:', tokenData);
      return res.redirect('/?error=falha_token');
    }

    // 2. Pega os dados do usuário
    const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userResponse.json();

    // 3. Avisa o bot pra dar o cargo
    await fetch(`${process.env.BOT_API_URL}/verify-success`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discordId: userData.id }),
    });

    // 4. Redireciona pra página de sucesso
    res.redirect('/success.html');
  } catch (err) {
    console.error('Callback error:', err);
    res.redirect('/?error=auth_failed');
  }
};

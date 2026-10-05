// Instale a biblioteca: npm install @upstash/redis
const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = async (req, res) => {
  // ... código do OAuth para pegar o ID do usuário ...
  
  // Gera um código aleatório
  const codigo = `NXS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  // Salva no Redis com um tempo de expiração (ex: 10 minutos)
  await redis.set(`codigo:${codigo}`, userData.id, { ex: 600 });
  
  // Mostra o código para o usuário
  res.redirect(`/success.html?code=${codigo}`);
};

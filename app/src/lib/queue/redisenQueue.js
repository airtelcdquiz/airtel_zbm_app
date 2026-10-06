const Redis = require('ioredis');

// Connexion créée à l'appel (et non au chargement du module) pour que l'absence
// de REDIS_URL remonte une erreur explicite au lieu de se replier
// silencieusement sur localhost pendant le build.
function connect() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("Variable d'environnement manquante : REDIS_URL");
  }
  return new Redis(url);
}

async function redisenQueue(phone, message) {
  const payload = {
    phone,
    message
  };

  const job = {
    name: 'sendSMS', // facultatif si pas utilisé par le worker
    data: JSON.stringify(payload),
    opts: JSON.stringify({}),
  };

  const redis = connect();
  try {
    const messageId = await redis.xadd(
      'bull:sms:wait', // nom du stream
      '*',             // let Redis generate the ID
      'name', job.name,
      'data', job.data,
      'opts', job.opts
    );

    console.log(`✅ Job ajouté avec l'ID ${messageId}`);
  } finally {
    await redis.quit();
  }
}

export default redisenQueue;

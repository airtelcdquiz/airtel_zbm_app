const Redis = require('ioredis');
const redis = new Redis({
  host: '41.243.25.144',
  port: 6379,
});

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

  const messageId = await redis.xadd(
    'bull:sms:wait', // nom du stream
    '*',             // let Redis generate the ID
    'name', job.name,
    'data', job.data,
    'opts', job.opts
  );

  console.log(`✅ Job ajouté avec l'ID ${messageId}`);
}

export default redisenQueue;
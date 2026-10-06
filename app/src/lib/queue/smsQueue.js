const { Queue } = require('bullmq');
const Redis = require('ioredis');

const connection = new Redis(process.env.REDIS_URL);
const smsQueue = new Queue('sms', { connection });

(async () => {
  await smsQueue.add('send_sms', {
    phone: '243970908479',
    message: 'Bonjour ! Voici votre code : 1234',
  });
  console.log('📤 SMS job ajouté à la queue');
})();

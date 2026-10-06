import Bull from 'bull'

// Bull accepte directement une URL de connexion Redis (REDIS_URL).
const bulkSMS = new Bull('bulksms', process.env.REDIS_URL);

export default bulkSMS;

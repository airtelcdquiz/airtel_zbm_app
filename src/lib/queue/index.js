import Bull from 'bull'

const bulkSMS = new Bull(
    'bulksms',
    {
        redis: {
            port: 6379, // Port Redis
            host: '41.243.25.144', // Adresse IP de Redis
            password: '', // Mot de passe si nécessaire, sinon retire cette ligne
        }
    }
);

export default bulkSMS;
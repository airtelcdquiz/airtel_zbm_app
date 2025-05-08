import smpp from 'smpp';

const sendSMPP = (phone, message) => {


  const session = new smpp.Session({ host: 'messaging.airtel.cd', port: 9001, debug: true, auto_enquire_link_period: 10000, connectTimeout: 20000 });

  session.on('error', err => {
    console.error('SMPP session error:', err);
  });

  session.on('connect', () => {
    console.log(`Session SMPP connectée`);
    session.bind_transceiver({
      system_id: 'AirtelQuiz',
      password: '@irtElq1',
      
    }, (pdu) => {
      if (pdu.command_status === 0) {
        console.log(`Session SMPP liée avec succès`);
      } else {
        console.log(`Session non lié`, JSON.stringify(pdu))
      }
    });
  });

  // session.bind_transceiver({
  //   system_id: 'AirtelQuiz',
  //   password: '@irtElq1'
  // }, function (pdu) {
  //   if (pdu.command_status === 0) {

  //     // Successfully bound
  //     session.submit_sm({
  //       destination_addr: phone,
  //       short_message: message,
  //       source_addr: 'AirtelQuiz'
  //     }, function (pdu) {
  //       if (pdu.command_status === 0) {
  //         console.log('SMS sent, message_id:', pdu.message_id);
  //         //res.status(200).json({ success: true, message_id: pdu.message_id });
  //       } else {
  //         console.error('Failed to send SMS:', pdu.command_status);

  //         //res.status(500).json({ error: 'SMPP submit_sm failed' });
  //       }
  //       session.close();
  //     });

  //   } else {
  //     console.error('SMPP bind failed:', pdu.command_status);
  //     console.log(JSON.stringify(pdu))
  //     //res.status(500).json({ error: 'SMPP bind failed' });
  //     session.close();
  //   }
  // });

}

export default sendSMPP
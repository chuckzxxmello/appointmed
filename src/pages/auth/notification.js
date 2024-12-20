const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
admin.initializeApp();

// Create a transporter using SMTP (use your email service provider)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',  // Replace with your email
    pass: 'your-email-password'    // Replace with your email password (or app-specific password)
  }
});

const sendEmailNotification = (email, subject, text) => {
  const mailOptions = {
    from: 'your-email@gmail.com', // sender address
    to: email,                   // recipient address
    subject: subject,            // subject line
    text: text,                  // email body
  };

  return transporter.sendMail(mailOptions)
    .then((info) => {
      console.log('Email sent: ' + info.response);
    })
    .catch((error) => {
      console.error('Error sending email: ', error);
    });
};

// Function to check appointments 3 days before
exports.sendThreeDaysBefore = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const currentDate = new Date();
  const threeDaysLater = new Date(currentDate.setDate(currentDate.getDate() + 3)); // 3 days ahead

  const snapshot = await admin.firestore().collection('appointments')
    .where('appointmentDate', '==', threeDaysLater.toISOString().split('T')[0]) // Match appointments 3 days ahead
    .get();

  snapshot.forEach(doc => {
    const data = doc.data();
    const email = data.email;
    const appointmentTime = data.appointmentTimeStart;
    
    sendEmailNotification(
      email,
      'Appointment Reminder - 3 Days Before',
      `Dear ${data.firstName},\n\nThis is a reminder that your appointment with Dr. ${data.doctor} is scheduled for ${data.appointmentDate} at ${appointmentTime}. Please ensure you are available.`
    );
  });
});

// Function to check appointments 24 hours before
exports.sendTwentyFourHoursBefore = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const currentDate = new Date();
  const twentyFourHoursLater = new Date(currentDate.setDate(currentDate.getDate() + 1)); // 1 day ahead

  const snapshot = await admin.firestore().collection('appointments')
    .where('appointmentDate', '==', twentyFourHoursLater.toISOString().split('T')[0]) // Match appointments 24 hours ahead
    .get();

  snapshot.forEach(doc => {
    const data = doc.data();
    const email = data.email;
    const appointmentTime = data.appointmentTimeStart;
    
    sendEmailNotification(
      email,
      'Appointment Reminder - 24 Hours Before',
      `Dear ${data.firstName},\n\nThis is a reminder that your appointment with Dr. ${data.doctor} is scheduled for ${data.appointmentDate} at ${appointmentTime}. Please be prepared.`
    );
  });
});

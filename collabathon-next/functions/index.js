const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// Set custom claims based on Firestore role doc on user creation
exports.setUserRole = functions.auth.user().onCreate(async (user) => {
  const userDoc = await db.collection('users').doc(user.uid).get();
  const role = userDoc.exists ? userDoc.data().role : 'student';
  await admin.auth().setCustomUserClaims(user.uid, { role });
  await db.collection('notifications').add({
    userId: user.uid,
    type: 'system',
    content: `Welcome to Collabathon! Role set to ${role}.`,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
});

// HTTP callable to refresh claims manually if role changes
exports.refreshRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  const uid = context.auth.uid;
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) throw new functions.https.HttpsError('not-found', 'User not found');
  const role = userDoc.data().role || 'student';
  await admin.auth().setCustomUserClaims(uid, { role });
  return { role };
});

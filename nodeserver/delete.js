// clearFirestore.js
require('dotenv').config();

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

// Replace this with the dynamic serviceAccount config if not using JSON file
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};


initializeApp({
  credential: cert(serviceAccount),
});


const db = getFirestore();

// List your collections here
const collectionsToDelete = ['projects', 'backings'];

async function deleteCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();

  if (snapshot.empty) {
    console.log(`⚠️ No documents found in "${collectionName}".`);
    return;
  }

  const batchSize = 500;
  let count = 0;

  while (!snapshot.empty) {
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      count++;
    });

    await batch.commit();
    console.log(`✅ Deleted ${count} documents from "${collectionName}".`);

    // Fetch again if more than 500 docs
    if (snapshot.size === batchSize) {
      snapshot = await db.collection(collectionName).get();
    } else {
      break;
    }
  }
}

async function clearAll() {
  for (const collection of collectionsToDelete) {
    try {
      console.log(`🧹 Clearing "${collection}"...`);
      await deleteCollection(collection);
    } catch (err) {
      console.error(`❌ Failed to clear "${collection}":`, err.message);
    }
  }
  console.log('🚀 Firestore cleanup complete.');
}

clearAll();

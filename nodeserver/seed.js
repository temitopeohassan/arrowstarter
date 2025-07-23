// seed.js

require('dotenv').config();
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Service account setup
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

// Initialize Firebase
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Seeding function
async function seedData() {
const now = new Date();

  const projects = [
    {
    title: 'Digital Art Collection Genesis',
    description: 'An innovative collection exploring the intersection of traditional art and blockchain technology.',
    category: 'Art',
    goal: 6,
    raised: 0,
    supporters: 0,
    creatorAddress: '0xABC123...DEF',
    status: 'Funding Open',
    featured: true,
    image: 'https://emerald-blushing-mouse-798.mypinata.cloud/ipfs/bafkreihp3sduwqcklm2qpx2bocgorkmoygionwu2cljkawmtv7jh6sjkpe',
    createdAt: now,
    updatedAt: now,
    deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 14 days from now
    deliverablesMet: false,
    deliverablesNote: 'Initial concept art completed. Full release in progress.',
  },
  {
    title: 'Crypto Cookbook Vol. 1',
    description: 'A digital zine of onchain recipes.',
    category: 'Comics',
    goal: 5,
    raised: 1.2,
    supporters: 5,
    creatorAddress: '0xABC123...DEF',
    status: 'Funding Open',
    featured: false,
    image: 'https://emerald-blushing-mouse-798.mypinata.cloud/ipfs/bafybeidp2eh6nzeazauqujz3xg3n3u53zm6bgkrlkxiku2demwraoe7f5m',
    createdAt: now,
    updatedAt: now,
    deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    deliverablesMet: true,
    deliverablesNote: 'Digital cookbook released and distributed to supporters.',
  },
  {
    title: 'Experimental Music NFTs',
    description: 'Generative audio experiences on chain.',
    category: 'Music',
    goal: 3,
    raised: 2.69,
    supporters: 20,
    creatorAddress: '0x456DEF...789',
    status: 'Funding Open',
    featured: false,
    image: 'https://emerald-blushing-mouse-798.mypinata.cloud/ipfs/bafybeic6mzx7joh3mrb6k3bvywxzxwvucqikcqzgc5jdvgcfiauoh34rdm',
    createdAt: now,
    updatedAt: now,
    deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 30 days from now
    deliverablesMet: false,
    deliverablesNote: 'Still composing soundtracks and minting NFTs.',
  }
  ];

  const backings = [
    {
      projectId: '', // Will be set after project creation
      backerAddress: '0xBACKER001',
      amount: 500,
      createdAt: new Date()
    },
    {
      projectId: '', // Will be set after project creation
      backerAddress: '0xBACKER002',
      amount: 300,
      createdAt: new Date()
    }
  ];

  try {
    console.log('🌱 Seeding Firestore...');

    const createdProjects = [];
    for (const project of projects) {
      const docRef = await db.collection('projects').add(project);
      console.log(`✅ Project added with ID: ${docRef.id}`);
      createdProjects.push(docRef.id);
    }

    // Link backings to the created projects
    backings[0].projectId = createdProjects[0];
    backings[1].projectId = createdProjects[1];

    for (const backing of backings) {
      await db.collection('backings').add(backing);
      console.log(`🎉 Backing added for project ${backing.projectId}`);
    }

    console.log('✅ Seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

seedData();

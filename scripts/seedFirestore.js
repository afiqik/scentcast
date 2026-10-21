import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { initialPerfumes, initialComments } from '../src/data/seedData.js';

const firebaseConfig = {
  projectId: "scentcast-54308",
  databaseURL: "https://scentcast-54308-default-rtdb.asia-southeast1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedFirestore() {
  console.log('Seeding Firestore perfumes & comments...');
  try {
    for (const p of initialPerfumes) {
      await setDoc(doc(db, 'perfumes', p.id), p);
      console.log(`- Perfume: ${p.name}`);
    }

    for (const [perfumeId, commentsList] of Object.entries(initialComments)) {
      for (const c of commentsList) {
        await setDoc(doc(db, 'comments', c.id), c);
        console.log(`- Comment: ${c.userName} on ${perfumeId}`);
      }
    }

    console.log('Firestore Seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed Firestore:', err);
    process.exit(1);
  }
}

seedFirestore();

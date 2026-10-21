import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import { initialWeatherData } from '../src/data/seedData.js';

const firebaseConfig = {
  projectId: "scentcast-54308",
  databaseURL: "https://scentcast-54308-default-rtdb.asia-southeast1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
const rtdb = getDatabase(app);

async function seed() {
  console.log('Seeding RTDB weather data...');
  try {
    await set(ref(rtdb, 'weather'), initialWeatherData);
    console.log('RTDB Seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed RTDB:', err);
    process.exit(1);
  }
}

seed();

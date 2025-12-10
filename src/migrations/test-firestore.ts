import { firestore } from '../utils/firebase';

async function testFirestore() {
  try {
    console.log('Testing Firestore connection...');
    if (!firestore) {
      console.log('Firestore is not configured');
      return;
    }
    
    // Test if we can connect to Firestore
    const db = firestore;
    const heroRatings = await db.collection('heroRatings').limit(1).get();
    console.log(`Hero ratings collection has ${heroRatings.size} documents`);
    
    const votes = await db.collection('votes').limit(1).get();
    console.log(`Votes collection has ${votes.size} documents`);
    
  } catch (error) {
    console.error('Error testing Firestore:', error);
  }
}

testFirestore().catch(console.error);
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clockmate';

async function check() {
  console.log('Checking Data in MongoDB...');
  try {
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('\n--- COLLECTIONS ---');
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`${col.name}: ${count} documents`);
      
      if (count > 0) {
        const sample = await db.collection(col.name).findOne({});
        console.log(`Sample ${col.name}:`, JSON.stringify(sample, null, 2));
      }
    }

  } catch (err) {
    console.error('Check failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

check();

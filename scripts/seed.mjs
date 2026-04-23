import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clockmate';

// Define Schemas manually for the script since we're outside the app's module context
const CompanySchema = new mongoose.Schema({
  name: String,
  email: String,
  password_hash: String,
  status: { type: String, default: 'Active' },
  created_at: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password_hash: String,
  role: String,
  company_id: mongoose.Schema.Types.ObjectId,
  status: { type: String, default: 'Active' },
  created_at: { type: Date, default: Date.now }
});

const AttendanceSchema = new mongoose.Schema({
  user_id: mongoose.Schema.Types.ObjectId,
  clock_in_time: Date,
  clock_out_time: Date,
  status: { type: String, default: 'Valid' }
});

async function seed() {
  console.log('Connecting to MongoDB...');
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    // Models
    const Company = mongoose.model('Company', CompanySchema);
    const User = mongoose.model('User', UserSchema);
    const Attendance = mongoose.model('Attendance', AttendanceSchema);

    // Clean up existing mock data
    await Company.deleteMany({ email: 'hello@mockcorp.com' });
    await User.deleteMany({ email: { $in: ['admin@mockcorp.com', 'staff@mockcorp.com'] } });

    console.log('Creating Mock Company...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const mockCompany = await Company.create({
      name: 'Mock Corp Industries',
      email: 'hello@mockcorp.com',
      password_hash: passwordHash,
      status: 'Active'
    });

    console.log('Creating Mock Users...');
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@mockcorp.com',
      password_hash: passwordHash,
      role: 'Admin',
      company_id: mockCompany._id
    });

    const staffUser = await User.create({
      name: 'Staff Member',
      email: 'staff@mockcorp.com',
      password_hash: passwordHash,
      role: 'Staff',
      company_id: mockCompany._id
    });

    console.log('Creating Mock Attendance...');
    await Attendance.create({
      user_id: staffUser._id,
      clock_in_time: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      clock_out_time: new Date(),
      status: 'Valid'
    });

    console.log('--- SEED REPORT ---');
    console.log(`Company ID: ${mockCompany._id}`);
    console.log(`Admin Login: admin@mockcorp.com / password123`);
    console.log(`Staff Login: staff@mockcorp.com / password123`);
    
    // Summary of current data
    const totals = {
      companies: await Company.countDocuments(),
      users: await User.countDocuments(),
      attendance: await Attendance.countDocuments()
    };
    console.log('Current DB Stats:', totals);

  } catch (err) {
    console.error('Seeding failed:', err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.log('\nTIP: Make sure you have set the MONGODB_URI environment variable.');
    }
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();

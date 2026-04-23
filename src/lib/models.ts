import mongoose from 'mongoose';

// --- Company Schema ---
const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  address: { type: String },
  payroll_cycle: { type: String, default: 'Fortnight' },
  status: { type: String, default: 'Active' },
  // Geofencing fields
  lat: { type: Number, default: 0 },
  lng: { type: Number, default: 0 },
  geofence_radius: { type: Number, default: 500 }, // Default 500 meters
  geofence_enabled: { type: Boolean, default: false },
  // Payroll Rates (Penalties)
  ot_rate: { type: Number, default: 1.5 },       // 150%
  evening_loading: { type: Number, default: 0.15 }, // +15%
  night_loading: { type: Number, default: 0.30 },   // +30%
  holiday_rate: { type: Number, default: 2.5 },    // 250%
  created_at: { type: Date, default: Date.now }
});

// --- User Schema ---
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Staff'], default: 'Staff' },
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  hourly_rate: { type: Number, default: 0 },
  status: { type: String, default: 'Active' },
  reset_pin: { type: String, default: null },
  reset_expires: { type: Date, default: null },
  created_at: { type: Date, default: Date.now }
});

// --- Attendance Schema ---
const AttendanceSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clock_in_time: { type: Date, required: true },
  clock_out_time: { type: Date },
  latitude: { type: Number },
  longitude: { type: Number },
  status: { type: String, default: 'Valid' },
  notes: { type: String },
  // Approval workflow
  approval_status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approved_by_name: { type: String, default: null },
  approved_at: { type: Date, default: null }
});

// --- Payroll Schema ---
const PayrollSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  period_start: { type: Date, required: true },
  period_end: { type: Date, required: true },
  total_gross_pay: { type: Number, required: true },
  approved_by_name: { type: String, default: 'COMPANY ADMIN' },
  employee_records: [{
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    user_name: String,
    total_hours: Number,
    reg_hours: Number,
    ot_hours: Number,
    evening_hours: Number,       // 6pm–midnight: 15% loading
    night_hours: Number,         // midnight–6am: 30% loading
    public_holiday_hours: Number,// 250% of base rate
    hourly_rate: Number,
    base_pay: Number,
    ot_pay: Number,
    evening_loading: Number,
    night_loading: Number,
    public_holiday_pay: Number,
    gross_pay: Number,
    tax: Number,
    net_pay: Number,
    daily_shifts: [{
      date: Date,
      clock_in: Date,
      clock_out: Date,
      hours: Number,
      reg_hrs: Number,
      ot_hrs: Number,
      eve_hrs: Number,
      night_hrs: Number,
      ph_hrs: Number
    }]
  }],
  status: { type: String, default: 'Completed' },
  created_at: { type: Date, default: Date.now }
});

// --- Shift Schema ---
const ShiftSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  title: { type: String, default: 'Shift' },
  notes: { type: String },
  status: { type: String, enum: ['Scheduled', 'Logged', 'Completed', 'Cancelled'], default: 'Scheduled' },
  created_at: { type: Date, default: Date.now }
});

export const Company = mongoose.models.Company || mongoose.model('Company', CompanySchema, 'companies');
export const User = mongoose.models.User || mongoose.model('User', UserSchema, 'users');
export const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema, 'attendances');
export const Payroll = mongoose.models.Payroll || mongoose.model('Payroll', PayrollSchema, 'payrolls');
export const Shift = mongoose.models.Shift || mongoose.model('Shift', ShiftSchema, 'shifts');

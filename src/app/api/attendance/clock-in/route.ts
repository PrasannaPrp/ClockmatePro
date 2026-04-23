import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import { Attendance, Company } from '@/lib/models';
import { calculateDistance } from '@/lib/utils';

const JWT_SECRET = process.env.JWT_SECRET || 'clockmate-secret-key';

async function authenticate(req: Request) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as any; } catch { return null; }
}

export async function POST(req: Request) {
  const userPayload = await authenticate(req);
  if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await dbConnect();
    const { lat, lng } = await req.json().catch(() => ({}));
    
    // Safety check: Don't allow double clock-in
    const existing = await Attendance.findOne({ 
      user_id: userPayload.id, 
      $or: [
        { clock_out_time: { $exists: false } },
        { clock_out_time: null }
      ]
    });

    if (existing) {
      return NextResponse.json({ 
        error: 'You are already clocked in.',
        alreadyDone: true 
      }, { status: 400 });
    }

    // Fetch Company Geofence Settings
    const company = await Company.findById(userPayload.companyId);
    
    let status = 'Valid';
    
    // Check if coordinates are missing (Bypass case)
    if (lat === null || lat === undefined || lng === null || lng === undefined) {
      status = 'No-GPS';
    } else if (company?.geofence_enabled && company.lat !== undefined && company.lng !== undefined) {
      const distance = calculateDistance(lat, lng, company.lat, company.lng);
      if (distance > (company.geofence_radius || 500)) {
        status = 'Off-site';
      }
    }
    
    const attendance = await Attendance.create({
      user_id: userPayload.id,
      clock_in_time: new Date(),
      latitude: lat || null,
      longitude: lng || null,
      status: status,
      approval_status: 'Pending' // Explicitly set to ensure it shows in the Pending tab
    });
    
    return NextResponse.json({ 
      success: true, 
      status: status,
      distanceFromOffice: (lat && lng && company?.geofence_enabled) ? calculateDistance(lat, lng, company.lat, company.lng) : null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

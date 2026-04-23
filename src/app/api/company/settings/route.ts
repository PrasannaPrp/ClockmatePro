import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import { Company } from '@/lib/models';

const JWT_SECRET = process.env.JWT_SECRET || 'clockmate-secret-key';

async function authenticate(req: Request) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as any; } catch { return null; }
}

export async function GET(req: Request) {
  const userPayload = await authenticate(req);
  if (!userPayload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const company = await Company.findById(userPayload.companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const data: any = {
      name: company.name,
      address: company.address
    };

    // Only Admins get administrative and sensitive settings
    if (userPayload.role === 'Admin') {
      data.geofence_enabled = company.geofence_enabled;
      data.lat = company.lat;
      data.lng = company.lng;
      data.geofence_radius = company.geofence_radius;
      data.ot_rate = company.ot_rate || 1.5;
      data.evening_loading = company.evening_loading || 0.15;
      data.night_loading = company.night_loading || 0.30;
      data.holiday_rate = company.holiday_rate || 2.5;
    }

    return NextResponse.json({
      success: true,
      settings: data
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const userPayload = await authenticate(req);
  if (!userPayload || userPayload.role !== 'Admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await req.json();
    
    // Whitelist fields to update
    const updates: any = {};
    if (typeof body.geofence_enabled === 'boolean') updates.geofence_enabled = body.geofence_enabled;
    if (typeof body.lat === 'number') updates.lat = body.lat;
    if (typeof body.lng === 'number') updates.lng = body.lng;
    if (typeof body.geofence_radius === 'number') updates.geofence_radius = body.geofence_radius;
    
    // Payroll Rate Updates
    if (typeof body.ot_rate === 'number') updates.ot_rate = body.ot_rate;
    if (typeof body.evening_loading === 'number') updates.evening_loading = body.evening_loading;
    if (typeof body.night_loading === 'number') updates.night_loading = body.night_loading;
    if (typeof body.holiday_rate === 'number') updates.holiday_rate = body.holiday_rate;

    const company = await Company.findByIdAndUpdate(
      userPayload.companyId,
      { $set: updates },
      { new: true }
    );

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, settings: company });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

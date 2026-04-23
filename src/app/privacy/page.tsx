import React from 'react';
import { PublicFooter } from '../../components/public/PublicFooter';
import { PublicHeader } from '../../components/public/PublicHeader';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <main className="max-w-4xl mx-auto py-24 px-6">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-4 italic">Privacy Policy</h1>
        <p className="text-slate-500 mb-12 font-medium">Last updated: April 23, 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-600">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">1. Information We Collect</h2>
            <p>
              To provide our workforce management services, we collect user identity data, organization details, and precise geolocation data (GPS coordinates) during attendance events (clock-in/out).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">2. How We Use Data</h2>
            <p>
              Your data is exclusively used to:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Verify attendance within designated geofences.</li>
              <li>Calculate accurate payroll based on enterprise agreements.</li>
              <li>Provide administrative visibility into live workforce status.</li>
              <li>Improve system security and performance.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">3. Data Sharing</h2>
            <p>
              We do not sell your personal data. Attendance data is only shared with the authorized administrators of your specific organization. Global diagnostics may be shared with our infrastructure partners (e.g., Vercel, MongoDB) solely for service delivery.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">4. Security</h2>
            <p>
              We employ industry-standard encryption (AES-256) for all data at rest and TLS for data in transit. Access to the dashboard is strictly controlled via JSON Web Token (JWT) authentication.
            </p>
          </section>

          <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 italic">
            Questions regarding this policy should be directed to our Privacy Officer at <strong>legal@clockmate.io</strong>.
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

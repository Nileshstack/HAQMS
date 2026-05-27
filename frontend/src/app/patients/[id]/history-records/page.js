'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import { useAuth } from '@/context/AuthContext';

export default function PatientHistoryRecordsPage() {
  const params = useParams();
  const patientId = params?.id;
  const { token, API_BASE_URL, user } = useAuth();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!patientId) return;
      if (!token) {
        setLoading(false);
        setError('You must be signed in to view patient records.');
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load patient');
        if (!cancelled) setPatient(data);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [patientId, token, API_BASE_URL]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-8 space-y-6">
        <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
            Patient History Records
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Minimal placeholder page to avoid 404. In a real system, this would list lab results,
            prescriptions, diagnoses, and uploaded documents with strict RBAC + audit logging.
          </p>
        </div>

        {loading ? (
          <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm text-slate-400">
            Loading patient record...
          </div>
        ) : error ? (
          <div className="glass p-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-500 text-sm">
            {error}
          </div>
        ) : (
          <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {patient?.name}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Phone: {patient?.phoneNumber || '—'} · Email: {patient?.email || '—'} · Gender:{' '}
              {patient?.gender || '—'} · Age: {patient?.age ?? '—'}
            </div>
            <div className="text-sm text-slate-700 dark:text-slate-300">
              Medical history: {patient?.medicalHistory || 'No medical history recorded.'}
            </div>
            <div className="pt-2 text-xs text-slate-400 font-semibold">
              Signed in as: {user?.name || 'Unknown'} ({user?.role || 'Unknown'})
            </div>
            <div className="pt-4">
              <Link href="/dashboard" className="text-teal-600 dark:text-teal-400 font-extrabold text-sm hover:underline">
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


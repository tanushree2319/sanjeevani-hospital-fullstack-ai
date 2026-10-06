import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { doctors } from '../data/hospitalData';
import { apiRequest } from '../lib/api';
import type { Doctor } from '../types';

export default function DoctorsPage() {
  const [directory, setDirectory] = useState<Doctor[]>(doctors);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    apiRequest<Doctor[]>('/api/doctors')
      .then(setDirectory)
      .catch(() => setUsingFallback(true));
  }, []);

  return (
    <>
      <PageHeader title="Our Doctors" subtitle="Experienced specialists dedicated to your care" />

      <section className="py-5">
        <div className="container">
          {usingFallback && <p className="small text-muted mb-3" role="status">Showing locally cached directory information.</p>}
          <div className="row g-4">
            {directory.map((doctor) => (
              <div key={doctor.id} className="col-md-6 col-lg-4 fade-up">
                <div className="doctor-card card p-4 text-center border-0 shadow-sm h-100">
                  <h5 className="fw-bold">{doctor.name}</h5>
                  <p className="qualification">{doctor.qualification}</p>
                  <p className="doctor-specialty">{doctor.specialty}</p>
                  <span className="badge rounded-pill bg-primary-subtle text-primary doctor-department">{doctor.department}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { services } from '../data/hospitalData';
import { apiRequest } from '../lib/api';
import type { Service } from '../types';

export default function ServicesPage() {
  const [directory, setDirectory] = useState<Service[]>(services);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    apiRequest<Service[]>('/api/services')
      .then(setDirectory)
      .catch(() => setUsingFallback(true));
  }, []);

  return (
    <>
      <PageHeader title="Our Medical Services" subtitle="Comprehensive and compassionate healthcare services available at Sanjeevani Hospital, Nagpur." />

      <section className="py-5">
        <div className="container">
          {usingFallback && <p className="small text-muted mb-3" role="status">Showing locally cached service information.</p>}
          <div className="row g-4">
            {directory.map((service) => (
              <div key={service.id} className="col-md-6 col-lg-4">
                <div className="card service-card border-0 shadow-sm h-100 text-center p-4">
                  <div className="service-icon">
                    <i className={service.icon} aria-hidden="true" />
                  </div>
                  <h5 className="mt-3">{service.title}</h5>
                  <p className="text-muted">{service.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-5">
            <h4 className="mb-3">Need Medical Assistance?</h4>
            <a href="/contact" className="btn btn-primary px-4 me-2">Book Appointment</a>
            <a href="tel:+91712648864" className="btn btn-outline-primary px-4">Call Hospital</a>
          </div>
        </div>
      </section>
    </>
  );
}

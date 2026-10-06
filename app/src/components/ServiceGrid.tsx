import { services } from '../data/hospitalData';

export default function ServiceGrid() {
  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="text-center mb-5">
          <h2 className="display-6 fw-bold">Our Medical Services</h2>
          <p className="text-muted">Comprehensive healthcare services under one roof</p>
        </div>

        <div className="row g-4">
          {services.map((service) => (
            <div key={service.id} className="col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm h-100 text-center p-4 service-card">
                <div className="service-icon">
                  <i className={service.icon} aria-hidden="true" />
                </div>
                <h5 className="service-title fw-semibold mb-3">{service.title}</h5>
                <p className="text-muted">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

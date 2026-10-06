import { doctors } from '../data/hospitalData';

export default function DoctorGrid() {
  return (
    <section className="py-5">
      <div className="container">
        <div className="text-center mb-5">
          <h2 className="display-6 fw-bold">Our Doctors</h2>
          <p className="text-muted">Experienced specialists dedicated to your care</p>
        </div>

        <div className="row g-4">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="col-md-6 col-lg-4 fade-up">
              <div className="doctor-card card p-4 text-center border-0 shadow-sm h-100">
                <h5 className="fw-bold">{doctor.name}</h5>
                <p className="qualification">{doctor.qualification}</p>
                <p className="doctor-specialty">{doctor.specialty}</p>
                <span className="badge rounded-pill bg-primary-subtle text-primary">{doctor.department}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import PageHeader from '../components/PageHeader';
import hospitalFrontImage from '../assets/hero.png';

export default function AboutPage() {
  return (
    <>
      <PageHeader title="Welcome to Sanjeevani Hospital" subtitle="Serving Nagpur since 2001" />

      <section className="py-5">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <img
                src={hospitalFrontImage}
                className="img-fluid rounded shadow-sm"
                alt="Exterior of Sanjeevani Hospital in Nagpur"
                loading="lazy"
              />
            </div>

            <div className="col-lg-6">
              <h3 className="section-subtitle mb-3">Who We Are</h3>
              <p className="lead">
                Sanjeevani Nursing Home & Multispeciality Hospital has been dedicated to providing comprehensive and compassionate healthcare in Nagpur since 2001. We offer advanced medical services including emergency and accident care delivered by experienced specialists.
              </p>
              <p className="text-muted">
                Our vision is to serve as Nagpur’s trusted centre of advanced, ethical and affordable healthcare — where every patient feels cared for, respected and safe.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container">
          <div className="card border-0 shadow-sm p-5 text-center">
            <h3 className="fw-bold mb-3">Establishment & Vision</h3>
            <p className="section-subtitle fw-semibold">Serving Nagpur Since 2001</p>
            <p className="lead">
              “Our Vision is to be Nagpur’s trusted centre for advanced, ethical and affordable healthcare — where every patient feels cared for, respected and safe.”
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

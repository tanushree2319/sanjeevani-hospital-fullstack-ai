import AIChatAssistant from '../components/AIChatAssistant';
import DoctorGrid from '../components/DoctorGrid';
import FaqList from '../components/FaqList';
import Hero from '../components/Hero';
import ServiceGrid from '../components/ServiceGrid';
import { hospitalInfo } from '../data/hospitalData';

export default function HomePage() {
  return (
    <>
      <Hero />

      <section id="about" className="about py-5 bg-white">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-6 fw-bold">About Sanjeevani Hospital</h2>
            <p className="text-muted">Committed to compassionate & advanced healthcare</p>
          </div>

          <div className="row align-items-center g-5">
            <div className="col-lg-6 text-center">
              <img
                src="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1000&q=80"
                className="img-fluid rounded shadow-sm"
                alt="Hospital front view"
                loading="lazy"
              />
            </div>

            <div className="col-lg-6">
              <h4 className="section-subtitle mb-3">Who We Are</h4>
              <p className="lead">
                {hospitalInfo.name} has been dedicated to providing comprehensive and compassionate healthcare in Nagpur since 2001. We offer advanced medical services, emergency response, and thoughtful specialist support.
              </p>
              <p className="text-muted">
                संजीवनी नर्सिंग होम आणि मल्टिस्पेशालिटी हॉस्पिटल २००१ पासून नागपूरमध्ये सर्वांगीण आणि प्रेमळ आरोग्यसेवा देण्यासाठी कटिबद्ध आहे.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ServiceGrid />

      <section className="py-5 bg-white">
        <div className="container">
          <div className="row g-4 text-center">
            <div className="col-md-3">
              <div className="stat-card">
                <h3>2001</h3>
                <p>Founded</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card">
                <h3>10+</h3>
                <p>Specialists</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card">
                <h3>24/7</h3>
                <p>Emergency Support</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card">
                <h3>100%</h3>
                <p>Patient-first Care</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <DoctorGrid />
      <AIChatAssistant />
      <FaqList />
    </>
  );
}

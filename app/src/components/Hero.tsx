import { Link } from 'react-router-dom';

const slides = ['hero.webp', 'hero2.webp', 'hero3.webp'];

export default function Hero() {
  return (
    <section className="hero position-relative">
      <div className="hero-slider" aria-label="Hospital highlights">
        {slides.map((slide, index) => (
          <img
            key={slide}
            src={`https://images.unsplash.com/${index === 0 ? 'photo-1584515933487-779824d29309' : index === 1 ? 'photo-1538108149393-fbbd81895973' : 'photo-1576091160550-2173dba999ef'}?auto=format&fit=crop&w=1600&q=80`}
            className={`hero-slide ${index === 0 ? 'active' : ''}`}
            alt="Healthcare facility"
          />
        ))}
      </div>

      <div className="hero-content container">
        <div className="row">
          <div className="col-lg-6">
            <div className="hero-text">
              <h1 className="display-4 fw-bold mb-3">Multispeciality Hospital in Nagpur</h1>
              <p className="hero-subtitle lead mb-2">Caring for you always.</p>
              <p className="hero-marathi text-light opacity-75">तुमची काळजी, सदैव आमची जबाबदारी.</p>
              <div className="mt-4">
                <Link to="/contact" className="btn btn-primary px-4 py-2 fw-semibold">Book Appointment</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

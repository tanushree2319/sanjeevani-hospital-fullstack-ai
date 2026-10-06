import { faqs } from '../data/hospitalData';

export default function FaqList() {
  return (
    <section className="py-5 bg-white">
      <div className="container">
        <div className="text-center mb-5">
          <h2 className="display-6 fw-bold">Frequently Asked Questions</h2>
        </div>

        <div className="accordion faq-accordion" id="faqAccordion">
          {faqs.map((faq, index) => (
            <div key={faq.question} className="accordion-item border-0 shadow-sm mb-3">
              <h2 className="accordion-header" id={`heading-${index}`}>
                <button
                  className={`accordion-button ${index === 0 ? '' : 'collapsed'}`}
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target={`#collapse-${index}`}
                  aria-expanded={index === 0 ? 'true' : 'false'}
                  aria-controls={`collapse-${index}`}
                >
                  {faq.question}
                </button>
              </h2>
              <div
                id={`collapse-${index}`}
                className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`}
                aria-labelledby={`heading-${index}`}
                data-bs-parent="#faqAccordion"
              >
                <div className="accordion-body text-muted">{faq.answer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

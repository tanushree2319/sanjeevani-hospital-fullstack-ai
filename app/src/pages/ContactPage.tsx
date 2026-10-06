import { useState } from 'react';
import { hospitalInfo } from '../data/hospitalData';
import { apiRequest } from '../lib/api';

type FormState = {
  name: string;
  phone: string;
  email: string;
  date: string;
  department: string;
  message: string;
};

const initialState: FormState = {
  name: '',
  phone: '',
  email: '',
  date: '',
  department: 'general-medicine',
  message: '',
};

export default function ContactPage() {
  const [formData, setFormData] = useState<FormState>(initialState);
  const [minimumDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSubmitted(false);
    try {
      await apiRequest<{ appointment: { id: string } }>('/api/appointments', {
        method: 'POST',
        body: JSON.stringify({ ...formData, departmentId: formData.department }),
      });
      const message = new URLSearchParams({ text: `New appointment request: ${formData.name}, ${formData.phone}, ${formData.date}, ${formData.department}` });
      setWhatsappUrl(`https://wa.me/${hospitalInfo.whatsapp}?${message.toString()}`);
      setSubmitted(true);
      setFormData(initialState);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not submit your request. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="py-5 bg-light text-center">
        <div className="container">
          <h1 className="display-6 fw-bold">Book an Appointment</h1>
          <p className="text-muted">Get in touch with {hospitalInfo.name} for consultation and medical care.</p>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-7 fade-up">
              <div className="card border-0 shadow-sm p-4 contact-form-card">
                <h4 className="mb-4">Appointment Request</h4>

                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Full Name</label>
                      <input type="text" name="name" className="form-control" value={formData.name} onChange={handleChange} placeholder="Enter your name" required />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Phone Number</label>
                      <input type="tel" name="phone" className="form-control" value={formData.phone} onChange={handleChange} placeholder="Enter phone number" required />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input type="email" name="email" className="form-control" value={formData.email} onChange={handleChange} placeholder="Enter email" />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Preferred Date</label>
                      <input type="date" name="date" className="form-control" min={minimumDate} value={formData.date} onChange={handleChange} required />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Department</label>
                      <select name="department" className="form-select" value={formData.department} onChange={handleChange}>
                        <option value="general-medicine">General Medicine</option>
                        <option value="gynecology">Gynecology</option>
                        <option value="orthopedics">Orthopedics</option>
                        <option value="pediatrics">Pediatrics</option>
                        <option value="cardiology">Cardiology</option>
                        <option value="emergency">Emergency</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label">Message</label>
                      <textarea name="message" className="form-control" rows={3} value={formData.message} onChange={handleChange} placeholder="Describe your concern" />
                    </div>

                    <div className="col-12">
                      <button type="submit" className="btn btn-primary px-4 mt-2" disabled={busy}>Book Appointment</button>
                      {busy && <span className="ms-3 text-muted" role="status">Submitting request...</span>}
                      {error && <p className="text-danger mt-3" role="alert">{error}</p>}
                      {submitted && <p className="text-success mt-3" role="status">Request received. <a href={whatsappUrl} target="_blank" rel="noreferrer">Continue in WhatsApp</a></p>}
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div className="col-lg-5 fade-up">
              <div className="contact-info">
                <h4 className="mb-4">Contact Information</h4>
                <div className="contact-box mb-3">
                  <i className="bi bi-telephone-fill" aria-hidden="true" />
                  <div>
                    <strong>Call Hospital</strong>
                    <p className="mb-0">{hospitalInfo.phone}</p>
                  </div>
                </div>
                <div className="contact-box">
                  <i className="bi bi-geo-alt-fill" aria-hidden="true" />
                  <div>
                    <strong>Address</strong>
                    <p className="mb-0">{hospitalInfo.address}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

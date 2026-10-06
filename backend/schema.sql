CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('patient', 'admin')) DEFAULT 'patient',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  focus TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  qualification TEXT NOT NULL,
  specialty TEXT NOT NULL,
  department_id TEXT NOT NULL REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'bi bi-hospital'
);

CREATE TABLE IF NOT EXISTS faqs (
  id BIGSERIAL PRIMARY KEY,
  question TEXT NOT NULL UNIQUE,
  answer TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  appointment_date DATE NOT NULL,
  department_id TEXT NOT NULL REFERENCES departments(id),
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS appointments_patient_id_idx ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS appointments_date_idx ON appointments(appointment_date DESC);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO departments (id, name, focus, description) VALUES
  ('general-medicine', 'General Medicine', 'Primary consultation and chronic care', 'Consultation and follow-up for common and long-term health concerns.'),
  ('cardiology', 'Cardiology', 'Heart and diabetes management', 'Cardiac screening, prevention, and specialist follow-up.'),
  ('orthopedics', 'Orthopedics', 'Bone, joint, and mobility care', 'Specialist support for fractures, joints, mobility, and musculoskeletal concerns.'),
  ('gynecology', 'Gynecology & Obstetrics', 'Women’s health and maternity care', 'Women’s health, pregnancy support, and preventive care.'),
  ('pediatrics', 'Pediatrics', 'Child and adolescent wellness', 'Health consultations and follow-up for children and adolescents.'),
  ('emergency', 'Emergency & Accident Care', 'Immediate intervention and trauma support', 'Urgent triage and accident care; call emergency services for immediate danger.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO doctors (id, name, qualification, specialty, department_id) VALUES
  ('dr-sanjeevani-ramteke', 'Dr. Sanjeevani Ramteke', 'MBBS, M.D. Strirog Tadnya', 'Consulting Physician & Surgeon', 'general-medicine'),
  ('dr-kishore-ramteke', 'Dr. Kishore Ramteke', 'MBBS (Bom), MD, FCCM, CCDM', 'Consulting Physician', 'general-medicine'),
  ('dr-pranay-lanjewar', 'Dr. Pranay Lanjewar', 'MBBS, MD', 'Consulting Physician, Cardiologist & Diabetologist', 'cardiology'),
  ('dr-madhukar-thakre', 'Dr. Madhukar Thakre', 'MBBS, MS', 'General Surgeon & Cancer Specialist', 'emergency'),
  ('dr-pitamber-masram', 'Dr. Pitamber Masram', 'MBBS, MS', 'General Surgeon', 'emergency'),
  ('dr-pawan-gulhane', 'Dr. Pawan Gulhane', 'MBBS, DGO', 'Gynecologist & Obstetrician', 'gynecology'),
  ('dr-divya-assudani', 'Dr. Divya Assudani', 'MBBS, MS', 'Gynecologist & Obstetrician', 'gynecology'),
  ('dr-nayankumar', 'Dr. Nayankumar', 'MBBS, DCH', 'Pediatrician', 'pediatrics'),
  ('dr-ashish-assudani', 'Dr. Ashish Assudani', 'MBBS, DCH', 'Orthopedic Surgeon', 'orthopedics'),
  ('dr-sanjeevani-lanjewar', 'Dr. Sanjeevani Lanjewar', 'MBBS, DA', 'Anaesthesiologist & Intensivist', 'emergency')
ON CONFLICT (id) DO NOTHING;

INSERT INTO services (id, title, description, icon) VALUES
  ('emergency', 'Emergency & Accident Care', 'Immediate clinical attention and trauma support for urgent medical situations.', 'bi bi-activity'),
  ('general-medicine', 'General Medicine', 'Consultation and treatment for a wide range of health concerns.', 'bi bi-hospital'),
  ('cardiology', 'Cardiology & Diabetes Care', 'Check-ups, preventive support, and specialist follow-up.', 'bi bi-heart-pulse'),
  ('gynecology', 'Gynecology & Maternity', 'Women’s health, prenatal consultations, and maternity support.', 'bi bi-person-hearts'),
  ('orthopedics', 'Orthopedic Care', 'Specialist consultations for joint, fracture, and mobility concerns.', 'bi bi-bandaid'),
  ('pediatrics', 'Pediatrics', 'Dedicated consultations for infants, children, and adolescents.', 'bi bi-emoji-smile')
ON CONFLICT (id) DO NOTHING;

INSERT INTO faqs (question, answer) VALUES
  ('Do I need to book an appointment in advance?', 'Appointments are recommended for consultations, especially in specialist departments. Walk-in cases are supported for emergencies.'),
  ('What is the hospital address?', 'Sanjeevani Hospital is located at 25, Street Number 5, Near Mangalwari Bazar, Jaripatka, Nagpur – 440014.'),
  ('Is emergency care available?', 'The hospital offers emergency and accident care. For immediate danger, contact local emergency services.'),
  ('Can I contact the hospital by WhatsApp?', 'Yes, use the WhatsApp quick-access button or the phone number listed on the contact page.')
ON CONFLICT (question) DO NOTHING;
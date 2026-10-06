import type { Department, Doctor, FaqItem, HospitalInfo, Service } from '../types';

export const hospitalInfo: HospitalInfo = {
  name: 'Sanjeevani Hospital',
  tagline: 'Caring for you always.',
  address: '25, Street Number 5, Near Mangalwari Bazar, Jaripatka, Nagpur – 440014',
  phone: '0712-648864',
  whatsapp: '919822234434',
  email: 'care@sanjeevanihospital.in',
  established: 'Since 2001',
};

export const departments: Department[] = [
  {
    id: 'general-medicine',
    name: 'General Medicine',
    focus: 'Primary consultation and chronic care',
    description: 'Diagnosis and treatment for acute illnesses, infections, lifestyle disorders, and long-term health management.',
  },
  {
    id: 'cardiology',
    name: 'Cardiology',
    focus: 'Heart and diabetes management',
    description: 'Cardiac screening, prevention, and follow-up care for patients with heart conditions and diabetes concerns.',
  },
  {
    id: 'orthopedics',
    name: 'Orthopedics',
    focus: 'Bone, joint, and mobility care',
    description: 'Support for fractures, arthritis, sports injuries, mobility issues, and musculoskeletal pain.',
  },
  {
    id: 'gynecology',
    name: 'Gynecology & Obstetrics',
    focus: 'Women’s health and maternity care',
    description: 'Pregnancy support, reproductive health, preventive screenings, and women-focused treatment pathways.',
  },
  {
    id: 'pediatrics',
    name: 'Pediatrics',
    focus: 'Child and adolescent wellness',
    description: 'Routine child health checks, vaccination guidance, and treatment for developing health concerns.',
  },
  {
    id: 'emergency',
    name: 'Emergency & Accident Care',
    focus: 'Immediate intervention and trauma support',
    description: 'Fast triage, stabilization, and urgent clinical support for accident and emergency cases.',
  },
];

export const services: Service[] = [
  {
    id: 'emergency',
    title: 'Emergency & Accident Care',
    description: 'Immediate clinical attention and trauma support for urgent medical situations.',
    icon: 'bi bi-activity',
  },
  {
    id: 'general-medicine',
    title: 'General Medicine',
    description: 'Consultation and treatment for a wide range of acute and chronic illnesses.',
    icon: 'bi bi-hospital',
  },
  {
    id: 'cardiology',
    title: 'Cardiology & Diabetes Care',
    description: 'Check-ups, preventive support, and long-term management for heart and metabolic health.',
    icon: 'bi bi-heart-pulse',
  },
  {
    id: 'gynecology',
    title: 'Gynecology & Maternity',
    description: 'Comprehensive women’s health, prenatal care, and maternity support services.',
    icon: 'bi bi-person-hearts',
  },
  {
    id: 'orthopedics',
    title: 'Orthopedic Care',
    description: 'Treatment for joint pain, fractures, posture issues, and mobility challenges.',
    icon: 'bi bi-bandaid',
  },
  {
    id: 'pediatrics',
    title: 'Pediatrics',
    description: 'Dedicated care for infants, children, and adolescents with a family-first approach.',
    icon: 'bi bi-emoji-smile',
  },
];

export const doctors: Doctor[] = [
  { id: 'dr-sanjeevani-ramteke', name: 'Dr. Sanjeevani Ramteke', qualification: 'MBBS, M.D. Strirog Tadnya', specialty: 'Consulting Physician & Surgeon', department: 'General Medicine' },
  { id: 'dr-kishore-ramteke', name: 'Dr. Kishore Ramteke', qualification: 'MBBS (Bom), MD, FCCM, CCDM', specialty: 'Consulting Physician', department: 'General Medicine' },
  { id: 'dr-pranay-lanjewar', name: 'Dr. Pranay Lanjewar', qualification: 'MBBS, MD', specialty: 'Consulting Physician, Cardiologist & Diabetologist', department: 'Cardiology' },
  { id: 'dr-madhukar-thakre', name: 'Dr. Madhukar Thakre', qualification: 'MBBS, MS', specialty: 'General Surgeon & Cancer Specialist', department: 'Emergency' },
  { id: 'dr-pitamber-masram', name: 'Dr. Pitamber Masram', qualification: 'MBBS, MS', specialty: 'General Surgeon', department: 'Emergency' },
  { id: 'dr-pawan-gulhane', name: 'Dr. Pawan Gulhane', qualification: 'MBBS, DGO', specialty: 'Gynecologist & Obstetrician', department: 'Gynecology' },
  { id: 'dr-divya-assudani', name: 'Dr. Divya Assudani', qualification: 'MBBS, MS', specialty: 'Gynecologist & Obstetrician', department: 'Gynecology' },
  { id: 'dr-nayankumar', name: 'Dr. Nayankumar', qualification: 'MBBS, DCH', specialty: 'Pediatrician', department: 'Pediatrics' },
  { id: 'dr-ashish-assudani', name: 'Dr. Ashish Assudani', qualification: 'MBBS, DCH', specialty: 'Orthopedic Surgeon', department: 'Orthopedics' },
  { id: 'dr-sanjeevani-lanjewar', name: 'Dr. Sanjeevani Lanjewar', qualification: 'MBBS, DA', specialty: 'Anaesthesiologist & Intensivist', department: 'Emergency' },
];

export const faqs: FaqItem[] = [
  {
    question: 'Do I need to book an appointment in advance?',
    answer: 'Appointments are recommended for consultation, especially for specialist departments. Walk-in cases are supported for immediate emergencies.',
  },
  {
    question: 'What is the hospital address?',
    answer: 'Sanjeevani Hospital is located at 25, Street Number 5, Near Mangalwari Bazar, Jaripatka, Nagpur – 440014.',
  },
  {
    question: 'Is emergency care available?',
    answer: 'Yes. The hospital offers emergency and accident care services with prompt triage and urgent support.',
  },
  {
    question: 'Can I contact the hospital by WhatsApp?',
    answer: 'Yes, you can connect through the WhatsApp quick-access button or contact the listed phone number.',
  },
];

export const aiNavigationHints = [
  'General Medicine',
  'Cardiology',
  'Orthopedics',
  'Gynecology',
  'Pediatrics',
  'Emergency & Accident Care',
  'appointment booking',
  'doctor consultation',
  'insurance guidance',
  'hospital facilities',
];

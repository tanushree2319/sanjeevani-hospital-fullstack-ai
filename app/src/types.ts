export type Department = {
  id: string;
  name: string;
  focus: string;
  description: string;
};

export type Service = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export type Doctor = {
  id: string;
  name: string;
  qualification: string;
  specialty: string;
  department: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type HospitalInfo = {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  established: string;
};

export type AppointmentFormData = {
  name: string;
  phone: string;
  email: string;
  date: string;
  department: string;
  message: string;
};

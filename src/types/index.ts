export interface User {
  id: string;
  email: string;
  name: string;
  level: number;
  active: boolean;
  createdAt: Date;
  trainerId?: string;
  pendingTrainerApproval?: boolean;
  trainerCode?: string;
  online?: boolean;
  lastSeen?: Date;
  avatar?: string;
  bio?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  timezone?: string;
  language?: string;
  notifications?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  smsNotifications?: boolean;
  theme?: 'light' | 'dark' | 'system';
  currency?: string;
  measurementSystem?: 'metric' | 'imperial';
  dateFormat?: string;
  timeFormat?: string;
  weekStartsOn?: number;
  workDays?: number[];
  workHours?: {
    start: string;
    end: string;
  };
  breakTime?: {
    start: string;
    end: string;
  };
  maxStudents?: number;
  subscription?: {
    plan: string;
    status: string;
    startDate: Date;
    endDate: Date;
    autoRenew: boolean;
  };
  paymentInfo?: {
    method: string;
    last4: string;
    expiryDate: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  taxInfo?: {
    taxId: string;
    taxExempt: boolean;
  };
  documents?: {
    type: string;
    url: string;
    verified: boolean;
  }[];
  certifications?: {
    name: string;
    issuer: string;
    date: Date;
    expiryDate?: Date;
    url?: string;
  }[];
  specialties?: string[];
  experience?: {
    years: number;
    clients: number;
    successRate: number;
  };
  ratings?: {
    average: number;
    count: number;
  };
  socialMedia?: {
    platform: string;
    url: string;
  }[];
  availability?: {
    days: string[];
    hours: {
      start: string;
      end: string;
    };
  };
  pricing?: {
    hourly: number;
    monthly: number;
    yearly: number;
    currency: string;
  };
  services?: {
    name: string;
    description: string;
    price: number;
    duration: number;
  }[];
  testimonials?: {
    clientName: string;
    text: string;
    rating: number;
    date: Date;
  }[];
  achievements?: {
    title: string;
    description: string;
    date: Date;
  }[];
  education?: {
    degree: string;
    institution: string;
    year: number;
  }[];
  languages?: {
    language: string;
    proficiency: string;
  }[];
  interests?: string[];
  goals?: {
    shortTerm: string[];
    longTerm: string[];
  };
  preferences?: {
    communication: string[];
    learning: string[];
    teaching: string[];
  };
  settings?: {
    privacy: {
      profile: string;
      availability: string;
      contact: string;
    };
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    appearance: {
      theme: string;
      fontSize: string;
      contrast: string;
    };
    accessibility: {
      screenReader: boolean;
      highContrast: boolean;
      reducedMotion: boolean;
    };
  };
} 
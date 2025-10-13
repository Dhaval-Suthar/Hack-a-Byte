// Event-related type definitions
export interface Event {
  id: number;
  objectId?: string; // real Mongo ObjectId
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  type: string;
  capacity: number;
  registered: number;
  registrationEnabled?: boolean; // Field to control registration availability
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  tags: string[];
  speakers?: {
    name: string;
    role: string;
    company: string;
    avatar: number;
  }[];
  prizes?: {
    position: string;
    reward: string;
  }[];
  schedule?: {
    time: string;
    activity: string;
  }[];
  pricing?: {
    normal: number;
    extended?: number;
  };
  deviceRequirements?: {
    types: {
      mobile: boolean;
      desktop: boolean;
    };
    devices: {
      mobile: string[];
      desktop: string[];
    };
  };
  minTeamMembers?: number;
  maxTeamMembers?: number;
}

// Cashfree type declarations
export interface CashfreeResponse {
  order_id: string;
  cf_order_id?: string;
  payment_status?: string;
}

export interface CashfreeOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: CashfreeResponse) => void;
  prefill: {
    email: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

// Cashfree types are declared in lib/cashfree.ts

// Component prop types
export interface TypingTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export interface CountdownTimerProps {
  targetDate: string;
}

export interface DifficultyMeterProps {
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
}

export interface RegistrationModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Event view types
export type EventView = "upcoming" | "past";
export type EventTab = "info" | "schedule" | "speakers" | "prizes";

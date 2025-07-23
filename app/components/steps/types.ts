export interface ProjectFormData {
  title: string;
  description: string;
  category: string;
  goal: string;               // Consider changing to number
  threshold: string;          // Consider changing to number
  maxCap: string;             // Consider changing to number
  hasMaxCap: boolean;
  hasDeadline: boolean;
  fundingDeadline: string;    // Consider Date if you're doing date operations
  deliveryDate: string;       // Consider Date if you're doing date operations
  fundingIncrements: string;  // Consider changing to number
  image: File | null;
}

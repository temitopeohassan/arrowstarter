export interface ProjectFormData {
  title: string;
  description: string;
  category: string;
  goal: string;
  threshold: string;
  maxCap: string;
  hasMaxCap: boolean;
  hasDeadline: boolean;
  fundingDeadline: string;
  deliveryDate: string;
  fundingIncrements: string;
  image: File | null;
}

export interface ProjectFormWithPreview extends ProjectFormData {
  imagePreview: string;
}

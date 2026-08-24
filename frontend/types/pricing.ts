export interface IPricingPlan {
  _id?: string;
  name: string;
  description: string;
  monthly: number;
  yearly: number;
  currency?: string;
  features: string[];
  badge?: string;
  cta: string;
  ctaText?: string;
  highlight: boolean;
  isActive?: boolean;
  order?: number;
  isCustom?: boolean;
}

export interface IBudgetOption {
  _id?: string;
  label: string;
  value: string;
  isActive?: boolean;
  order?: number;
}

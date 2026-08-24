import { api } from '@/lib/api';

export interface BankAccount {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch?: string;
  routing?: string;
  iban?: string;
  swift?: string;
}

export interface PaymentConfig {
  bankAccounts: BankAccount[];
  bkashNumber?: string;
  bkashType?: string;
  nagadNumber?: string;
  instructions?: string;
}

export interface MilestoneTemplateItem {
  title: string;
  offsetDays: number;
  amount: number;
  tasks: string[];
}

export interface ProjectTemplate {
  serviceKey: string;
  milestones: MilestoneTemplateItem[];
}

export interface AutomationConfig {
  autoAssignLeads: boolean;
  salesAssigneeIds: string[];
  autoProposalOnConvert: boolean;
  applyProjectTemplate: boolean;
  milestoneBilling: boolean;
  templates: ProjectTemplate[];
}

export function getPaymentSettings() {
  return api.get<PaymentConfig>('/settings/payments');
}

export function updatePaymentSettings(data: PaymentConfig) {
  return api.patch<PaymentConfig>('/settings/payments', data);
}

export function getAutomationSettings() {
  return api.get<AutomationConfig>('/settings/automation');
}

export function updateAutomationSettings(data: AutomationConfig) {
  return api.patch<AutomationConfig>('/settings/automation', data);
}

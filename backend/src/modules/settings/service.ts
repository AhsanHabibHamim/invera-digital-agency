import Setting, { SETTINGS_KEYS, IProjectTemplate } from './model';

export interface PaymentConfig {
  enabledMethods: string[];
  bankAccounts: Array<{
    bankName: string;
    accountName: string;
    accountNumber: string;
    routingOrSwift?: string;
    branch?: string;
    instructions?: string;
  }>;
  bkashNumber: string;
  bkashType: string;
  nagadNumber: string;
  instructions: string;
}

export interface AutomationConfig {
  autoAssignLeads: boolean;
  salesAssigneeIds: string[];
  autoProposalOnConvert: boolean;
  applyProjectTemplate: boolean;
  milestoneBilling: boolean;
  templates: IProjectTemplate[];
}

const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  enabledMethods: ['bank_transfer', 'bkash', 'nagad'],
  bankAccounts: [
    {
      bankName: '',
      accountName: '',
      accountNumber: '',
      routingOrSwift: '',
      branch: '',
      instructions: '',
    },
  ],
  bkashNumber: '',
  bkashType: 'personal',
  nagadNumber: '',
  instructions: 'Send the payment using any method above, then submit the transaction reference here. We verify within 1 business day.',
};

const DEFAULT_AUTOMATION_CONFIG: AutomationConfig = {
  autoAssignLeads: true,
  salesAssigneeIds: [],
  autoProposalOnConvert: true,
  applyProjectTemplate: true,
  milestoneBilling: true,
  templates: [
    {
      serviceKey: 'web_development',
      label: 'Website Development',
      durationDays: 30,
      milestones: [
        { title: 'Discovery & Planning', offsetDays: 5, tasks: ['Kickoff call with client', 'Requirements document', 'Sitemap & wireframes'] },
        { title: 'UI/UX Design', offsetDays: 10, tasks: ['Design mockups', 'Client review round'] },
        { title: 'Development', offsetDays: 20, tasks: ['Frontend build', 'Backend integration', 'QA pass'] },
        { title: 'Launch & Handover', offsetDays: 30, tasks: ['Deployment', 'Handover docs', 'Training session'] },
      ],
    },
  ],
};

async function getSection<T>(key: string, defaults: T): Promise<T> {
  const doc = await Setting.findOne({ key });
  if (!doc) return defaults;
  return { ...defaults, ...(doc.value as object) } as T;
}

async function setSection<T>(key: string, value: T): Promise<void> {
  await Setting.updateOne({ key }, { $set: { value } }, { upsert: true });
}

export const settingsService = {
  getPaymentConfig: () => getSection<PaymentConfig>(SETTINGS_KEYS.PAYMENTS, DEFAULT_PAYMENT_CONFIG),

  updatePaymentConfig: (patch: Partial<PaymentConfig>) =>
    getSection<PaymentConfig>(SETTINGS_KEYS.PAYMENTS, DEFAULT_PAYMENT_CONFIG)
      .then((current) => setSection(SETTINGS_KEYS.PAYMENTS, { ...current, ...patch })),

  getAutomationConfig: () => getSection<AutomationConfig>(SETTINGS_KEYS.AUTOMATION, DEFAULT_AUTOMATION_CONFIG),

  updateAutomationConfig: (patch: Partial<AutomationConfig>) =>
    getSection<AutomationConfig>(SETTINGS_KEYS.AUTOMATION, DEFAULT_AUTOMATION_CONFIG)
      .then((current) => setSection(SETTINGS_KEYS.AUTOMATION, { ...current, ...patch })),
};

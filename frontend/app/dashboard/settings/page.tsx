'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import * as authService from '@/services/auth';
import {
  getPaymentSettings, updatePaymentSettings,
  getAutomationSettings, updateAutomationSettings,
  type PaymentConfig, type AutomationConfig,
} from '@/services/settings';
import { getErrorMessage } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Loader2, User, Lock, Landmark, Workflow, Plus, Trash2, Save, AlertCircle,
} from 'lucide-react';

type Tab = 'profile' | 'password' | 'payments' | 'automation';

const EMPTY_PAYMENT: PaymentConfig = {
  bankAccounts: [{ bankName: '', accountName: '', accountNumber: '', branch: '', routing: '' }],
  bkashNumber: '',
  bkashType: 'personal',
  nagadNumber: '',
  instructions: '',
};

export default function SettingsPage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // ── Profile ──────────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    avatarUrl: '',
    bio: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Sync form when the auth user hydrates (useEffect — never setState in render).
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        company: user.company || '',
        avatarUrl: (user as unknown as { avatarUrl?: string }).avatarUrl || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  // ── Password ─────────────────────────────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // ── Payments config ──────────────────────────────────────────────────────
  const [paymentForm, setPaymentForm] = useState<PaymentConfig | null>(null);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // ── Automation config ────────────────────────────────────────────────────
  const [automationForm, setAutomationForm] = useState<AutomationConfig | null>(null);
  const [loadingAutomation, setLoadingAutomation] = useState(false);

  useEffect(() => {
    if (!isAdmin || activeTab !== 'payments') return;
    setLoadingPayments(true);
    getPaymentSettings()
      .then((res) => setPaymentForm(res.success ? res.data : EMPTY_PAYMENT))
      .catch(() => setPaymentForm(EMPTY_PAYMENT))
      .finally(() => setLoadingPayments(false));
  }, [isAdmin, activeTab]);

  useEffect(() => {
    if (!isAdmin || activeTab !== 'automation') return;
    setLoadingAutomation(true);
    getAutomationSettings()
      .then((res) => setAutomationForm(res.success ? res.data : null))
      .catch(() => setAutomationForm(null))
      .finally(() => setLoadingAutomation(false));
  }, [isAdmin, activeTab]);

  const handleProfileSave = async () => {
    setSavingProfile(true);
    setProfileError('');
    try {
      const res = await authService.updateProfile({
        name: profileForm.name,
        phone: profileForm.phone,
        company: profileForm.company,
        avatarUrl: profileForm.avatarUrl,
        bio: profileForm.bio,
      });
      if (!res.success) {
        setProfileError(getErrorMessage(res, 'Failed to update profile'));
        return;
      }
      toast.success('Profile updated');
      refreshUser();
    } catch (err) {
      setProfileError(getErrorMessage(err, 'Failed to update profile'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    setSavingPassword(true);
    setPasswordError('');
    try {
      const res = await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (!res.success) {
        setPasswordError(getErrorMessage(res, 'Failed to change password'));
        return;
      }
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(getErrorMessage(err, 'Failed to change password'));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSavePayments = async () => {
    if (!paymentForm) return;
    try {
      const res = await updatePaymentSettings(paymentForm);
      if (res.success) toast.success('Payment settings saved — visible on client invoices.');
      else toast.error(getErrorMessage(res, 'Failed to save'));
    } catch {
      toast.error('Failed to save payment settings');
    }
  };

  const handleSaveAutomation = async () => {
    if (!automationForm) return;
    try {
      const res = await updateAutomationSettings(automationForm);
      if (res.success) toast.success('Automation rules saved.');
      else toast.error(getErrorMessage(res, 'Failed to save'));
    } catch {
      toast.error('Failed to save automation settings');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'password', label: 'Password', icon: Lock },
    { key: 'payments', label: 'Payment Info', icon: Landmark, adminOnly: true },
    { key: 'automation', label: 'Automation', icon: Workflow, adminOnly: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500">Manage your account and agency settings</p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {tabs
          .filter((tab) => !tab.adminOnly || isAdmin)
          .map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                className={`flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-500 hover:text-foreground'
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
      </div>

      {activeTab === 'profile' && (
        <div className="card p-6 max-w-lg">
          <h2 className="text-lg font-bold text-foreground mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="form-label">Name</label>
              <input className="input" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input className="input" value={profileForm.email} disabled />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input className="input" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Company</label>
              <input className="input" value={profileForm.company} onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Bio</label>
              <textarea className="input" rows={3} value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Avatar URL</label>
              <input className="input" value={profileForm.avatarUrl} onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })} />
            </div>
            {profileError && (
              <div className="form-alert form-alert-error">
                <AlertCircle className="w-4 h-4" />
                <span>{profileError}</span>
              </div>
            )}
            <button className="btn btn-primary btn-md w-full" onClick={handleProfileSave} disabled={savingProfile}>
              {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="card p-6 max-w-lg">
          <h2 className="text-lg font-bold text-foreground mb-4">Change Password</h2>
          <div className="space-y-4">
            <div>
              <label className="form-label">Current Password</label>
              <input type="password" className="input" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} autoComplete="current-password" />
            </div>
            <div>
              <label className="form-label">New Password</label>
              <input type="password" className="input" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} autoComplete="new-password" />
            </div>
            <div>
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="input" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} autoComplete="new-password" />
            </div>
            {passwordError && (
              <div className="form-alert form-alert-error">
                <AlertCircle className="w-4 h-4" />
                <span>{passwordError}</span>
              </div>
            )}
            <button className="btn btn-primary btn-md w-full" onClick={handlePasswordSave} disabled={savingPassword}>
              {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </button>
          </div>
        </div>
      )}

      {activeTab === 'payments' && isAdmin && (
        <div className="card p-6 max-w-2xl space-y-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">Manual Payment Details</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Shown to clients on invoices so they can send bank transfers / bKash / Nagad payments.
            </p>
          </div>

          {loadingPayments || !paymentForm ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <>
              {paymentForm.bankAccounts.map((acc, i) => (
                <div key={i} className="rounded-xl border border-border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold">Bank Account #{i + 1}</span>
                    <button
                      className="btn btn-ghost btn-sm text-destructive"
                      onClick={() =>
                        setPaymentForm({
                          ...paymentForm,
                          bankAccounts: paymentForm.bankAccounts.filter((_, idx) => idx !== i),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" /> Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input className="input" placeholder="Bank name" value={acc.bankName}
                      onChange={(e) => {
                        const next = [...paymentForm.bankAccounts];
                        next[i] = { ...next[i], bankName: e.target.value };
                        setPaymentForm({ ...paymentForm, bankAccounts: next });
                      }} />
                    <input className="input" placeholder="Account name" value={acc.accountName}
                      onChange={(e) => {
                        const next = [...paymentForm.bankAccounts];
                        next[i] = { ...next[i], accountName: e.target.value };
                        setPaymentForm({ ...paymentForm, bankAccounts: next });
                      }} />
                    <input className="input" placeholder="Account number" value={acc.accountNumber}
                      onChange={(e) => {
                        const next = [...paymentForm.bankAccounts];
                        next[i] = { ...next[i], accountNumber: e.target.value };
                        setPaymentForm({ ...paymentForm, bankAccounts: next });
                      }} />
                    <input className="input" placeholder="Branch" value={acc.branch ?? ''}
                      onChange={(e) => {
                        const next = [...paymentForm.bankAccounts];
                        next[i] = { ...next[i], branch: e.target.value };
                        setPaymentForm({ ...paymentForm, bankAccounts: next });
                      }} />
                    <input className="input" placeholder="Routing number" value={acc.routing ?? ''}
                      onChange={(e) => {
                        const next = [...paymentForm.bankAccounts];
                        next[i] = { ...next[i], routing: e.target.value };
                        setPaymentForm({ ...paymentForm, bankAccounts: next });
                      }} />
                    <input className="input" placeholder="SWIFT / IBAN (optional)" value={acc.swift ?? ''}
                      onChange={(e) => {
                        const next = [...paymentForm.bankAccounts];
                        next[i] = { ...next[i], swift: e.target.value };
                        setPaymentForm({ ...paymentForm, bankAccounts: next });
                      }} />
                  </div>
                </div>
              ))}

              <button
                className="btn btn-outline btn-sm"
                onClick={() =>
                  setPaymentForm({
                    ...paymentForm,
                    bankAccounts: [
                      ...paymentForm.bankAccounts,
                      { bankName: '', accountName: '', accountNumber: '', branch: '', routing: '' },
                    ],
                  })
                }
              >
                <Plus className="h-4 w-4" /> Add Bank Account
              </button>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="form-label">bKash Number</label>
                  <input className="input" placeholder="01XXXXXXXXX" value={paymentForm.bkashNumber ?? ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, bkashNumber: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">bKash Type</label>
                  <select className="input" value={paymentForm.bkashType ?? 'personal'}
                    onChange={(e) => setPaymentForm({ ...paymentForm, bkashType: e.target.value })}>
                    <option value="personal">Personal</option>
                    <option value="agent">Agent</option>
                    <option value="merchant">Merchant</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Nagad Number</label>
                  <input className="input" placeholder="01XXXXXXXXX" value={paymentForm.nagadNumber ?? ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, nagadNumber: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="form-label">Instructions for clients</label>
                <textarea className="input" rows={3} placeholder="e.g. Include your invoice number in the transfer reference…"
                  value={paymentForm.instructions ?? ''}
                  onChange={(e) => setPaymentForm({ ...paymentForm, instructions: e.target.value })} />
              </div>

              <button className="btn btn-primary btn-md" onClick={handleSavePayments}>
                <Save className="mr-2 h-4 w-4" /> Save Payment Settings
              </button>
            </>
          )}
        </div>
      )}

      {activeTab === 'automation' && isAdmin && (
        <div className="card p-6 max-w-2xl space-y-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">Workflow Automation</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Rule engine for lead assignment, project templates and milestone billing.
            </p>
          </div>

          {loadingAutomation || !automationForm ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <>
              {[
                { key: 'autoAssignLeads' as const, label: 'Auto-assign new leads (round-robin)', hint: 'Distribute inbound website leads across your sales team.' },
                { key: 'autoProposalOnConvert' as const, label: 'Auto-draft proposal on lead conversion', hint: 'When a lead converts to a client, create a draft proposal from their requirements.' },
                { key: 'applyProjectTemplate' as const, label: 'Apply project templates & auto-assign team', hint: 'Generate milestones/tasks from templates when a proposal is accepted.' },
                { key: 'milestoneBilling' as const, label: 'Milestone-based billing', hint: 'Auto-generate an invoice each time a milestone is completed.' },
              ].map(({ key, label, hint }) => (
                <label key={key} className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-border p-4">
                  <span>
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="mt-0.5 block text-xs text-neutral-500">{hint}</span>
                  </span>
                  <input
                    type="checkbox"
                    className="mt-1 h-5 w-5 accent-violet-600"
                    checked={Boolean(automationForm[key])}
                    onChange={(e) => setAutomationForm({ ...automationForm, [key]: e.target.checked })}
                  />
                </label>
              ))}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="form-label mb-0">Project Templates</label>
                </div>
                {automationForm.templates.map((tpl, ti) => (
                  <div key={ti} className="mb-3 rounded-xl border border-border p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <input
                        className="input max-w-xs"
                        placeholder="service_key (e.g. web_development)"
                        value={tpl.serviceKey}
                        onChange={(e) => {
                          const next = [...automationForm.templates];
                          next[ti] = { ...next[ti], serviceKey: e.target.value.replace(/\s+/g, '_').toLowerCase() };
                          setAutomationForm({ ...automationForm, templates: next });
                        }}
                      />
                      <button
                        className="btn btn-ghost btn-sm text-destructive"
                        onClick={() =>
                          setAutomationForm({
                            ...automationForm,
                            templates: automationForm.templates.filter((_, i) => i !== ti),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {tpl.milestones.map((ms, mi) => (
                      <div key={mi} className="mb-2 grid grid-cols-[1fr_70px_90px_auto] items-center gap-2">
                        <input className="input" placeholder={`Milestone ${mi + 1} title`} value={ms.title}
                          onChange={(e) => {
                            const next = [...automationForm.templates];
                            next[ti].milestones[mi] = { ...next[ti].milestones[mi], title: e.target.value };
                            setAutomationForm({ ...automationForm, templates: next });
                          }} />
                        <input className="input" type="number" min={0} placeholder="days" value={ms.offsetDays}
                          title="Days after previous milestone"
                          onChange={(e) => {
                            const next = [...automationForm.templates];
                            next[ti].milestones[mi] = { ...next[ti].milestones[mi], offsetDays: Number(e.target.value) };
                            setAutomationForm({ ...automationForm, templates: next });
                          }} />
                        <input className="input" type="number" min={0} placeholder="$ amount" value={ms.amount}
                          title="Invoice amount for this milestone"
                          onChange={(e) => {
                            const next = [...automationForm.templates];
                            next[ti].milestones[mi] = { ...next[ti].milestones[mi], amount: Number(e.target.value) };
                            setAutomationForm({ ...automationForm, templates: next });
                          }} />
                        <button
                          className="btn btn-ghost btn-sm text-destructive"
                          onClick={() => {
                            const next = [...automationForm.templates];
                            next[ti].milestones.splice(mi, 1);
                            setAutomationForm({ ...automationForm, templates: next });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      className="btn btn-outline btn-sm mt-1"
                      onClick={() => {
                        const next = [...automationForm.templates];
                        next[ti].milestones.push({ title: '', offsetDays: 14, amount: 0, tasks: [] });
                        setAutomationForm({ ...automationForm, templates: next });
                      }}
                    >
                      <Plus className="h-3 w-3" /> Add Milestone
                    </button>
                  </div>
                ))}
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() =>
                    setAutomationForm({
                      ...automationForm,
                      templates: [
                        ...automationForm.templates,
                        { serviceKey: 'new_service', milestones: [] },
                      ],
                    })
                  }
                >
                  <Plus className="h-4 w-4" /> Add Template
                </button>
              </div>

              <button className="btn btn-primary btn-md" onClick={handleSaveAutomation}>
                <Save className="mr-2 h-4 w-4" /> Save Automation Rules
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

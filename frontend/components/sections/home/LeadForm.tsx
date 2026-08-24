'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, Plus, X } from 'lucide-react';

const statusOptions = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'converted'];
const priorityOptions = ['low', 'medium', 'high', 'critical'];
const currencyOptions = ['USD', 'BDT', 'EUR', 'GBP'];
const sourceOptions = ['website', 'referral', 'social_media', 'cold_call', 'email_campaign', 'event', 'partner', 'other'];
const websiteQualityOptions = ['poor', 'average', 'good', 'excellent'];

interface LeadFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
  isEdit?: boolean;
}

export default function LeadForm({ initialData, isEdit }: LeadFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [servicesInput, setServicesInput] = useState('');

  const [form, setForm] = useState({
    contactName: initialData?.contactName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    company: initialData?.company || '',
    website: initialData?.website || '',
    industry: initialData?.industry || '',
    country: initialData?.country || '',
    state: initialData?.state || '',
    city: initialData?.city || '',
    facebook: initialData?.facebook || '',
    instagram: initialData?.instagram || '',
    linkedin: initialData?.linkedin || '',
    twitter: initialData?.twitter || '',
    youtube: initialData?.youtube || '',
    whatsapp: initialData?.whatsapp || '',
    source: initialData?.source || '',
    referredBy: initialData?.referredBy || '',
    status: initialData?.status || 'new',
    priority: initialData?.priority || 'medium',
    estimatedDealValue: initialData?.estimatedDealValue || '',
    currency: initialData?.currency || 'USD',
    expectedCloseDate: initialData?.expectedCloseDate?.split('T')[0] || '',
    nextFollowUp: initialData?.nextFollowUp?.split('T')[0] || '',
    meetingSchedule: initialData?.meetingSchedule?.split('T')[0] || '',
    tags: initialData?.tags || [],
    notes: initialData?.notes || '',
    requirements: initialData?.requirements || '',
    interestedServices: initialData?.interestedServices || [],
    leadScore: initialData?.leadScore || '',
    probability: initialData?.probability || '',
    competitors: initialData?.competitors || '',
    decisionMaker: initialData?.decisionMaker ?? false,
    currentWebsite: initialData?.currentWebsite || '',
    websiteQuality: initialData?.websiteQuality || '',
    seoScore: initialData?.seoScore || '',
    socialPresenceScore: initialData?.socialPresenceScore || '',
    potentialRevenue: initialData?.potentialRevenue || '',
    adminNotes: initialData?.adminNotes || '',
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const addTag = () => {
    const trimmed = tagsInput.trim();
    if (trimmed && !form.tags.includes(trimmed)) {
      update('tags', [...form.tags, trimmed]);
      setTagsInput('');
    }
  };

  const removeTag = (tag: string) => update('tags', form.tags.filter((t: string) => t !== tag));

  const addService = () => {
    const trimmed = servicesInput.trim();
    if (trimmed && !form.interestedServices.includes(trimmed)) {
      update('interestedServices', [...form.interestedServices, trimmed]);
      setServicesInput('');
    }
  };

  const removeService = (s: string) => update('interestedServices', form.interestedServices.filter((i: string) => i !== s));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...form,
        estimatedDealValue: form.estimatedDealValue ? Number(form.estimatedDealValue) : undefined,
        potentialRevenue: form.potentialRevenue ? Number(form.potentialRevenue) : undefined,
        leadScore: form.leadScore ? Number(form.leadScore) : undefined,
        probability: form.probability ? Number(form.probability) : undefined,
        seoScore: form.seoScore ? Number(form.seoScore) : undefined,
        socialPresenceScore: form.socialPresenceScore ? Number(form.socialPresenceScore) : undefined,
      };

      if (isEdit && initialData?._id) {
        await api.patch(`/leads/${initialData._id}`, payload);
      } else {
        await api.post('/leads', payload);
      }
      router.push('/dashboard/leads');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save lead');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'input';
  const labelClass = 'form-label text-xs';
  const sectionClass = 'card-dashboard';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="form-alert form-alert-error">{error}</div>}

      <div className={sectionClass}>
        <h2 className="dashboard-section-title">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Full Name *</label>
            <input className={inputClass} value={form.contactName} onChange={(e) => update('contactName', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Email *</label>
            <input className={inputClass} type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input className={inputClass} value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>WhatsApp</label>
            <input className={inputClass} value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Company</label>
            <input className={inputClass} value={form.company} onChange={(e) => update('company', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Industry</label>
            <input className={inputClass} value={form.industry} onChange={(e) => update('industry', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Website</label>
            <input className={inputClass} value={form.website} onChange={(e) => update('website', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Country</label>
            <input className={inputClass} value={form.country} onChange={(e) => update('country', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>State</label>
            <input className={inputClass} value={form.state} onChange={(e) => update('state', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>City</label>
            <input className={inputClass} value={form.city} onChange={(e) => update('city', e.target.value)} />
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className="dashboard-section-title">Social Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['facebook', 'instagram', 'linkedin', 'twitter', 'youtube'].map((platform) => (
            <div key={platform}>
              <label className={labelClass}>{platform.charAt(0).toUpperCase() + platform.slice(1)}</label>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <input className={inputClass} value={(form as any)[platform]} onChange={(e) => update(platform, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className="dashboard-section-title">Lead Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Source</label>
            <select className={inputClass} value={form.source} onChange={(e) => update('source', e.target.value)}>
              <option value="">Select source</option>
              {sourceOptions.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Referred By</label>
            <input className={inputClass} value={form.referredBy} onChange={(e) => update('referredBy', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select className={inputClass} value={form.status} onChange={(e) => update('status', e.target.value)}>
              {statusOptions.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Priority</label>
            <select className={inputClass} value={form.priority} onChange={(e) => update('priority', e.target.value)}>
              {priorityOptions.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Message / Initial Inquiry</label>
            <textarea className={inputClass} rows={3} value={form.notes} onChange={(e) => update('notes', e.target.value)} />
          </div>
        </div>

        <div className="mt-4">
          <label className={labelClass}>Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {form.tags.map((tag: string) => (
              <span key={tag} className="dashboard-tag dashboard-tag-primary">
                {tag} <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input className={inputClass} value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Add tag..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
            <button type="button" onClick={addTag} className="btn btn-primary btn-sm"><Plus className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="mt-4">
          <label className={labelClass}>Interested Services</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {form.interestedServices.map((s: string) => (
              <span key={s} className="dashboard-tag dashboard-tag-primary">
                {s} <button type="button" onClick={() => removeService(s)}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input className={inputClass} value={servicesInput} onChange={(e) => setServicesInput(e.target.value)} placeholder="Add service..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addService(); } }} />
            <button type="button" onClick={addService} className="btn btn-primary btn-sm"><Plus className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className="dashboard-section-title">Deal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Estimated Deal Value</label>
            <input className={inputClass} type="number" value={form.estimatedDealValue} onChange={(e) => update('estimatedDealValue', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Currency</label>
            <select className={inputClass} value={form.currency} onChange={(e) => update('currency', e.target.value)}>
              {currencyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Expected Close Date</label>
            <input className={inputClass} type="date" value={form.expectedCloseDate} onChange={(e) => update('expectedCloseDate', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Next Follow-Up</label>
            <input className={inputClass} type="date" value={form.nextFollowUp} onChange={(e) => update('nextFollowUp', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Meeting Schedule</label>
            <input className={inputClass} type="date" value={form.meetingSchedule} onChange={(e) => update('meetingSchedule', e.target.value)} />
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className="dashboard-section-title">Scoring & Assessment</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Lead Score (0-100)</label>
            <input className={inputClass} type="number" min={0} max={100} value={form.leadScore} onChange={(e) => update('leadScore', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Probability (0-100%)</label>
            <input className={inputClass} type="number" min={0} max={100} value={form.probability} onChange={(e) => update('probability', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>SEO Score (0-100)</label>
            <input className={inputClass} type="number" min={0} max={100} value={form.seoScore} onChange={(e) => update('seoScore', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Social Presence Score (0-100)</label>
            <input className={inputClass} type="number" min={0} max={100} value={form.socialPresenceScore} onChange={(e) => update('socialPresenceScore', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Potential Revenue</label>
            <input className={inputClass} type="number" value={form.potentialRevenue} onChange={(e) => update('potentialRevenue', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Current Website</label>
            <input className={inputClass} value={form.currentWebsite} onChange={(e) => update('currentWebsite', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Website Quality</label>
            <select className={inputClass} value={form.websiteQuality} onChange={(e) => update('websiteQuality', e.target.value)}>
              <option value="">Select</option>
              {websiteQualityOptions.map((w) => <option key={w} value={w}>{w.charAt(0).toUpperCase() + w.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Competitors</label>
            <input className={inputClass} value={form.competitors} onChange={(e) => update('competitors', e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="decisionMaker" checked={form.decisionMaker} onChange={(e) => update('decisionMaker', e.target.checked)} className="checkbox" />
            <label htmlFor="decisionMaker" className="checkbox-label text-sm">Decision Maker</label>
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className="dashboard-section-title">Internal Notes</h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={labelClass}>Notes</label>
            <textarea className={inputClass} rows={3} value={form.notes} onChange={(e) => update('notes', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Requirements</label>
            <textarea className={inputClass} rows={3} value={form.requirements} onChange={(e) => update('requirements', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Admin Notes</label>
            <textarea className={inputClass} rows={3} value={form.adminNotes} onChange={(e) => update('adminNotes', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="btn btn-primary btn-md">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? 'Update Lead' : 'Create Lead'}
        </button>
        <button type="button" onClick={() => router.push('/dashboard/leads')} className="btn btn-outline btn-md">
          Cancel
        </button>
      </div>
    </form>
  );
}

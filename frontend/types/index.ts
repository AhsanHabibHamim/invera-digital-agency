// =============================================
// SHARED TYPES — mirrors backend schemas
// =============================================

export type UserRole = 'super_admin' | 'admin' | 'team' | 'client';

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  roles?: string[];
  phone?: string;
  company?: string;
  avatarUrl?: string;
  nickname?: string;
  designation?: string;
  department?: string;
  skills?: string[];
  experience?: string;
  portfolio?: string;
  github?: string;
  linkedin?: string;
  bio?: string;
  country?: string;
  timezone?: string;
  availability?: string;
  employeeId?: string;
  languages?: string[];
  workingStatus?: string;
  joiningDate?: string;
  twoFAEnabled: boolean;
  isActive: boolean;
  isEmailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface Role {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  _id: string;
  name: string;
  slug: string;
  group: string;
  module: string;
  description?: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RolePermission {
  _id: string;
  roleId: string;
  permissionId: string | Permission;
  createdAt: string;
}

export interface UserRoleDoc {
  _id: string;
  userId: string;
  roleId: string | Role;
  createdAt: string;
}

export interface Lead {
  _id: string;
  leadId: string;
  contactName: string;
  company?: string;
  country?: string;
  state?: string;
  city?: string;
  industry?: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  message?: string;
  serviceInterest?: string;
  source?: string;
  referredBy?: string;
  assignedTo?: string | { _id?: string; name: string; email?: string };
  createdBy?: string;
  status: string;
  priority: string;
  estimatedDealValue?: number;
  currency?: string;
  expectedCloseDate?: string;
  lastContactDate?: string;
  nextFollowUp?: string;
  meetingSchedule?: string;
  tags?: string[];
  notes?: string;
  requirements?: string;
  interestedServices?: string[];
  files?: LeadFile[];
  replies?: LeadReply[];
  communicationHistory?: LeadCommunication[];
  leadScore?: number;
  probability?: number;
  competitors?: string;
  decisionMaker?: boolean;
  currentWebsite?: string;
  websiteQuality?: string;
  seoScore?: number;
  socialPresenceScore?: number;
  potentialRevenue?: number;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadFile {
  fileName: string;
  fileUrl: string;
  uploadedBy: string | { _id?: string; name: string; email?: string };
  createdAt: string;
}

export interface LeadReply {
  message: string;
  repliedBy: string | { _id?: string; name: string; email?: string };
  createdAt: string;
}

export interface LeadCommunication {
  type: 'call' | 'email' | 'meeting' | 'note';
  content: string;
  createdBy: string | { _id?: string; name: string; email?: string };
  createdAt: string;
}

export interface Service {
  _id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  icon?: string;
  pricingTiers?: PricingTier[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PricingTier {
  name: string;
  price: number;
  features: string[];
}

export interface Project {
  _id: string;
  clientId: string | { _id?: string; name: string; email?: string; company?: string };
  title: string;
  description?: string;
  serviceId?: string | { _id?: string; title: string; slug: string };
  assignedTeam?: (string | { _id?: string; name: string; email?: string })[];
  status: 'requested' | 'quoted' | 'in_progress' | 'in_review' | 'completed' | 'closed';
  milestones?: Milestone[];
  progressPercent: number;
  contractAccepted: boolean;
  contractAcceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  _id?: string;
  title: string;
  dueDate: string;
  done: boolean;
  revisionRequested: boolean;
  revisionNotes?: string;
}

export interface Quote {
  _id: string;
  clientId: string | { _id?: string; name: string; email?: string; company?: string };
  projectId?: string | { _id?: string; title: string };
  quoteNumber: string;
  lineItems: LineItem[];
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'expired' | 'converted';
  validUntil?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LineItem {
  description: string;
  qty: number;
  price: number;
}

export interface Invoice {
  _id: string;
  clientId: string | { _id?: string; name: string; email?: string; company?: string };
  projectId?: string | { _id?: string; title: string };
  quoteId?: string | { _id?: string };
  invoiceNumber: string;
  lineItems: InvoiceLineItem[];
  total: number;
  discountCode?: string;
  discountAmount: number;
  tax: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate?: string;
  paidAt?: string;
  paymentMethod?: string;
  paidBy?: string | { _id?: string; name: string; email?: string };
  transactionRef?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  description: string;
  qty: number;
  price: number;
}

export interface Message {
  _id: string;
  projectId: string | { _id?: string; title: string };
  senderId: string | { _id?: string; name: string; email?: string; role?: string; avatarUrl?: string };
  content: string;
  attachments?: string[];
  isRead: boolean;
  replyTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnreadCount {
  projectId: string;
  unread: number;
}

export interface Review {
  _id: string;
  clientId: string | { _id?: string; name: string; email?: string; avatarUrl?: string };
  projectId: string | { _id?: string; title: string };
  rating: number;
  comment: string;
  approved: boolean;
  createdAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface CmsContent {
  _id: string;
  pageKey: string;
  sectionKey: string;
  contentType: 'text' | 'html' | 'json' | 'image';
  content: string | Record<string, unknown>;
  seoMeta?: SeoMeta;
  createdAt: string;
  updatedAt: string;
}

export interface SeoMeta {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  coverImage?: string;
  excerpt?: string;
  body: string;
  tags?: string[];
  published: boolean;
  publishedAt?: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  _id: string;
  userId: string | { _id?: string; name: string; email?: string; role?: string };
  action: string;
  targetType: string;
  targetId?: string;
  details?: string;
  timestamp: string;
}

export interface Proposal {
  _id: string;
  clientId: string | { _id?: string; name: string; email?: string; company?: string };
  title: string;
  description: string;
  serviceCategory?: string;
  budgetRange?: string;
  desiredTimeline?: string;
  attachments?: string[];
  status: 'submitted' | 'under_review' | 'quoted' | 'accepted' | 'declined';
  quoteId?: string | { _id?: string; quoteNumber?: string };
  adminNotes?: string;
  clientResponseNotes?: string;
  declineReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseStudy {
  _id: string;
  title: string;
  slug: string;
  category: string;
  coverImage?: string;
  problem: string;
  solution: string;
  result: string;
  gradient?: string;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicket {
  _id: string;
  ticketNumber: string;
  title: string;
  description: string;
  clientId: string | { _id?: string; name: string; email?: string; company?: string };
  projectId?: string | { _id?: string; title: string };
  assignedTo?: string | { _id?: string; name: string; email?: string };
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_on_client' | 'resolved' | 'closed';
  slaDeadline?: string;
  slaBreached: boolean;
  replies?: TicketReply[];
  tags?: string[];
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketReply {
  _id?: string;
  message: string;
  createdBy: string;
  userId?: string | { _id?: string; name?: string; role?: string };
  isStaffReply?: boolean;
  attachments?: string[];
  createdAt: string;
}

export interface SupportCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  _id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  category: string;
  paidBy: string | { _id?: string; name: string; email?: string };
  projectId?: string | { _id?: string; title: string };
  receiptUrl?: string;
  expenseDate: string;
  isRecurring: boolean;
  recurringInterval?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  _id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  category: string;
  source: string;
  clientId?: string | { _id?: string; name: string; email?: string; company?: string };
  invoiceId?: string | { _id?: string; invoiceNumber: string; total: number };
  projectId?: string | { _id?: string; title: string };
  incomeDate: string;
  isRecurring: boolean;
  recurringInterval?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  _id: string;
  userId: string | { _id?: string; name: string; email?: string };
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'holiday';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Leave {
  _id: string;
  userId: string | { _id?: string; name: string; email?: string };
  leaveType: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'other';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string | { _id?: string; name: string; email?: string };
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication {
  _id: string;
  position: string;
  department: string;
  candidateName: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  coverLetter?: string;
  experience?: string;
  skills?: string[];
  expectedSalary?: string;
  source?: string;
  status: 'new' | 'screening' | 'shortlisted' | 'interview_scheduled' | 'interviewed' | 'offered' | 'hired' | 'rejected';
  interviewDate?: string;
  interviewer?: string | { _id?: string; name: string; email?: string };
  feedback?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesPipeline {
  _id: string;
  name: string;
  stages: PipelineStage[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  _id?: string;
  name: string;
  order: number;
  color?: string;
}

export interface SalesTarget {
  _id: string;
  userId: string | { _id?: string; name: string; email?: string };
  targetAmount: number;
  currency: string;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  achievedAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Commission {
  _id: string;
  userId: string | { _id?: string; name: string; email?: string };
  dealId?: string;
  dealName: string;
  dealValue: number;
  commissionRate: number;
  commissionAmount: number;
  currency: string;
  status: 'pending' | 'approved' | 'paid';
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  projectId: string | { _id?: string; title: string };
  sprintId?: string;
  title: string;
  description?: string;
  type: 'task' | 'bug' | 'issue' | 'feature';
  status: 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string | { _id?: string; name: string; email?: string };
  createdBy: string | { _id?: string; name: string; email?: string };
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
  labels?: string[];
  subtasks?: TaskSubtask[];
  parentTask?: string | { _id?: string; title: string };
  comments: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSubtask {
  title: string;
  done: boolean;
  assignedTo?: string | { _id?: string; name: string; email?: string };
  createdAt: string;
}

export interface Sprint {
  _id: string;
  projectId: string;
  title: string;
  goal?: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  _id: string;
  taskId: string | { _id?: string; title: string };
  userId: string | { _id?: string; name: string; email?: string };
  projectId: string | { _id?: string; title: string };
  description?: string;
  hours: number;
  date: string;
  billable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FileRecord {
  _id: string;
  projectId: string;
  uploadedBy: string | { _id?: string; name: string; email?: string };
  fileUrl: string;
  fileName: string;
  version: number;
  type: string;
  createdAt: string;
}

export interface DashboardStats {
  activeProjects: number;
  totalProjects: number;
  totalRevenue: number;
  outstandingRevenue: number;
  totalLeads: number;
  totalClients: number;
  teamCount: number;
  leadConversion: number;
  projectsByStatus: { _id: string; count: number }[];
  revenueByMonth: { _id: string; total: number }[];
}

export interface TeamWorkload {
  userId: string;
  name: string;
  email: string;
  projectCount: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  items?: T[];
  data?: T[];
  users?: T[];
  leads?: T[];
  projects?: T[];
  tasks?: T[];
  tickets?: T[];
  expenses?: T[];
  incomes?: T[];
  records?: T[];
  logs?: T[];
  notifications?: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface FinancialSummary {
  totalExpenses: number;
  totalIncome: number;
  netProfit: number;
  monthlyExpenses: number;
  monthlyIncome: number;
  monthlyNet: number;
  yearlyExpenses: number;
  yearlyIncome: number;
  yearlyNet: number;
}

export interface TicketStats {
  open: number;
  inProgress: number;
  waiting: number;
  resolved: number;
  closed: number;
  total: number;
}

export interface SalesStats {
  totalTargets: number;
  activeTargets: number;
  pendingCommissions: number;
  approvedCommissions: number;
}

export interface HRStats {
  totalEmployees: number;
  activeLeaves: number;
  pendingLeaves: number;
  newApplications: number;
}

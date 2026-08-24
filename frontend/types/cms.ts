import type { IService } from './service';
import type { IPricingPlan } from './pricing';
import type { IProject } from './portfolio';
import type { ITestimonial } from './testimonials';
import type { IFaqItem } from './faq';
import type { IProcessStep } from './whyChooseUs';

export interface TitleSegment {
  text: string;
  tone?: 'primary' | 'accent' | '';
  break?: boolean;
}

export interface CtaButton {
  label: string;
  href: string;
  action?: 'start' | 'navigate';
}

export interface PageSeo {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
}

export interface PageBanner {
  eyebrow?: string;
  title?: TitleSegment[];
  description?: string;
}

export interface HeroStat {
  value: number;
  suffix: string;
  label: string;
}

export interface HeroContent {
  eyebrow?: string;
  title?: TitleSegment[];
  subheadline?: string;
  primaryButton?: CtaButton;
  secondaryButton?: CtaButton;
  stats: HeroStat[];
}

export interface LogosContent {
  label?: string;
  logos: string[];
}

export interface ServicesContent {
  eyebrow?: string;
  title?: TitleSegment[];
  services: IService[];
}

export interface WhyChooseUsContent {
  eyebrow?: string;
  title?: TitleSegment[];
  paragraph?: string;
  processSteps: IProcessStep[];
}

export interface PortfolioContent {
  eyebrow?: string;
  title?: TitleSegment[];
  categories: string[];
  projects: IProject[];
}

export interface TestimonialsContent {
  eyebrow?: string;
  title?: TitleSegment[];
  testimonials: ITestimonial[];
}

export interface PricingContent {
  eyebrow?: string;
  title?: TitleSegment[];
  plans: IPricingPlan[];
}

export interface FaqContent {
  eyebrow?: string;
  title?: TitleSegment[];
  description?: string;
  items: IFaqItem[];
}

export interface FinalCtaContent {
  eyebrow?: string;
  title?: TitleSegment[];
  description?: string;
  primaryButton?: CtaButton;
  secondaryButton?: CtaButton;
}

export interface HomeContent {
  hero?: HeroContent;
  logos?: LogosContent;
  services?: ServicesContent;
  whyChooseUs?: WhyChooseUsContent;
  portfolio?: PortfolioContent;
  testimonials?: TestimonialsContent;
  pricing?: PricingContent;
  faq?: FaqContent;
  finalCta?: FinalCtaContent;
  seo?: PageSeo;
}

export interface FooterBrand {
  companyName: string;
  tagline: string;
  description: string;
  logo: string;
}

export interface FooterCta {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonAction?: 'start' | 'navigate';
}

export interface FooterNewsletter {
  title: string;
  description: string;
  placeholder: string;
  buttonText: string;
  successMessage?: string;
}

export interface FooterLinkItem {
  label: string;
  href: string;
}

export interface FooterLinkColumn {
  title: string;
  links: FooterLinkItem[];
}

export interface FooterLinks {
  columns: FooterLinkColumn[];
}

export interface FooterContact {
  email: string;
  phone: string;
  address: string;
  hours: string;
}

export interface FooterSocial {
  links: FooterLinkItem[];
}

export interface FooterStat {
  value: number;
  suffix: string;
  label: string;
}

export interface FooterStats {
  items: FooterStat[];
}

export interface FooterBadge {
  label: string;
  icon: string;
}

export interface FooterBadges {
  items: FooterBadge[];
}

export interface FooterLegal {
  copyright: string;
  privacyLabel: string;
  privacyHref: string;
  termsLabel: string;
  termsHref: string;
  cookiesLabel: string;
  cookiesHref: string;
}

export interface FooterContent {
  brand?: FooterBrand;
  cta?: FooterCta;
  newsletter?: FooterNewsletter;
  links?: FooterLinks;
  contact?: FooterContact;
  social?: FooterSocial;
  stats?: FooterStats;
  badges?: FooterBadges;
  legal?: FooterLegal;
  seo?: PageSeo;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface NavContent {
  items?: NavItem[];
  cta?: CtaButton;
  seo?: PageSeo;
}

export interface ContactInfoItem {
  icon: string;
  label: string;
  value: string;
  href?: string;
}

export interface ContactInfoContent {
  info?: ContactInfoItem[];
  preferAsyncText?: string;
}

export interface ContactFormField {
  name: string;
  label: string;
  placeholder?: string;
  type: 'text' | 'email' | 'select' | 'textarea';
  required?: boolean;
}

export interface ContactFormContent {
  title: string;
  successMessage?: string;
  noteText?: string;
  budgetLabel?: string;
  budgetPlaceholder?: string;
  submitLabel?: string;
  sendingLabel?: string;
  fields?: ContactFormField[];
}

export interface ContactContent {
  page?: PageBanner;
  contactInfo?: ContactInfoContent;
  form?: ContactFormContent;
  seo?: PageSeo;
}

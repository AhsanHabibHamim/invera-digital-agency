export interface IService {
  number: string;
  title: string;
  desc: string;
  tags: string[];
}
export interface ServicePage {
  id: number;
  slug: string;

  number: string;

  title: string;

  shortDescription: string;

  description: string;

  icon: string;

  featured?: boolean;

  tags: string[];
}

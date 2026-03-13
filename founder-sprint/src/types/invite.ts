export interface FounderOption {
  id: string;
  name: string | null;
  email: string;
  profileImage: string | null;
  companyName: string | null;
}

export interface MentorOption {
  id: string;
  name: string | null;
  email: string;
  profileImage: string | null;
}

export interface CompanyOption {
  id: string;
  name: string;
  memberCount: number;
}

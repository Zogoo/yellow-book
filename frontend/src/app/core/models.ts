/** Shared wire types for the Yellow Book API (`/api/v1`). */

export interface ApiMeta {
  page: number;
  limit: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  perPage?: number;
}

export interface ApiEnvelope<T> {
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorBody {
  message: string;
  error: string;
  statusCode: number;
  requestId?: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  status?: string;
  permissions?: string[];
  adminRole?: string | null;
  isAgent?: boolean;
  companyId?: number | null;
  signupMethod?: string;
  email_verified_at?: string | null;
  [key: string]: unknown;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface CategoryFilterGroup {
  label: string;
  options: string[];
}

export interface CategoryDefinition {
  id?: number;
  name: string;
  slug?: string;
  icon: string;
  color: string;
  filters: {
    serviceTypes?: CategoryFilterGroup;
    specializations?: CategoryFilterGroup;
    emergencyService?: boolean;
  };
}

export interface Listing {
  id: number;
  name: string;
  title?: string;
  slug: string;
  category: string;
  rating: number;
  ratingCount: number;
  website?: string | null;
  location?: string | null;
  revenue?: string | null;
  comments?: number;
  serviceType?: string | null;
  specialization?: string | null;
  emergencyService?: boolean;
  price?: number | null;
  image?: string | null;
  description?: string | null;
}

export interface CompanyRecord {
  id: number;
  ownerUserId?: number;
  categoryId?: number | null;
  category?: string;
  name: string;
  slug: string;
  website?: string | null;
  email?: string | null;
  mobile?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
  phoneNumber?: string | null;
  status: string;
  verified: boolean;
  location?: string | null;
  revenue?: string | null;
  employees?: string | null;
  industry?: string | null;
  description?: string | null;
  tagline?: string | null;
  image?: string | null;
  price?: number | null;
  serviceType?: string | null;
  specialization?: string | null;
  emergencyService?: boolean | null;
  ownerName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  jobTitle?: string | null;
  rating?: number;
  ratingCount?: number;
  createdAt?: string;
  date?: string;
  [key: string]: unknown;
}

export interface CompanyResponse {
  name?: string;
  title?: string;
  text: string;
  date?: string;
  time?: string;
  avatar?: string | null;
}

export interface ReviewRecord {
  id: number;
  reviewerName: string;
  reviewerEmail?: string | null;
  content: string;
  rating: number;
  date: string;
  time?: string;
  likes: number;
  shares: number;
  dislikes: number;
  status: string;
  companyName?: string;
  companyId: number;
  companyResponse?: CompanyResponse | null;
  companyResponseStatus?: string | null;
  companyResponseSubmittedAt?: string | null;
  companyResponseModeratedAt?: string | null;
  avatar?: string | null;
  createdAt?: string;
  [key: string]: unknown;
}

export interface NotificationRecord {
  id: number;
  title: string;
  message: string;
  time?: string;
  timeLabel?: string | null;
  icon?: string | null;
  iconColor?: string | null;
  bgColor?: string | null;
  unread: boolean;
}

export interface FavoriteRecord {
  id: number;
  name: string;
  slug: string;
  listingId: number;
  category?: string;
  rating?: number;
  savedAt?: string;
  assigned?: string;
  userId?: number;
}

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  signupMethod?: string;
  signupDate?: string;
  status: string;
  verified: boolean;
  role?: string;
  companyId?: number | null;
  createdAt?: string;
}

export interface AdminRecord {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  verified: boolean;
  isAgent?: boolean;
  adminRole?: string;
  permissions: string[];
  createdOn?: string | null;
  lastLogin?: string | null;
  createdAt?: string;
}

export interface AssignmentRecord {
  id: number;
  companyId: number;
  name: string;
  category?: string;
  status: string;
  mobile?: string | null;
  email?: string | null;
  address?: string | null;
  website?: string | null;
  primaryContact?: string | null;
  assignedDate?: string | null;
}

export interface AdminStats {
  welcomeName?: string;
  registeredCompanies: number;
  pendingVerifications: number;
  rejectedVerifications: number;
  totalReviews: number;
  pendingReviews: number;
  adminUsers: number;
  averageRating?: number;
}

export interface AgencyDashboard {
  totalReviews: number;
  averageRating: number;
  verificationStatus: string;
  profileComplete: boolean;
  monthlyReviewTrend: { month: string; count: number }[];
}

export interface CompanyProfile {
  fullName: string;
  phoneNumber: string;
  email: string;
  location: string;
  about: string;
  avatar: string;
  preferences: { emailNotifications?: boolean; pushNotifications?: boolean };
  security: { lastPasswordChange?: string };
  updatedAt?: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  company: string;
  location: string;
  timeZone: string;
  bio: string;
  avatar: string;
  security: { lastPasswordChange?: string; profileUpdatedAt?: string };
  updatedAt?: string;
}

export interface SubadminProfile {
  fullName: string;
  email: string;
  mobile: string;
  phone: string;
  role: string;
  location: string;
  timezone: string;
  bio: string;
  preferences: { notifications?: boolean; weeklyDigest?: boolean };
  security: { lastPasswordChange?: string };
  updatedAt?: string;
}

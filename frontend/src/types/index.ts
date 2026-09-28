export type Role = 'STUDENT' | 'TECHNICIAN' | 'ADMIN';

export type Category =
  | 'IT_NETWORK'
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'CLEANING'
  | 'HOSTEL'
  | 'CLASSROOM'
  | 'LABORATORY'
  | 'LIBRARY'
  | 'SECURITY'
  | 'TRANSPORT'
  | 'CANTEEN'
  | 'INFRASTRUCTURE'
  | 'OTHER';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type Status =
  | 'SUBMITTED'
  | 'AI_ANALYZING'
  | 'AI_REVIEW_REQUIRED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REOPENED'
  | 'CLOSED'
  | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  departmentId?: string | null;
  department?: Department | null;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  _count?: {
    users?: number;
    complaints?: number;
  };
}

export interface AIPrediction {
  id: string;
  predictedCategory: Category;
  predictedPriority: Priority;
  predictedDepartment?: string | null;
  confidence: number;
  modelVersion: string;
  predictionIndicators?: string | null; // JSON string
  status: string;
  createdAt: string;
}

export interface StatusHistory {
  id: string;
  complaintId: string;
  oldStatus?: Status | null;
  newStatus: Status;
  reason?: string | null;
  createdAt: string;
  changedBy?: {
    id: string;
    name: string;
    role: Role;
  } | null;
}

export interface Assignment {
  id: string;
  complaintId: string;
  technicianId: string;
  assignedById?: string | null;
  status: string;
  notes?: string | null;
  assignedAt: string;
  technician?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ComplaintComment {
  id: string;
  complaintId: string;
  authorId: string;
  comment: string;
  isInternal: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string;
    role: Role;
  };
}

export interface Complaint {
  id: string;
  complaintNumber: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  location: string;
  status: Status;
  aiConfidence?: number | null;
  createdById: string;
  departmentId?: string | null;
  assignedTechnicianId?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  department?: Department | null;
  assignedTechnician?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  } | null;
  statusHistory?: StatusHistory[];
  aiPredictions?: AIPrediction[];
  assignments?: Assignment[];
  comments?: ComplaintComment[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  entityId?: string | null;
  createdAt: string;
}

export interface AnalyticsOverview {
  total: number;
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  closedCount: number;
  criticalCount: number;
  reopenedCount: number;
  pendingAiReview: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

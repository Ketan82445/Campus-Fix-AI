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
  building?: string | null;
  floor?: string | null;
  room?: string | null;
  language?: string | null;
  status: Status;
  aiConfidence?: number | null;
  createdById: string;
  departmentId?: string | null;
  assignedTechnicianId?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
  responseDeadline?: string | null;
  resolutionDeadline?: string | null;
  respondedAt?: string | null;
  slaBreached?: boolean;
  escalationLevel?: number;
  escalatedAt?: string | null;
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
  attachments?: ComplaintAttachment[];
  feedback?: ComplaintFeedback | null;
  workOrder?: WorkOrder | null;
  upvoteCount?: number;
  hasUpvoted?: boolean;
  duplicateOfId?: string | null;
  duplicateOf?: {
    id: string;
    complaintNumber: string;
    title: string;
    status?: Status;
  } | null;
  duplicates?: Array<{
    id: string;
    complaintNumber: string;
    title: string;
    status: Status;
    createdAt: string;
  }>;
  _count?: {
    upvotes?: number;
    comments?: number;
    attachments?: number;
  };
}

export interface SimilarComplaint {
  id: string;
  complaintNumber: string;
  title: string;
  description: string;
  category: Category;
  location: string;
  building?: string | null;
  floor?: string | null;
  room?: string | null;
  status: Status;
  createdAt: string;
  similarityScore: number;
  matchReasons: string[];
  upvoteCount: number;
  hasUpvoted: boolean;
}

export interface ComplaintAttachment {
  id: string;
  complaintId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
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

export interface SLAStats {
  totalOpenWithSLA: number;
  breachedTotal: number;
  atRiskCount: number;
  complianceRate: number;
  byPriority: Array<{
    priority: Priority;
    total: number;
    breached: number;
    atRisk: number;
    complianceRate: number;
  }>;
}

export interface SLAConfig {
  id: string;
  priority: Priority;
  responseHours: number;
  resolutionHours: number;
}


export interface ComplaintFeedback {
  id: string;
  complaintId: string;
  studentId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  student?: {
    id: string;
    name: string;
  };
}

export interface TechnicianPerformance {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}


export enum IncidentSeverity {
  MINOR = 'MINOR',
  MAJOR = 'MAJOR',
  CRITICAL = 'CRITICAL'
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: Category;
  severity: IncidentSeverity;
  status: Status;
  location?: string;
  createdAt: string;
  resolvedAt?: string;
  complaints?: Complaint[];
  _count?: {
    complaints: number;
  };
}


export type WorkOrderStatus = 'CREATED' | 'ASSIGNED' | 'SCHEDULED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'WAITING_FOR_PARTS' | 'WAITING_FOR_APPROVAL' | 'RESOLVED' | 'VERIFIED' | 'CLOSED' | 'CANCELLED';

export interface WorkOrderPart {
  id: string;
  workOrderId: string;
  name: string;
  quantity: number;
  cost?: number;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  category?: string;
  createdAt: string;
}

export interface WorkOrder {
  id: string;
  workOrderNumber: string;
  complaintId: string;
  technicianId: string;
  status: WorkOrderStatus;
  description: string;
  priority: Priority;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  notes?: string;
  checklist?: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
  
  complaint?: {
    id: string;
    complaintNumber: string;
    title: string;
    location: string;
  };
  technician?: {
    id: string;
    name: string;
  };
  parts?: WorkOrderPart[];
  attachments?: Attachment[];
}

export interface WorkOrderMetrics {
  total: number;
  active: number;
  inProgress: number;
  waitingParts: number;
  resolved: number;
  closed: number;
}


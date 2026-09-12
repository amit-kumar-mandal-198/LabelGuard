export type UserRole = 'vendor' | 'inspector' | 'controller' | 'admin' | 'auditor';

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  designation: string;
  department?: string;
  district?: string;
  state?: string;
  companyName?: string;
  gstNumber?: string;
  lutNumber?: string;
}

export type SeverityLevel = 'minor' | 'major' | 'critical';
export type ComplianceStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'REVIEW' | 'PENDING';

export interface BoundingBox {
  ymin: number; // 0-100 percentage
  xmin: number; // 0-100 percentage
  ymax: number;
  xmax: number;
  label: string;
  status: 'pass' | 'fail' | 'review';
  field_name: string;
}

export interface DeclarationField {
  fieldName: string;
  label: string;
  value: string | null;
  rawValue?: string | null;
  confidence: number;
  status: 'extracted' | 'review' | 'not_found';
  ruleCode: string;
  bbox?: BoundingBox;
}

export interface ViolationItem {
  id: string;
  ruleCode: string;
  ruleTitle: string;
  legalCitation: string;
  fieldName: string;
  severity: SeverityLevel;
  status: 'open' | 'review' | 'resolved';
  message: string;
  detectedValue: string | null;
  expectedValue: string | null;
  confidence?: number;
  fixSuggestion: string;
  bbox?: BoundingBox;
}

export interface InspectionRecord {
  id: number | string;
  productName: string;
  brand: string;
  sku: string;
  category: string;
  barcode?: string;
  declaredMrp: number;
  netQuantity: string;
  mfgMonthYear: string;
  storeName?: string;
  location?: string;
  gpsCoords?: { lat: number; lng: number };
  status: ComplianceStatus;
  complianceScore: number; // 0 to 100
  createdAt: string;
  imageUrl: string;
  declarations: DeclarationField[];
  violations: ViolationItem[];
  tamperDetected: boolean;
  tamperReason?: string;
  noticeStatus?: 'none' | 'draft' | 'approved' | 'issued';
  noticeId?: string;
  scanSource: 'vendor_self_audit' | 'field_inspector' | 'ecomm_listing';
}

export interface CodifiedRule {
  id: number;
  ruleCode: string;
  ruleNumber: string;
  title: string;
  requirement: string;
  severity: SeverityLevel;
  version: number;
  effectiveFrom: string;
  status: 'active' | 'draft' | 'superseded';
  jurisdiction: string;
  checksCount: number;
}

export interface Section36Notice {
  id: string;
  noticeNumber: string;
  inspectionId: number | string;
  productName: string;
  brand: string;
  companyName: string;
  companyAddress: string;
  gstNumber?: string;
  violations: {
    rule: string;
    section: string;
    description: string;
    severity: SeverityLevel;
  }[];
  draftedAt: string;
  status: 'draft' | 'approved' | 'issued' | 'rejected';
  issuingOfficer: string;
  designation: string;
  digitalSignatureHash: string;
  penaltyClause: string;
  responseDeadlineDays: number;
}

export interface ComplianceCertificate {
  certificateNumber: string;
  productName: string;
  brand: string;
  sku: string;
  manufacturer: string;
  gstin: string;
  complianceScore: number;
  evaluatedRules: string[];
  issuedAt: string;
  validUntil: string;
  qrVerificationCode: string;
  authority: string;
  status: 'VALID' | 'REVOKED';
}

export interface RepeatOffender {
  brand: string;
  companyName: string;
  totalScans: number;
  violationCount: number;
  criticalCount: number;
  riskScore: number; // 0 - 100
  topViolationRule: string;
  lastViolationDate: string;
  priorityQueueStatus: 'active' | 'assigned' | 'resolved';
}

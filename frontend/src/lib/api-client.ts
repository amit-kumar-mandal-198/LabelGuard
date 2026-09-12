import {
  InspectionRecord,
  CodifiedRule,
  Section36Notice,
  ComplianceCertificate,
  RepeatOffender,
  UserRole,
} from './types';
import {
  SAMPLE_INSPECTIONS,
  SAMPLE_RULES,
  SAMPLE_NOTICES,
  SAMPLE_REPEAT_OFFENDERS,
  SAMPLE_CERTIFICATE,
} from './sample-data';

const getApiBase = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const protocol = window.location.protocol || 'http:';
    const host = window.location.hostname;
    return `${protocol}//${host}:8000/api/v1`;
  }
  return 'http://localhost:8000/api/v1';
};

export class ApiClient {
  private static isBackendAvailable: boolean | null = null;

  static async checkBackend(): Promise<boolean> {
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/health`, { method: 'GET', signal: AbortSignal.timeout(1500) });
      this.isBackendAvailable = res.ok;
      return res.ok;
    } catch {
      this.isBackendAvailable = false;
      return false;
    }
  }

  static getInspections(): InspectionRecord[] {
    return SAMPLE_INSPECTIONS;
  }

  static getInspectionById(id: string | number): InspectionRecord | undefined {
    return SAMPLE_INSPECTIONS.find((item) => String(item.id) === String(id)) || SAMPLE_INSPECTIONS[0];
  }

  static getRules(): CodifiedRule[] {
    return SAMPLE_RULES;
  }

  static getNotices(): Section36Notice[] {
    return SAMPLE_NOTICES;
  }

  static getRepeatOffenders(): RepeatOffender[] {
    return SAMPLE_REPEAT_OFFENDERS;
  }

  static getCertificate(sku?: string): ComplianceCertificate {
    return SAMPLE_CERTIFICATE;
  }

  static updateNoticeStatus(noticeId: string, status: 'approved' | 'issued' | 'rejected'): boolean {
    const notice = SAMPLE_NOTICES.find((n) => n.id === noticeId);
    if (notice) {
      notice.status = status;
      return true;
    }
    return false;
  }

  static simulateAudit(payload: {
    productName: string;
    brand: string;
    sku: string;
    declaredMrp: number;
    category: string;
    file?: File | null;
  }): Promise<InspectionRecord> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // If name has "biscuit" or "digestive", return compliant sample
        if (payload.productName.toLowerCase().includes('biscuit') || payload.productName.toLowerCase().includes('digestive')) {
          resolve({
            ...SAMPLE_INSPECTIONS[0],
            productName: payload.productName,
            brand: payload.brand,
            sku: payload.sku || 'SKU-NEW-01',
            declaredMrp: payload.declaredMrp || 145,
          });
        } else if (payload.productName.toLowerCase().includes('chip') || payload.productName.toLowerCase().includes('tamper')) {
          // Return tampered MRP sample
          resolve({
            ...SAMPLE_INSPECTIONS[2],
            productName: payload.productName,
            brand: payload.brand,
            sku: payload.sku || 'SKU-NEW-02',
            declaredMrp: payload.declaredMrp || 50,
          });
        } else {
          // Return font height violation sample
          resolve({
            ...SAMPLE_INSPECTIONS[1],
            productName: payload.productName,
            brand: payload.brand,
            sku: payload.sku || 'SKU-NEW-03',
            declaredMrp: payload.declaredMrp || 180,
          });
        }
      }, 1000);
    });
  }
}

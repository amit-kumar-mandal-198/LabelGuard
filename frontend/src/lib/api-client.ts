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

export const getApiBase = (): string => {
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

const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('labelguard_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export class ApiClient {
  private static isBackendAvailable: boolean | null = null;
  private static cachedInspections: InspectionRecord[] = SAMPLE_INSPECTIONS;
  private static cachedRules: CodifiedRule[] = SAMPLE_RULES;
  private static cachedNotices: Section36Notice[] = SAMPLE_NOTICES;
  private static cachedOffenders: RepeatOffender[] = SAMPLE_REPEAT_OFFENDERS;

  static async checkBackend(): Promise<boolean> {
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/health`, { method: 'GET', signal: AbortSignal.timeout(2000) });
      this.isBackendAvailable = res.ok;
      return res.ok;
    } catch {
      this.isBackendAvailable = false;
      return false;
    }
  }

  static getInspections(): InspectionRecord[] {
    return this.cachedInspections;
  }

  static async fetchInspections(): Promise<InspectionRecord[]> {
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/inspections/dossiers`, {
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          this.cachedInspections = data;
          return data;
        }
      }
    } catch (e) {
      console.warn('Could not fetch live inspections from backend, using cache:', e);
    }
    return this.cachedInspections;
  }

  static getInspectionById(id: string | number): InspectionRecord | undefined {
    return this.cachedInspections.find((item) => String(item.id) === String(id)) || this.cachedInspections[0];
  }

  static async fetchInspectionById(id: string | number): Promise<InspectionRecord | undefined> {
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/inspections/details/${id}`, {
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.id) {
          const idx = this.cachedInspections.findIndex((item) => String(item.id) === String(id));
          if (idx >= 0) {
            this.cachedInspections[idx] = data;
          } else {
            this.cachedInspections.unshift(data);
          }
          return data;
        }
      }
    } catch (e) {
      console.warn('Could not fetch inspection details from backend:', e);
    }
    return this.getInspectionById(id);
  }

  static getRules(): CodifiedRule[] {
    return this.cachedRules;
  }

  static async fetchRules(): Promise<CodifiedRule[]> {
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/compliance/rules`, {
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          this.cachedRules = data;
          return data;
        }
      }
    } catch (e) {
      console.warn('Could not fetch rules from backend:', e);
    }
    return this.cachedRules;
  }

  static getNotices(): Section36Notice[] {
    return this.cachedNotices;
  }

  static async fetchNotices(): Promise<Section36Notice[]> {
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/compliance/notices`, {
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          this.cachedNotices = data;
          return data;
        }
      }
    } catch (e) {
      console.warn('Could not fetch notices from backend:', e);
    }
    return this.cachedNotices;
  }

  static getRepeatOffenders(): RepeatOffender[] {
    return this.cachedOffenders;
  }

  static async fetchRepeatOffenders(): Promise<RepeatOffender[]> {
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/compliance/repeat-offenders`, {
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          this.cachedOffenders = data;
          return data;
        }
      }
    } catch (e) {
      console.warn('Could not fetch repeat offenders from backend:', e);
    }
    return this.cachedOffenders;
  }

  static getCertificate(sku?: string): ComplianceCertificate {
    return SAMPLE_CERTIFICATE;
  }

  static updateNoticeStatus(noticeId: string, status: 'approved' | 'issued' | 'rejected'): boolean {
    const notice = this.cachedNotices.find((n) => n.id === noticeId);
    if (notice) {
      notice.status = status;
    }
    // Async fire-and-forget update to backend
    const apiBase = getApiBase();
    fetch(`${apiBase}/compliance/notices/${noticeId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ status }),
    }).catch((e) => console.warn('Backend notice status sync error:', e));

    return true;
  }

  static async quickScan(payload: {
    file: File | Blob;
    productName?: string;
    brand?: string;
    category?: string;
    sku?: string;
    declaredMrp?: number;
    scanSource?: 'field_inspector' | 'vendor_self_audit';
  }): Promise<InspectionRecord> {
    const apiBase = getApiBase();
    const formData = new FormData();
    formData.append('file', payload.file, (payload.file as File).name || 'scan.png');
    formData.append('product_name', payload.productName || 'Packaged Commodity');
    formData.append('brand', payload.brand || 'Brand');
    formData.append('category', payload.category || 'Packaged Food');
    formData.append('sku', payload.sku || '');
    formData.append('declared_mrp', String(payload.declaredMrp || 0));
    formData.append('scan_source', payload.scanSource || 'field_inspector');

    try {
      const res = await fetch(`${apiBase}/inspections/quick-scan`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        this.cachedInspections.unshift(data);
        return data;
      }
    } catch (e) {
      console.warn('Quick-scan failed on backend, using fallback:', e);
    }

    // Fallback simulation if backend offline
    return this.simulateAudit({
      productName: payload.productName || 'Packaged Commodity',
      brand: payload.brand || 'Brand',
      sku: payload.sku || 'SKU-NEW-01',
      declaredMrp: payload.declaredMrp || 145,
      category: payload.category || 'Packaged Food',
      file: payload.file instanceof File ? payload.file : null,
    });
  }

  static async simulateAudit(payload: {
    productName: string;
    brand: string;
    sku: string;
    declaredMrp: number;
    category: string;
    file?: File | null;
  }): Promise<InspectionRecord> {
    // If a file is uploaded, try real quick-scan first
    if (payload.file) {
      try {
        return await this.quickScan({
          file: payload.file,
          productName: payload.productName,
          brand: payload.brand,
          category: payload.category,
          sku: payload.sku,
          declaredMrp: payload.declaredMrp,
          scanSource: 'vendor_self_audit',
        });
      } catch (e) {
        console.warn('Falling back to local simulated audit:', e);
      }
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        let record: InspectionRecord;
        if (payload.productName.toLowerCase().includes('biscuit') || payload.productName.toLowerCase().includes('digestive')) {
          record = {
            ...SAMPLE_INSPECTIONS[0],
            id: `INSP-2026-${Date.now().toString().slice(-4)}`,
            productName: payload.productName,
            brand: payload.brand,
            sku: payload.sku || 'SKU-NEW-01',
            declaredMrp: payload.declaredMrp || 145,
          };
        } else if (payload.productName.toLowerCase().includes('chip') || payload.productName.toLowerCase().includes('tamper')) {
          record = {
            ...SAMPLE_INSPECTIONS[2],
            id: `INSP-2026-${Date.now().toString().slice(-4)}`,
            productName: payload.productName,
            brand: payload.brand,
            sku: payload.sku || 'SKU-NEW-02',
            declaredMrp: payload.declaredMrp || 50,
          };
        } else {
          record = {
            ...SAMPLE_INSPECTIONS[1],
            id: `INSP-2026-${Date.now().toString().slice(-4)}`,
            productName: payload.productName,
            brand: payload.brand,
            sku: payload.sku || 'SKU-NEW-03',
            declaredMrp: payload.declaredMrp || 180,
          };
        }
        this.cachedInspections.unshift(record);
        resolve(record);
      }, 800);
    });
  }
}

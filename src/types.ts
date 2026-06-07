export interface Client {
  id: string;
  name: string;
  username: string;
  phone: string;
  email: string;
  profileId: string;
  ipAddress: string;
  macAddress: string;
  type: "PPPoE" | "Hotspot";
  status: "active" | "suspended" | "expired";
  balance: number;
  createdAt: string;
}

export interface BandwidthProfile {
  id: string;
  name: string;
  rateLimit: string;
  price: number;
  mode: "PPPoE" | "Hotspot";
  sharedUsers: number;
  description: string;
}

export interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  profileName: string;
  billingMonth: string;
  amount: number;
  status: "unpaid" | "paid" | "overdue";
  dueDate: string;
  paymentDate?: string;
  waSentStatus: "idle" | "sent" | "failed";
  waSentTime?: string;
}

export interface VoucherBatch {
  id: string;
  name: string;
  profileId: string;
  profileName: string;
  price: number;
  quantity: number;
  durationHours: number;
  codes: {
    code: string;
    status: "unused" | "active" | "expired";
    usedBy?: string;
  }[];
  createdAt: string;
}

export interface RouterConfig {
  host: string;
  port: number;
  username: string;
  status: "connected" | "disconnected" | "error";
  model: string;
  uptime: string;
  cpuLoad: number;
  activePppoe: number;
  activeHotspot: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "success" | "danger";
  category: "billing" | "router" | "client" | "voucher" | "auth" | "wa";
  message: string;
  operator: string;
}

export interface BandwidthPoint {
  time: string;
  pppoeRx: number;
  pppoeTx: number;
  hotspotRx: number;
  hotspotTx: number;
}

export interface DashboardSummary {
  clients: {
    total: number;
    active: number;
    suspended: number;
    pppoe: number;
    hotspot: number;
  };
  revenue: {
    paidThisMonth: number;
    outstandingBilling: number;
    currency: string;
  };
  router: RouterConfig;
  bandwidthChart: BandwidthPoint[];
  revenueTrends?: {
    month: string;
    paid: number;
    unpaid: number;
    total: number;
  }[];
  popularProfiles?: {
    id: string;
    name: string;
    count: number;
    mode: string;
  }[];
}

export type LanguageType = "id" | "en";

export interface SystemConfig {
  template: string;
  is2FAEnabled: boolean;
  secret2FA: string;
  language: LanguageType;
}

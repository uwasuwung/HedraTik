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

export interface Ticket {
  id: string;
  clientId: string;
  clientName: string;
  category: "Internet Mati" | "Koneksi Lambat" | "Perangkat Rusak" | "Lainnya";
  description: string;
  status: "open" | "progress" | "resolved" | "closed";
  createdAt: string;
  technicianId?: string;
  technicianName?: string;
  resolutionNote?: string;
}

export interface Technician {
  id: string;
  name: string;
  phone: string;
  status: "idle" | "working" | "standby";
  avatar: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: "Router" | "ONU" | "OLT" | "Switch" | "Kabel FO" | "Tiang" | "Aksesori";
  stock: number;
  minStock: number;
  unit: string;
  lastUpdated: string;
}

export interface FinancialRecord {
  id: string;
  date: string;
  type: "income" | "expense";
  category: "Subscription" | "Instalasi Baru" | "Penjualan Perangkat" | "Bandwidth ISP" | "Gaji Teknisi" | "Listrik & Listrik" | "Maintenance";
  amount: number;
  description: string;
  branch: string;
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

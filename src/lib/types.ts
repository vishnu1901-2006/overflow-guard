export type BinStatus = "ok" | "warning" | "full" | "assigned";
export type AlertStatus = "open" | "dispatched" | "resolved";
export type JobStatus = "assigned" | "completed";
export type WorkerStatus = "available" | "en_route";

export type Society = {
  id: string;
  name: string;
  area: string;
  binCount: number;
};

export type Bin = {
  id: string;
  societyId: string;
  location: string;
  fillLevel: number;
  status: BinStatus;
  lastUpdated: string;
};

export type Worker = {
  id: string;
  name: string;
  phone: string;
  status: WorkerStatus;
  assignedBinId: string | null;
  assignedSocietyId: string | null;
};

export type Alert = {
  id: string;
  binId: string;
  societyId: string;
  message: string;
  status: AlertStatus;
  workerId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Job = {
  id: string;
  alertId: string;
  binId: string;
  societyId: string;
  workerId: string;
  status: JobStatus;
  instruction: string;
  createdAt: string;
  completedAt: string | null;
};

export type AppEvent =
  | { type: "snapshot"; at: string }
  | { type: "bin.full"; binId: string; alertId: string; message: string }
  | { type: "dispatch"; alertId: string; workerId: string; binId: string }
  | { type: "emptied"; binId: string; jobId: string }
  | { type: "bin.updated"; binId: string };

export type AppState = {
  societies: Society[];
  bins: Bin[];
  workers: Worker[];
  alerts: Alert[];
  jobs: Job[];
  stats: {
    totalBins: number;
    fullBins: number;
    openAlerts: number;
    workersAvailable: number;
  };
};

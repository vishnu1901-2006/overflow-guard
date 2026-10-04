import { eventBus } from "@/lib/events";
import type {
  Alert,
  AppState,
  Bin,
  Job,
  Society,
  Worker,
} from "@/lib/types";

const LOCATION_TEMPLATES = [
  "Block A lobby",
  "Block A parking ramp",
  "Block A terrace",
  "Block B lobby",
  "Block B children's park",
  "Block B service lane",
  "Block C lobby",
  "Block C basement",
  "Block C rear gate",
  "Clubhouse kitchen",
  "Clubhouse garden",
  "Main entry gate",
  "Visitor parking",
  "Staff quarters",
  "Market lane",
  "Temple courtyard",
  "Playground corner",
  "Sewage plant edge",
  "School pickup zone",
  "Community hall",
];

const SOCIETIES: Omit<Society, "binCount">[] = [
  {
    id: "green-meadows",
    name: "Green Meadows Society",
    area: "Sector 12, Noida",
  },
  {
    id: "riverfront",
    name: "Riverfront Apartments",
    area: "Gomti Nagar, Lucknow",
  },
  {
    id: "hillview",
    name: "Hillview Residency",
    area: "Viman Nagar, Pune",
  },
];

const WORKER_SEED: Omit<Worker, "status" | "assignedBinId" | "assignedSocietyId">[] =
  [
    { id: "W-101", name: "Ramesh Kumar", phone: "98765 41001" },
    { id: "W-102", name: "Priya Sharma", phone: "98765 41002" },
    { id: "W-103", name: "Amit Verma", phone: "98765 41003" },
    { id: "W-104", name: "Sana Iqbal", phone: "98765 41004" },
    { id: "W-105", name: "Deepak Yadav", phone: "98765 41005" },
    { id: "W-106", name: "Kavita Nair", phone: "98765 41006" },
  ];

function nowIso() {
  return new Date().toISOString();
}

function binStatus(fillLevel: number, assigned: boolean): Bin["status"] {
  if (assigned) return "assigned";
  if (fillLevel >= 100) return "full";
  if (fillLevel >= 80) return "warning";
  return "ok";
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function createSeed() {
  const binsById = new Map<string, Bin>();
  const societies: Society[] = SOCIETIES.map((society) => {
    const prefix =
      society.id === "green-meadows"
        ? "GM"
        : society.id === "riverfront"
          ? "RF"
          : "HV";
    for (let i = 1; i <= 20; i += 1) {
      const id = `BIN-${prefix}-${pad(i)}`;
      const fillLevel = Math.floor(Math.random() * 72);
      binsById.set(id, {
        id,
        societyId: society.id,
        location: LOCATION_TEMPLATES[i - 1],
        fillLevel,
        status: binStatus(fillLevel, false),
        lastUpdated: nowIso(),
      });
    }
    return { ...society, binCount: 20 };
  });

  const workersById = new Map<string, Worker>();
  for (const worker of WORKER_SEED) {
    workersById.set(worker.id, {
      ...worker,
      status: "available",
      assignedBinId: null,
      assignedSocietyId: null,
    });
  }

  return {
    societies,
    binsById,
    workersById,
    alertsById: new Map<string, Alert>(),
    jobsById: new Map<string, Job>(),
    seq: 1,
  };
}

class OverflowStore {
  private societies: Society[];
  private binsById: Map<string, Bin>;
  private workersById: Map<string, Worker>;
  private alertsById: Map<string, Alert>;
  private jobsById: Map<string, Job>;
  private seq: number;
  private simulating = true;

  constructor() {
    const seed = createSeed();
    this.societies = seed.societies;
    this.binsById = seed.binsById;
    this.workersById = seed.workersById;
    this.alertsById = seed.alertsById;
    this.jobsById = seed.jobsById;
    this.seq = seed.seq;
  }

  getSnapshot(): AppState {
    const bins = [...this.binsById.values()].sort((a, b) =>
      a.id.localeCompare(b.id),
    );
    const workers = [...this.workersById.values()].sort((a, b) =>
      a.id.localeCompare(b.id),
    );
    const alerts = [...this.alertsById.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    const jobs = [...this.jobsById.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    return {
      societies: this.societies,
      bins,
      workers,
      alerts,
      jobs,
      stats: {
        totalBins: bins.length,
        fullBins: bins.filter((bin) => bin.fillLevel >= 100).length,
        openAlerts: alerts.filter((alert) => alert.status !== "resolved").length,
        workersAvailable: workers.filter((worker) => worker.status === "available")
          .length,
      },
    };
  }

  getBin(id: string) {
    return this.binsById.get(id) ?? null;
  }

  setFillLevel(binId: string, fillLevel: number, source = "sensor") {
    const bin = this.binsById.get(binId);
    if (!bin) {
      throw new Error(`Unknown bin ID: ${binId}`);
    }
    const next = Math.max(0, Math.min(100, Math.round(fillLevel)));
    bin.fillLevel = next;
    bin.lastUpdated = nowIso();
    const assigned = Boolean(
      [...this.alertsById.values()].find(
        (alert) => alert.binId === binId && alert.status === "dispatched",
      ),
    );
    bin.status = binStatus(next, assigned);

    let alert: Alert | null = null;
    if (next >= 100) {
      alert = this.ensureFullAlert(bin);
    }

    this.publish({
      type: alert ? "bin.full" : "bin.updated",
      binId,
      alertId: alert?.id,
      message: alert?.message,
      source,
      state: this.getSnapshot(),
    });
    return { bin, alert };
  }

  reportFull(binId: string) {
    return this.setFillLevel(binId, 100, "resident-report");
  }

  dispatch(alertId: string, workerId: string) {
    const alert = this.alertsById.get(alertId);
    if (!alert || alert.status === "resolved") {
      throw new Error("Alert is not available for dispatch.");
    }
    if (alert.status === "dispatched") {
      throw new Error("Workers are already assigned to this bin.");
    }
    const worker = this.workersById.get(workerId);
    if (!worker) {
      throw new Error("Unknown worker.");
    }
    if (worker.status !== "available") {
      throw new Error(`${worker.name} is already on another collection job.`);
    }
    const bin = this.binsById.get(alert.binId);
    if (!bin) {
      throw new Error("Bin no longer exists.");
    }

    worker.status = "en_route";
    worker.assignedBinId = bin.id;
    worker.assignedSocietyId = bin.societyId;
    alert.status = "dispatched";
    alert.workerId = worker.id;
    alert.updatedAt = nowIso();
    bin.status = "assigned";
    bin.lastUpdated = nowIso();

    const job: Job = {
      id: `JOB-${this.nextSeq()}`,
      alertId: alert.id,
      binId: bin.id,
      societyId: bin.societyId,
      workerId: worker.id,
      status: "assigned",
      instruction: `Go to ${this.societyName(bin.societyId)} - ${bin.location}. Empty unique bin ${bin.id} and haul the garbage away.`,
      createdAt: nowIso(),
      completedAt: null,
    };
    this.jobsById.set(job.id, job);

    this.publish({
      type: "dispatch",
      alertId: alert.id,
      workerId: worker.id,
      binId: bin.id,
      jobId: job.id,
      state: this.getSnapshot(),
    });
    return { alert, worker, job };
  }

  completeJob(jobId: string) {
    const job = this.jobsById.get(jobId);
    if (!job || job.status === "completed") {
      throw new Error("Job is not active.");
    }
    const bin = this.binsById.get(job.binId);
    const worker = this.workersById.get(job.workerId);
    const alert = this.alertsById.get(job.alertId);
    if (!bin || !worker || !alert) {
      throw new Error("Job records are incomplete.");
    }

    bin.fillLevel = 0;
    bin.status = "ok";
    bin.lastUpdated = nowIso();
    worker.status = "available";
    worker.assignedBinId = null;
    worker.assignedSocietyId = null;
    alert.status = "resolved";
    alert.updatedAt = nowIso();
    job.status = "completed";
    job.completedAt = nowIso();

    this.publish({
      type: "emptied",
      binId: bin.id,
      jobId: job.id,
      state: this.getSnapshot(),
    });
    return { job, bin, worker, alert };
  }

  tickSimulation() {
    if (!this.simulating) return;
    const bins = [...this.binsById.values()].filter(
      (bin) => bin.fillLevel < 100 && bin.status !== "assigned",
    );
    if (!bins.length) return;
    const count = 1 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i += 1) {
      const bin = bins[Math.floor(Math.random() * bins.length)];
      const bump = 4 + Math.floor(Math.random() * 10);
      this.setFillLevel(bin.id, bin.fillLevel + bump, "iot-sensor");
    }
  }

  setSimulating(on: boolean) {
    this.simulating = on;
    return this.simulating;
  }

  isSimulating() {
    return this.simulating;
  }

  private ensureFullAlert(bin: Bin) {
    const existing = [...this.alertsById.values()].find(
      (alert) => alert.binId === bin.id && alert.status !== "resolved",
    );
    if (existing) {
      return existing;
    }
    const society = this.societyName(bin.societyId);
    const alert: Alert = {
      id: `ALT-${this.nextSeq()}`,
      binId: bin.id,
      societyId: bin.societyId,
      message: `Bin ${bin.id} is completely full at ${bin.location}, ${society}. Send your workers to empty the bin by taking its garbage.`,
      status: "open",
      workerId: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.alertsById.set(alert.id, alert);
    return alert;
  }

  private societyName(id: string) {
    return this.societies.find((society) => society.id === id)?.name ?? id;
  }

  private nextSeq() {
    const value = this.seq;
    this.seq += 1;
    return String(value).padStart(4, "0");
  }

  private publish(data: unknown) {
    eventBus.publish(data);
  }
}

const globalStore = globalThis as typeof globalThis & {
  overflowStore?: OverflowStore;
  overflowSimTimer?: ReturnType<typeof setInterval>;
};

export const store = globalStore.overflowStore ?? new OverflowStore();
if (!globalStore.overflowStore) {
  globalStore.overflowStore = store;
}

if (!globalStore.overflowSimTimer) {
  globalStore.overflowSimTimer = setInterval(() => {
    store.tickSimulation();
  }, 3500);
}

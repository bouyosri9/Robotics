const DEFAULT_ROBOT = {
  id: "generic-robot",
  name: "Generic Robot",
  dof: 6,
  joints: [
    { key: "j1", min: -180, max: 180, default: 0 },
    { key: "j2", min: -180, max: 180, default: -50 },
    { key: "j3", min: -170, max: 170, default: 70 },
    { key: "j4", min: -180, max: 180, default: -40 },
    { key: "j5", min: -180, max: 180, default: 45 },
    { key: "j6", min: -360, max: 360, default: 0 },
  ],
  kinematics: {
    baseHeight: 90,
    upperArmLength: 320,
    forearmLength: 280,
    wristLength: 90,
  },
  presets: {
    home: [0, -50, 70, -40, 45, 0],
    demo: [35, -70, 100, -60, 60, 25],
  },
  motion: { maxAngularVelocityDegPerSec: 120, accelerationDegPerSec2: 80, smoothing: 0.18 },
};

const SPEED_DEG_PER_TICK = 1.2;

// Un angle de preset valant 0 est une valeur légitime : `Number(angle) || defaut`
// la traitait comme absente et la remplaçait par le défaut du joint.
function toAngle(angle, fallback) {
  const value = Number(angle);
  if (Number.isFinite(value)) return value;
  return Number.isFinite(fallback) ? fallback : 0;
}

function normalizeRobotConfig(robotConfig = DEFAULT_ROBOT) {
  const config = { ...DEFAULT_ROBOT, ...robotConfig };
  const joints = Array.isArray(config.joints) && config.joints.length > 0 ? config.joints : DEFAULT_ROBOT.joints;
  const jointMap = joints.reduce((acc, joint) => {
    const key = joint.key || `j${acc.length + 1}`;
    acc[key] = {
      ...joint,
      default: typeof joint.default === "number" ? joint.default : 0,
      min: typeof joint.min === "number" ? joint.min : -180,
      max: typeof joint.max === "number" ? joint.max : 180,
    };
    return acc;
  }, {});

  const homePose = Array.isArray(config.presets?.home)
    ? config.presets.home.reduce((acc, angle, index) => {
        const key = joints[index]?.key || `j${index + 1}`;
        acc[key] = toAngle(angle, jointMap[key]?.default);
        return acc;
      }, {})
    : Object.fromEntries(Object.entries(jointMap).map(([key, joint]) => [key, joint.default]));

  const demoPose = Array.isArray(config.presets?.demo)
    ? config.presets.demo.reduce((acc, angle, index) => {
        const key = joints[index]?.key || `j${index + 1}`;
        acc[key] = toAngle(angle, jointMap[key]?.default);
        return acc;
      }, {})
    : { ...homePose };

  return {
    ...config,
    joints,
    jointMap,
    jointKeys: Object.keys(jointMap),
    homePose,
    demoPose,
    kinematics: { ...DEFAULT_ROBOT.kinematics, ...config.kinematics },
  };
}

export class RobotEngine {
  constructor(robotConfig = DEFAULT_ROBOT) {
    this.robotConfig = normalizeRobotConfig(robotConfig);
    this.joints = { ...this.robotConfig.homePose };
    this.target = { ...this.robotConfig.homePose };
    this.status = "idle";
    this.connected = true;
    this.listeners = [];
    this.interval = null;
    this.jointLimits = Object.fromEntries(
      this.robotConfig.joints.map((joint) => [joint.key, [joint.min, joint.max]])
    );
  }

  setRobotConfig(robotConfig) {
    this.robotConfig = normalizeRobotConfig(robotConfig);
    this.joints = { ...this.robotConfig.homePose };
    this.target = { ...this.robotConfig.homePose };
    this.status = "idle";
    this.jointLimits = Object.fromEntries(
      this.robotConfig.joints.map((joint) => [joint.key, [joint.min, joint.max]])
    );
  }

  getJointKeys() {
    return [...this.robotConfig.jointKeys];
  }

  getJointLimits() {
    return { ...this.jointLimits };
  }

  onUpdate(cb) {
    this.listeners.push(cb);
  }

  emit() {
    const state = this.getState();
    this.listeners.forEach((cb) => cb(state));
  }

  getState() {
    return {
      robotId: this.robotConfig.id,
      robotName: this.robotConfig.name,
      joints: { ...this.joints },
      target: { ...this.target },
      status: this.status,
      connected: this.connected,
      tcp: this.computeTcp(),
      timestamp: Date.now(),
    };
  }

  setTarget(partialTarget) {
    const nextTarget = { ...this.target };
    Object.entries(partialTarget || {}).forEach(([key, value]) => {
      if (this.robotConfig.jointKeys.includes(key)) {
        nextTarget[key] = value;
      }
    });
    this.target = nextTarget;
    this.status = "running";
  }

  setCommand(command) {
    switch (command) {
      case "start": {
        const stillAtTarget = this.robotConfig.jointKeys.every(
          (key) => Math.abs(this.target[key] - this.joints[key]) < 0.5
        );
        if (stillAtTarget) {
          const atHome = this.robotConfig.jointKeys.every(
            (key) => Math.abs(this.joints[key] - this.robotConfig.homePose[key]) < 1
          );
          this.target = atHome ? { ...this.robotConfig.demoPose } : { ...this.robotConfig.homePose };
        }
        this.status = "running";
        break;
      }
      case "pause":
        this.status = "paused";
        break;
      case "stop":
        this.status = "idle";
        this.target = { ...this.joints };
        break;
      case "home":
        this.target = { ...this.robotConfig.homePose };
        this.status = "running";
        break;
      default:
        throw new Error(`Commande inconnue: ${command}`);
    }
  }

  computeTcp() {
    const rad = (deg) => (deg * Math.PI) / 180;
    const { j1 = 0, j2 = 0, j3 = 0 } = this.joints;
    const { upperArmLength = 320, forearmLength = 280, baseHeight = 90 } = this.robotConfig.kinematics;
    const reach = upperArmLength * Math.cos(rad(j2)) + forearmLength * Math.cos(rad(j2 + j3));
    const height = baseHeight + upperArmLength * Math.sin(rad(j2)) + forearmLength * Math.sin(rad(j2 + j3));

    return {
      x: Number((reach * Math.sin(rad(j1))).toFixed(1)),
      y: Number((reach * Math.cos(rad(j1))).toFixed(1)),
      z: Number(height.toFixed(1)),
    };
  }

  tick() {
    if (this.status === "running") {
      let reached = true;
      const next = { ...this.joints };
      this.robotConfig.jointKeys.forEach((key) => {
        const diff = this.target[key] - this.joints[key];
        if (Math.abs(diff) > SPEED_DEG_PER_TICK) {
          next[key] += Math.sign(diff) * SPEED_DEG_PER_TICK;
          reached = false;
        } else {
          next[key] = this.target[key];
        }
      });
      this.joints = next;
      if (reached) this.status = "idle";
    }
    this.emit();
  }

  start(tickMs = 50) {
    if (this.interval) return;
    this.interval = setInterval(() => this.tick(), tickMs);
  }

  stopEngine() {
    clearInterval(this.interval);
    this.interval = null;
  }
}

export { DEFAULT_ROBOT };

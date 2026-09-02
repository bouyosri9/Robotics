/**
 * forwardKinematics.js
 * Generic Denavit-Hartenberg FK implementation for robot-specific chains.
 *
 * The UR3e uses the official nominal DH parameters published by Universal Robots.
 * Other robots may provide their own DH tables through their definitions.
 */

/**
 * Nominal UR3e DH table.
 *
 * The `theta` entries are the standard UR joint offsets, not spare parameters:
 * they make joint angles mean what the teach pendant means, so all-zeros is the
 * arm standing straight up (TCP 0.694 m above the base) exactly as on the real
 * robot. Without them, all-zeros lays the arm out horizontally and every angle
 * reported here is shifted from the physical robot by 90 degrees on J2 and J4.
 */
export const UR3E_DH = [
  { joint: 1, theta: 0, a: 0, d: 0.15185, alpha: Math.PI / 2 },
  { joint: 2, theta: -Math.PI / 2, a: -0.24355, d: 0, alpha: 0 },
  { joint: 3, theta: 0, a: -0.2132, d: 0, alpha: 0 },
  { joint: 4, theta: -Math.PI / 2, a: 0, d: 0.13105, alpha: Math.PI / 2 },
  { joint: 5, theta: 0, a: 0, d: 0.08535, alpha: -Math.PI / 2 },
  { joint: 6, theta: 0, a: 0, d: 0.0921, alpha: 0 },
];

const deg2rad = (deg) => (deg * Math.PI) / 180;

function dhMatrix(thetaDeg, dhParam) {
  const theta = dhParam.theta !== undefined ? dhParam.theta + deg2rad(thetaDeg) : deg2rad(thetaDeg);
  const alpha = dhParam.alpha ?? 0;
  const d = dhParam.d ?? 0;
  const a = dhParam.a ?? 0;

  const ct = Math.cos(theta), st = Math.sin(theta);
  const ca = Math.cos(alpha), sa = Math.sin(alpha);

  return [
    ct, -st * ca, st * sa, a * ct,
    st, ct * ca, -ct * sa, a * st,
    0, sa, ca, d,
    0, 0, 0, 1,
  ];
}

function multiplyMat4(A, B) {
  const result = new Array(16).fill(0);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += A[row * 4 + k] * B[k * 4 + col];
      }
      result[row * 4 + col] = sum;
    }
  }
  return result;
}

export function computeForwardKinematics(jointAnglesDeg, dhParams = UR3E_DH) {
  if (!Array.isArray(dhParams) || dhParams.length === 0) {
    throw new Error("DH parameter table is required to compute FK");
  }

  let T = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

  jointAnglesDeg.forEach((theta, i) => {
    const Ti = dhMatrix(theta, dhParams[i]);
    T = multiplyMat4(T, Ti);
  });

  return {
    // T is row-major, so the translation is the last *column* (indices 3, 7, 11).
    // Indices 12-14 are the bottom row, which is always [0, 0, 0].
    position: { x: T[3], y: T[7], z: T[11] },
    orientation: {
      x: T[0], y: T[1], z: T[2],
      xx: T[4], yx: T[5], zx: T[6],
      xy: T[8], yy: T[9], zy: T[10],
    },
    matrix: T,
  };
}

export function computeRobotFkFromDefinition(robot, jointValues = {}) {
  const jointKeys = robot?.joints?.map((joint) => joint.key) || [];
  const jointAnglesDeg = jointKeys.map((key) => Number(jointValues[key] ?? 0));
  const dhParams = robot?.kinematics?.dh || UR3E_DH;
  return computeForwardKinematics(jointAnglesDeg, dhParams);
}

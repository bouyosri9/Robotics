import test from 'node:test';
import assert from 'node:assert/strict';

import { ROBOT_DEFINITIONS, ROBOT_LIST, getRobotDefinition } from './robotDefinitions.js';

const EXPECTED_ROBOTS = [
  'ur3e',
  'ur5e',
  'ur10e',
  'ur15',
  'ur20',
  'ur30',
  'zu5',
  'zu12',
  'zu18',
  'ai7',
  'minicobo',
  'lumi',
];

test('all robot IDs are unique and complete', () => {
  const ids = ROBOT_LIST.map((robot) => robot.id);
  assert.equal(ids.length, 12);
  assert.deepEqual(ids.sort(), EXPECTED_ROBOTS.sort());
  assert.equal(new Set(ids).size, ids.length);
});

test('UR3e matches official manufacturer data', () => {
  const robot = ROBOT_DEFINITIONS.ur3e;
  assert.equal(robot.dof, 6);
  assert.equal(robot.specifications.payloadKg, 3);
  assert.equal(robot.specifications.reachMm, 500);
  assert.equal(robot.specifications.repeatabilityMm, 0.03);
  assert.equal(robot.specifications.weightKg, 11.2);
  assert.equal(robot.specifications.maxTcpSpeedMs, 3);
  assert.equal(robot.kinematics.dh.length, 6);
  assert.deepEqual(robot.kinematics.dh.map((item) => item.joint), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(robot.kinematics.dh.map((item) => Number(item.a.toFixed(5))), [0, -0.24355, -0.2132, 0, 0, 0]);
  assert.deepEqual(robot.kinematics.dh.map((item) => Number(item.d.toFixed(5))), [0.15185, 0, 0, 0.13105, 0.08535, 0.0921]);
  assert.deepEqual(robot.kinematics.dh.map((item) => Number(item.alpha.toFixed(5))), [1.5708, 0, 0, 1.5708, -1.5708, 0]);
  assert.equal(robot.joints[0].min, -360);
  assert.equal(robot.joints[1].min, -360);
  assert.equal(robot.joints[2].min, -160);
  assert.equal(robot.joints[3].min, -360);
  assert.equal(robot.joints[4].min, -360);
  assert.equal(robot.joints[5].min, -360);
  assert.equal(robot.joints[0].max, 360);
  assert.equal(robot.joints[1].max, 360);
  assert.equal(robot.joints[2].max, 160);
  assert.equal(robot.joints[3].max, 360);
  assert.equal(robot.joints[4].max, 360);
  assert.equal(robot.joints[5].max, 360);
  assert.equal(robot.joints[0].maxVelocity, 180);
  assert.equal(robot.joints[1].maxVelocity, 180);
  assert.equal(robot.joints[2].maxVelocity, 180);
  assert.equal(robot.joints[3].maxVelocity, 360);
  assert.equal(robot.joints[4].maxVelocity, 360);
  assert.equal(robot.joints[5].maxVelocity, 360);
});

test('UR5e matches the geometry measured from its STEP file', () => {
  const robot = ROBOT_DEFINITIONS.ur5e;
  assert.equal(robot.dof, 6);
  // Read off the joint bores in UR5e.step: J2 at Y=162.5, J3 at Y=587.5,
  // J4 at Y=979.7, J5 offset 133.3, J6 at Y=1079.4, flange 99.6 past the wrist.
  assert.deepEqual(robot.kinematics.dh.map((item) => Number(item.a.toFixed(5))), [0, -0.425, -0.3922, 0, 0, 0]);
  assert.deepEqual(robot.kinematics.dh.map((item) => Number(item.d.toFixed(5))), [0.1625, 0, 0, 0.1333, 0.0997, 0.0996]);
  assert.deepEqual(robot.kinematics.dh.map((item) => Number(item.alpha.toFixed(5))), [1.5708, 0, 0, 1.5708, -1.5708, 0]);
  // The measured link lengths are UR5e's, so the reach is the 850 mm one.
  assert.equal(robot.specifications.reachMm, 850);
  assert.equal(robot.specifications.reach, 850);

  // The UR5e STEP is authored facing the opposite way to the UR3e one. Reusing
  // UR3e's matrix here would put the J5 axis 266.6 mm off and swing the wrist
  // about a line that misses the real one, so the 180-degree turn is load-bearing.
  assert.deepEqual(robot.articulation.dhToScene, [1, 0, 0, 0, 0, 1, 0, -1, 0]);
  assert.notDeepEqual(robot.articulation.dhToScene, ROBOT_DEFINITIONS.ur3e.articulation.dhToScene);
  assert.deepEqual(robot.articulation.referencePoseDeg, [0, 0, 0, 0, 0, 0]);
  assert.equal(robot.articulation.baseNode, 'L0_base');
  assert.deepEqual(robot.articulation.linkNodes, [
    'L1_shoulder',
    'L2_upper_arm',
    'L3_forearm',
    'L4_wrist_1',
    'L5_wrist_2',
    'L6_wrist_3',
  ]);
});

test('UR20 matches the geometry measured from its STEP file', () => {
  const robot = ROBOT_DEFINITIONS.ur20;
  assert.equal(robot.dof, 6);
  // Read off the joint bores in UR20.step: J2 at Y=236.3, J3 at Y=1098.3,
  // J4 at Y=1827.0, J5 offset 201.0, J6 at Y=1986.3, flange 154.3 past the wrist.
  assert.deepEqual(robot.kinematics.dh.map((item) => Number(item.a.toFixed(5))), [0, -0.862, -0.7287, 0, 0, 0]);
  assert.deepEqual(robot.kinematics.dh.map((item) => Number(item.d.toFixed(5))), [0.2363, 0, 0, 0.201, 0.1593, 0.1543]);
  assert.deepEqual(robot.kinematics.dh.map((item) => Number(item.alpha.toFixed(5))), [1.5708, 0, 0, 1.5708, -1.5708, 0]);
  assert.equal(robot.specifications.reachMm, 1750);

  // The UR20 STEP faces the same way as the UR3e one, unlike the UR5e one.
  // Using UR5e's matrix here would put the J5 axis 402.0 mm off, so which of
  // the two matrices this entry carries is load-bearing.
  assert.deepEqual(robot.articulation.dhToScene, [-1, 0, 0, 0, 0, 1, 0, 1, 0]);
  assert.deepEqual(robot.articulation.dhToScene, ROBOT_DEFINITIONS.ur3e.articulation.dhToScene);
  assert.notDeepEqual(robot.articulation.dhToScene, ROBOT_DEFINITIONS.ur5e.articulation.dhToScene);
  assert.deepEqual(robot.articulation.referencePoseDeg, [0, 0, 0, 0, 0, 0]);
  assert.equal(robot.articulation.baseNode, 'L0_base');
  assert.deepEqual(robot.articulation.linkNodes, [
    'L1_shoulder',
    'L2_upper_arm',
    'L3_forearm',
    'L4_wrist_1',
    'L5_wrist_2',
    'L6_wrist_3',
  ]);
});

test('UR30 matches the geometry solved from its posed STEP file', () => {
  const robot = ROBOT_DEFINITIONS.ur30;
  assert.equal(robot.dof, 6);
  // UR30.step is authored posed, so these came from solving the chain against
  // the joint bores: J2||J3 637.00 mm apart, J3||J4 503.70 mm apart, the wrist
  // axes perpendicular and intersecting, flange 154.30 mm past the wrist centre.
  assert.deepEqual(robot.kinematics.dh.map((item) => Number(item.a.toFixed(5))), [0, -0.637, -0.5037, 0, 0, 0]);
  assert.deepEqual(robot.kinematics.dh.map((item) => Number(item.d.toFixed(5))), [0.2363, 0, 0, 0.201, 0.1593, 0.1543]);
  assert.deepEqual(robot.kinematics.dh.map((item) => Number(item.alpha.toFixed(5))), [1.5708, 0, 0, 1.5708, -1.5708, 0]);
  assert.equal(robot.specifications.reachMm, 1300);
  assert.deepEqual(robot.articulation.dhToScene, [-1, 0, 0, 0, 0, 1, 0, 1, 0]);

  // The pose is the load-bearing part: unlike every other entry it is not all
  // zeros, because the bind offsets have to undo the pose the CAD was drawn in.
  assert.deepEqual(robot.articulation.referencePoseDeg, [111, -106, 165.281, -162, -8, 0]);
  assert.notDeepEqual(robot.articulation.referencePoseDeg, [0, 0, 0, 0, 0, 0]);
  // That elbow angle is why J3 is not clamped to the +/-160 its siblings use.
  const j3 = robot.joints[2];
  assert.ok(Math.abs(robot.articulation.referencePoseDeg[2]) <= j3.max);
  assert.equal(robot.articulation.baseNode, 'L0_base');
  assert.deepEqual(robot.articulation.linkNodes, [
    'L1_shoulder',
    'L2_upper_arm',
    'L3_forearm',
    'L4_wrist_1',
    'L5_wrist_2',
    'L6_wrist_3',
  ]);
});

test('UR15 matches the geometry solved from its posed STEP file', () => {
  const robot = ROBOT_DEFINITIONS.ur15;
  assert.equal(robot.dof, 6);
  // Solved from the joint bores in UR15.step: J2||J3 647.50 mm apart, J3||J4
  // 516.40 mm apart, wrist axes perpendicular, flange 143.40 mm past the wrist.
  assert.deepEqual(robot.kinematics.dh.map((item) => Number(item.a.toFixed(5))), [0, -0.6475, -0.5164, 0, 0, 0]);
  assert.deepEqual(robot.kinematics.dh.map((item) => Number(item.d.toFixed(5))), [0.2186, 0, 0, 0.1824, 0.1361, 0.1434]);
  assert.deepEqual(robot.kinematics.dh.map((item) => Number(item.alpha.toFixed(5))), [1.5708, 0, 0, 1.5708, -1.5708, 0]);
  assert.equal(robot.specifications.reachMm, 1300);
  assert.deepEqual(robot.articulation.dhToScene, [-1, 0, 0, 0, 0, 1, 0, 1, 0]);

  // Posed CAD, so the pose is load-bearing. J5 specifically: the axis lines
  // leave it free between 0 and -180, and only the flange position picks 0.
  assert.deepEqual(robot.articulation.referencePoseDeg, [-90, -101, 167, -170, 0, 0]);
  assert.notDeepEqual(robot.articulation.referencePoseDeg, [0, 0, 0, 0, 0, 0]);
  // That elbow angle is why J3 is not clamped to the +/-160 UR3e/UR20 use.
  assert.ok(Math.abs(robot.articulation.referencePoseDeg[2]) <= robot.joints[2].max);
  assert.equal(robot.articulation.baseNode, 'L0_base');
  assert.deepEqual(robot.articulation.linkNodes, [
    'L1_shoulder',
    'L2_upper_arm',
    'L3_forearm',
    'L4_wrist_1',
    'L5_wrist_2',
    'L6_wrist_3',
  ]);
});

test('UR10e matches the geometry measured from its STEP file', () => {
  const robot = ROBOT_DEFINITIONS.ur10e;
  assert.equal(robot.dof, 6);
  // Read off the joint bores in UR10e.step: J2 at Y=180.70, J3 at Y=793.40,
  // J4 at Y=1364.95, J5 offset 174.15, J6 at Y=1484.80, flange 116.55 past it.
  assert.deepEqual(robot.kinematics.dh.map((item) => Number(item.a.toFixed(5))), [0, -0.6127, -0.57155, 0, 0, 0]);
  assert.deepEqual(robot.kinematics.dh.map((item) => Number(item.d.toFixed(5))), [0.1807, 0, 0, 0.17415, 0.11985, 0.11655]);
  assert.deepEqual(robot.kinematics.dh.map((item) => Number(item.alpha.toFixed(5))), [1.5708, 0, 0, 1.5708, -1.5708, 0]);
  assert.equal(robot.specifications.reachMm, 1300);

  // Authored the same way round as the UR5e, and straight up, so it takes the
  // UR5e matrix with an all-zero pose -- unlike the posed UR15/UR30 entries.
  assert.deepEqual(robot.articulation.dhToScene, ROBOT_DEFINITIONS.ur5e.articulation.dhToScene);
  assert.notDeepEqual(robot.articulation.dhToScene, ROBOT_DEFINITIONS.ur3e.articulation.dhToScene);
  assert.deepEqual(robot.articulation.referencePoseDeg, [0, 0, 0, 0, 0, 0]);
  assert.equal(robot.articulation.baseNode, 'L0_base');
  assert.deepEqual(robot.articulation.linkNodes, [
    'L1_shoulder',
    'L2_upper_arm',
    'L3_forearm',
    'L4_wrist_1',
    'L5_wrist_2',
    'L6_wrist_3',
  ]);

  // Longer arm than the UR5e it shares an orientation with, shorter than UR20.
  const span = (r) => r.kinematics.dh.reduce((t, i) => t + Math.abs(i.a) + Math.abs(i.d), 0);
  assert.ok(span(robot) > span(ROBOT_DEFINITIONS.ur5e));
  assert.ok(span(robot) < span(ROBOT_DEFINITIONS.ur20));
});

test('all robots have valid joint metadata', () => {
  for (const robot of ROBOT_LIST) {
    assert.ok(robot.name, `${robot.id} missing name`);
    assert.ok(robot.dof > 0, `${robot.id} has invalid DOF`);
    assert.ok(Array.isArray(robot.joints), `${robot.id} joints missing`);
    assert.equal(robot.joints.length, robot.dof, `${robot.id} DOF mismatch`);

    for (const joint of robot.joints) {
      assert.ok(joint.key, `${robot.id} joint key missing`);
      assert.ok(joint.min < joint.max, `${robot.id}/${joint.key} invalid min/max`);
    }

    assert.ok(Array.isArray(robot.presets?.home), `${robot.id} home preset missing`);
    assert.ok(Array.isArray(robot.presets?.demo), `${robot.id} demo preset missing`);
    assert.equal(robot.presets.home.length, robot.dof, `${robot.id} home preset length mismatch`);
    assert.equal(robot.presets.demo.length, robot.dof, `${robot.id} demo preset length mismatch`);

    for (const [index, angle] of robot.presets.home.entries()) {
      const joint = robot.joints[index];
      assert.ok(Number.isFinite(angle), `${robot.id} home angle non-finite`);
      assert.ok(angle >= joint.min && angle <= joint.max, `${robot.id} home preset outside ${joint.key} limits`);
    }

    for (const [index, angle] of robot.presets.demo.entries()) {
      const joint = robot.joints[index];
      assert.ok(Number.isFinite(angle), `${robot.id} demo angle non-finite`);
      assert.ok(angle >= joint.min && angle <= joint.max, `${robot.id} demo preset outside ${joint.key} limits`);
    }
  }
});

test('each robot has a valid model path and unique asset', () => {
  const assets = new Set();
  for (const robot of ROBOT_LIST) {
    assert.match(robot.model.url, /\.glb$/i, `${robot.id} model path is not a GLB url`);
    assert.ok(!assets.has(robot.model.url), `${robot.id} duplicate model url`);
    assets.add(robot.model.url);
  }
});

test('kinematic definition and getter behave as expected', () => {
  for (const robot of ROBOT_LIST) {
    assert.ok(robot.kinematics, `${robot.id} missing kinematics`);
    assert.ok(Number.isFinite(robot.kinematics.baseHeight), `${robot.id} baseHeight invalid`);
    assert.ok(Number.isFinite(robot.kinematics.upperArmLength), `${robot.id} upperArmLength invalid`);
    assert.ok(Number.isFinite(robot.kinematics.forearmLength), `${robot.id} forearmLength invalid`);
    assert.ok(Number.isFinite(robot.kinematics.wristLength), `${robot.id} wristLength invalid`);
    assert.deepEqual(getRobotDefinition(robot.id), robot);
  }
});

test('Lumi is the only multi-DOF configuration and all other robots stay six-axis', () => {
  const sixAxisRobots = ROBOT_LIST.filter((robot) => robot.id !== 'lumi');
  assert.ok(sixAxisRobots.every((robot) => robot.dof === 6));
  assert.equal(ROBOT_DEFINITIONS.lumi.dof, 12);
});

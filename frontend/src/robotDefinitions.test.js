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

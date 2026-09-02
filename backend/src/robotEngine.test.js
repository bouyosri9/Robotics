import test from 'node:test';
import assert from 'node:assert/strict';

import { RobotEngine } from './robotEngine.js';

const robot = {
  id: 'zu12',
  name: 'Zu 12',
  dof: 6,
  joints: [
    { key: 'j1', min: -180, max: 180, default: 0 },
    { key: 'j2', min: -180, max: 180, default: -52 },
    { key: 'j3', min: -170, max: 170, default: 72 },
    { key: 'j4', min: -180, max: 180, default: -40 },
    { key: 'j5', min: -180, max: 180, default: 45 },
    { key: 'j6', min: -360, max: 360, default: 0 },
  ],
  kinematics: {
    baseHeight: 100,
    upperArmLength: 330,
    forearmLength: 360,
    wristLength: 110,
  },
  presets: {
    home: [0, -52, 72, -40, 45, 0],
    demo: [35, -85, 110, -65, 65, 18],
  },
};

test('engine uses robot-specific joint keys and defaults', () => {
  const engine = new RobotEngine(robot);
  assert.deepEqual(Object.keys(engine.joints).sort(), ['j1', 'j2', 'j3', 'j4', 'j5', 'j6']);
  assert.deepEqual(engine.target, {
    j1: 0,
    j2: -52,
    j3: 72,
    j4: -40,
    j5: 45,
    j6: 0,
  });
});

test('engine uses kinematic values from robot definition', () => {
  const engine = new RobotEngine(robot);
  const tcp = engine.computeTcp();
  assert.ok(Number.isFinite(tcp.x));
  assert.ok(Number.isFinite(tcp.y));
  assert.ok(Number.isFinite(tcp.z));
  assert.ok(Math.abs(tcp.z) < 1000);
});

test('engine responds to robot-specific home/demo command presets', () => {
  const engine = new RobotEngine(robot);
  engine.setCommand('home');
  assert.deepEqual(engine.target, { j1: 0, j2: -52, j3: 72, j4: -40, j5: 45, j6: 0 });
  engine.setCommand('start');
  assert.equal(engine.status, 'running');
});

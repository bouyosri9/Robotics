/**
 * UR3eGLBModel — articulated loader for the FreeCAD-converted UR3e GLB.
 *
 * The GLB (public/models/ur3e.glb) is a direct conversion of models/UR3e.step.
 * It keeps the CAD assembly intact: seven link groups (L0_base .. L6_wrist_3),
 * each holding one child node per original CAD solid. All geometry is baked in
 * world coordinates at the CAD reference pose, in metres, Y-up.
 *
 * Rigging is derived from the robot's own DH table rather than hand-placed
 * pivots, so the picture cannot drift from computeForwardKinematics():
 *
 *   world(joint i) = M . A1(q1) . A2(q2) ... Ai(qi)
 *   world(link  i) = world(joint i) . Bi,   Bi = inverse(M . Ti(qRef))
 *
 * M maps the DH frame (Z-up) onto the CAD/scene frame (Y-up); Bi is the fixed
 * bind offset that puts each link back exactly where the CAD authored it when
 * q == qRef. Both M and qRef were solved against the link origins measured from
 * the STEP file, and cross-checked against the joint bore axes in the CAD:
 * the fit is exact to 0.00 mm on all four independently constrained frames.
 */

import React, { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const DEG = Math.PI / 180;

const DEFAULT_LINK_NODES = [
  "L1_shoulder",
  "L2_upper_arm",
  "L3_forearm",
  "L4_wrist_1",
  "L5_wrist_2",
  "L6_wrist_3",
];

/** DH link transform, identical in form to forwardKinematics.js. */
function dhMatrix(thetaRad, param) {
  const alpha = param.alpha ?? 0;
  const d = param.d ?? 0;
  const a = param.a ?? 0;
  const ct = Math.cos(thetaRad);
  const st = Math.sin(thetaRad);
  const ca = Math.cos(alpha);
  const sa = Math.sin(alpha);

  return new THREE.Matrix4().set(
    ct, -st * ca, st * sa, a * ct,
    st, ct * ca, -ct * sa, a * st,
    0, sa, ca, d,
    0, 0, 0, 1
  );
}

function jointAngleRad(param, degrees) {
  return (param.theta ?? 0) + degrees * DEG;
}

const AXIS_COLORS = ["#38bdf8", "#f97316", "#a3e635", "#e879f9", "#facc15", "#fb7185"];

/**
 * A line through joint i's real rotation axis, drawn in the parent frame where
 * that axis is stationary. Joint i rotates about the Z axis of its parent frame
 * (theta is the first factor of the DH product), so the axis is +Z through the
 * parent origin — except J1, whose parent also carries the DH->scene rotation.
 */
function buildJointAxis(index, dhToScene, length = 0.13) {
  const dir = new THREE.Vector3(0, 0, 1);
  if (index === 0) dir.applyMatrix4(dhToScene).normalize();

  const geometry = new THREE.BufferGeometry().setFromPoints([
    dir.clone().multiplyScalar(-length),
    dir.clone().multiplyScalar(length),
  ]);
  const line = new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({
      color: AXIS_COLORS[index],
      depthTest: false,
      transparent: true,
      opacity: 0.9,
    })
  );
  line.name = `J${index + 1}_axis`;
  line.renderOrder = 999;
  return line;
}

export function UR3eGLBModel({
  url,
  joints = {},
  jointKeys = ["j1", "j2", "j3", "j4", "j5", "j6"],
  dh,
  articulation,
  showJointAxes = false,
  onError,
}) {
  const { scene } = useGLTF(url);

  const referencePose = articulation?.referencePoseDeg ?? [0, 0, 0, 0, 0, 0];
  const baseNodeName = articulation?.baseNode ?? "L0_base";
  const linkNodeNames = articulation?.linkNodes ?? DEFAULT_LINK_NODES;

  // M: DH frame -> scene frame. Verified against UR3e.step as (x,y,z) -> (-x, z, y).
  const dhToScene = useMemo(() => {
    const m = articulation?.dhToScene ?? [-1, 0, 0, 0, 0, 1, 0, 1, 0];
    return new THREE.Matrix4().set(
      m[0], m[1], m[2], 0,
      m[3], m[4], m[5], 0,
      m[6], m[7], m[8], 0,
      0, 0, 0, 1
    );
  }, [articulation]);

  // Fixed bind offset per link, evaluated once at the CAD reference pose.
  const bindMatrices = useMemo(() => {
    if (!dh || dh.length < 6) return null;
    const out = [];
    let chain = new THREE.Matrix4();
    for (let i = 0; i < 6; i += 1) {
      chain = chain.clone().multiply(dhMatrix(jointAngleRad(dh[i], referencePose[i] ?? 0), dh[i]));
      const world = dhToScene.clone().multiply(chain);
      out.push(world.invert());
    }
    return out;
  }, [dh, dhToScene, referencePose]);

  // Build base + J1..J6 chain once, reparenting the CAD link groups into it.
  const rig = useMemo(() => {
    if (!scene || !bindMatrices) return null;

    const source = scene.clone(true);
    const base = source.getObjectByName(baseNodeName);
    const links = linkNodeNames.map((name) => source.getObjectByName(name));
    const missing = linkNodeNames.filter((name, i) => !links[i]);

    if (!base || missing.length) {
      const detail = [!base ? baseNodeName : null, ...missing].filter(Boolean).join(", ");
      console.error(
        `[UR3eGLBModel] ${url} is missing required assembly nodes: ${detail}. ` +
          "The GLB must preserve the CAD link groups; refusing to render an unarticulated model."
      );
      onError?.(new Error(`Missing assembly nodes: ${detail}`));
      return null;
    }

    const root = new THREE.Group();
    root.name = "UR3e_rig";

    // The base never moves; its geometry is already in scene coordinates.
    base.position.set(0, 0, 0);
    base.quaternion.identity();
    base.scale.set(1, 1, 1);
    root.add(base);

    const groups = [];
    let parent = root;
    for (let i = 0; i < 6; i += 1) {
      const group = new THREE.Group();
      group.name = `J${i + 1}`;
      // Drawn on the parent, where this joint's axis is stationary.
      if (showJointAxes) parent.add(buildJointAxis(i, dhToScene));
      parent.add(group);

      const link = links[i];
      bindMatrices[i].decompose(link.position, link.quaternion, link.scale);
      group.add(link);

      groups.push(group);
      parent = group;
    }

    root.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Les groupes voyagent avec la racine qu'ils animent, dans le même objet.
    //
    // Écrire `jointGroupsRef.current = groups` ici était un effet de bord dans un
    // useMemo : en StrictMode, React exécute le calcul deux fois et n'en conserve
    // qu'un résultat. La ref désignait alors les groupes d'une copie jetée pendant
    // qu'une autre copie était rendue. useFrame faisait tourner des articulations
    // invisibles, et les liens affichés restaient sur leur matrice de bind, tous
    // ramenés à l'origine : un tas de pièces posé au sol, insensible aux angles.
    return { root, groups };
  }, [scene, bindMatrices, baseNodeName, linkNodeNames, url, onError, showJointAxes, dhToScene]);

  useFrame(() => {
    const groups = rig?.groups;
    if (!groups || !dh) return;

    for (let i = 0; i < 6; i += 1) {
      const degrees = Number(joints[jointKeys[i]] ?? 0) || 0;
      const A = dhMatrix(jointAngleRad(dh[i], degrees), dh[i]);
      // J1 additionally carries the DH -> scene rotation.
      const local = i === 0 ? dhToScene.clone().multiply(A) : A;
      local.decompose(groups[i].position, groups[i].quaternion, groups[i].scale);
    }
  });

  if (!rig) return null;
  return <primitive object={rig.root} />;
}

export default UR3eGLBModel;

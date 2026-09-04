import React, { useRef, useEffect, useState, Suspense } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { OrbitControls, Grid, PerspectiveCamera, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import UR3eGLBModel from "./UR3eGLBModel";

class GLTFErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}

function GLTFRobot({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene.clone()} scale={1} />;
}

function OBJRobot({ url }) {
  const object = useLoader(OBJLoader, url);
  return <primitive object={object} scale={0.7} position={[0, 0.1, 0]} />;
}

/**
 * Robots whose GLB preserves a CAD link hierarchy are driven joint-by-joint
 * from their DH table instead of being dropped in as one rigid object.
 */
function ArticulatedRobot({ url, joints, robot }) {
  const jointKeys = robot.joints?.map((joint) => joint.key) || [];
  return (
    <UR3eGLBModel
      url={url}
      joints={joints}
      jointKeys={jointKeys}
      dh={robot.kinematics?.dh}
      articulation={robot.articulation}
      showJointAxes={Boolean(robot.articulation?.showJointAxes)}
    />
  );
}

function RobotAsset({ assetFile, joints, robot }) {
  const [resolvedUrl, setResolvedUrl] = useState(null);

  useEffect(() => {
    if (!assetFile) {
      setResolvedUrl(null);
      return;
    }

    const normalizedAsset = assetFile.startsWith("/") || assetFile.startsWith("http")
      ? assetFile
      : `/models/${assetFile}`;

    fetch(normalizedAsset, { method: "HEAD" })
      .then((response) => {
        setResolvedUrl(response.ok ? normalizedAsset : null);
      })
      .catch(() => setResolvedUrl(null));
  }, [assetFile]);

  if (!resolvedUrl) {
    return <RobotArm joints={joints} />;
  }

  const isObjAsset = resolvedUrl.toLowerCase().endsWith(".obj");
  const isArticulated =
    !isObjAsset && Boolean(robot?.articulation) && Boolean(robot?.kinematics?.dh);

  return (
    <Suspense fallback={<RobotArm joints={joints} />}>
      <GLTFErrorBoundary fallback={<RobotArm joints={joints} />}>
        {isObjAsset ? (
          <OBJRobot url={resolvedUrl} />
        ) : isArticulated ? (
          <ArticulatedRobot url={resolvedUrl} joints={joints} robot={robot} />
        ) : (
          <GLTFRobot url={resolvedUrl} />
        )}
      </GLTFErrorBoundary>
    </Suspense>
  );
}

/**
 * RobotArm3D Component - Renders a 6-axis robot arm in 3D
 * Each joint is a sphere, segments are cylinders
 */
function RobotArm({ joints }) {
  const groupRef = useRef();
  const segmentRefs = useRef([]);

  // Segment lengths (in mm, converted to scene units)
  const SCALE = 0.001; // 1mm = 0.001 scene units
  const segments = [
    { length: 90, name: "base" }, // Base height
    { length: 320, name: "upperArm" }, // Upper arm
    { length: 280, name: "forearm" }, // Forearm
    { length: 90, name: "wrist" }, // Wrist
  ];

  useFrame(() => {
    if (!groupRef.current) return;

    // J1: Base rotation (around Z-axis)
    groupRef.current.rotation.z = (joints.j1 * Math.PI) / 180;

    // Apply rotations to each segment based on joint angles
    if (segmentRefs.current[0]) {
      // J2: Shoulder (upper arm rotation around its axis)
      segmentRefs.current[0].rotation.x = (joints.j2 * Math.PI) / 180;
    }
    if (segmentRefs.current[1]) {
      // J3: Elbow (forearm rotation)
      segmentRefs.current[1].rotation.x = (joints.j3 * Math.PI) / 180;
    }
    if (segmentRefs.current[2]) {
      // J4: Wrist 1
      segmentRefs.current[2].rotation.x = (joints.j4 * Math.PI) / 180;
    }
    // J5, J6 would continue the wrist rotations but simplified for now
  });

  return (
    <group ref={groupRef}>
      {/* Base - Fixed cylinder */}
      <mesh position={[0, segments[0].length * SCALE * 0.5, 0]}>
        <cylinderGeometry args={[0.03, 0.03, segments[0].length * SCALE, 16]} />
        <meshStandardMaterial color="#475569" />
      </mesh>

      {/* Joint 1 - Sphere at base */}
      <mesh position={[0, segments[0].length * SCALE, 0]}>
        <sphereGeometry args={[0.04, 32, 32]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0ea5e9"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Upper Arm Segment */}
      <group
        ref={(el) => (segmentRefs.current[0] = el)}
        position={[0, segments[0].length * SCALE, 0]}
      >
        {/* Segment cylinder */}
        <mesh position={[0, segments[1].length * SCALE * 0.5, 0]}>
          <cylinderGeometry
            args={[0.025, 0.025, segments[1].length * SCALE, 16]}
          />
          <meshStandardMaterial color="#475569" />
        </mesh>

        {/* Joint 2 - Sphere */}
        <mesh position={[0, segments[1].length * SCALE, 0]}>
          <sphereGeometry args={[0.038, 32, 32]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0ea5e9"
            emissiveIntensity={0.3}
          />
        </mesh>

        {/* Forearm Segment */}
        <group
          ref={(el) => (segmentRefs.current[1] = el)}
          position={[0, segments[1].length * SCALE, 0]}
        >
          {/* Segment cylinder */}
          <mesh position={[0, segments[2].length * SCALE * 0.5, 0]}>
            <cylinderGeometry
              args={[0.022, 0.022, segments[2].length * SCALE, 16]}
            />
            <meshStandardMaterial color="#475569" />
          </mesh>

          {/* Joint 3 - Sphere */}
          <mesh position={[0, segments[2].length * SCALE, 0]}>
            <sphereGeometry args={[0.036, 32, 32]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#0ea5e9"
              emissiveIntensity={0.3}
            />
          </mesh>

          {/* Wrist Segment */}
          <group
            ref={(el) => (segmentRefs.current[2] = el)}
            position={[0, segments[2].length * SCALE, 0]}
          >
            {/* Segment cylinder */}
            <mesh position={[0, segments[3].length * SCALE * 0.5, 0]}>
              <cylinderGeometry
                args={[0.02, 0.02, segments[3].length * SCALE, 16]}
              />
              <meshStandardMaterial color="#475569" />
            </mesh>

            {/* TCP - Tool Center Point (End Effector) */}
            <mesh position={[0, segments[3].length * SCALE, 0]}>
              <sphereGeometry args={[0.025, 32, 32]} />
              <meshStandardMaterial
                color="#f59e0b"
                emissive="#f59e0b"
                emissiveIntensity={0.6}
              />
            </mesh>

            {/* End effector visualization */}
            <mesh position={[0, segments[3].length * SCALE + 0.05, 0]}>
              <coneGeometry args={[0.015, 0.04, 16]} />
              <meshStandardMaterial color="#ec4899" />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

/**
 * Camera framing is derived from the robot instead of being fixed, so arms of
 * different sizes are all shown at the same apparent size. The UR3e spans
 * 0.92 m from base to flange and the UR5e 1.31 m, so a distance tuned for one
 * runs the other off the top of the canvas.
 */
const FALLBACK_SPAN_M = 0.9;
// Kept from the original fixed camera: only its distance from the arm changes.
const VIEW_DIRECTION = new THREE.Vector3(0.5, 0.5, 0.8).normalize();

function robotSpanMeters(robot) {
  const k = robot?.kinematics;
  if (!k) return FALLBACK_SPAN_M;
  // Legacy entries state their lengths in millimetres and carry defaultScale.
  const scale = Number.isFinite(k.defaultScale) ? k.defaultScale : 1;
  const span =
    [k.baseHeight, k.upperArmLength, k.forearmLength, k.wristLength, k.toolLength, k.flangeLength]
      .filter((value) => Number.isFinite(value))
      .reduce((total, value) => total + value, 0) * scale;
  return span > 0 ? span : FALLBACK_SPAN_M;
}

function framingFor(robot) {
  const span = robotSpanMeters(robot);
  const distance = span * 1.6;
  return {
    span,
    distance,
    // Aim at mid-arm height rather than the floor, so the reach above the
    // shoulder and the base below it get an equal share of the viewport.
    target: [0, span * 0.45, 0],
    position: VIEW_DIRECTION.toArray().map((axis) => axis * distance),
  };
}

/**
 * Scene Setup with lights and environment
 */
function SceneContent({ joints, assetFile, robot, framing }) {
  const { camera } = useThree();
  const [camX, camY, camZ] = framing.position;
  const [targetX, targetY, targetZ] = framing.target;

  useEffect(() => {
    // Position camera
    camera.position.set(camX, camY, camZ);
    camera.lookAt(targetX, targetY, targetZ);
  }, [camera, camX, camY, camZ, targetX, targetY, targetZ]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[1, 2, 2]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-1, 1, 1]} intensity={0.4} />

      {/* Grid and axes helpers */}
      <Grid
        args={[framing.span * 2.2, framing.span * 2.2]}
        cellSize={0.1}
        cellColor="#334155"
        sectionSize={0.5}
        sectionColor="#0ea5e9"
        fadeDistance={framing.distance * 1.1}
        fadeStrength={0.5}
      />

      {/* Robot arm */}
      <RobotAsset assetFile={assetFile} joints={joints} robot={robot} />

      {/* Base platform */}
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <boxGeometry args={[0.3, 0.04, 0.3]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </>
  );
}

/**
 * RobotCanvas3D - Main 3D Canvas Component
 */
export default function RobotCanvas3D({ joints = {}, assetFile = null, robotName = "Robot", robot = null }) {
  const defaultJoints = {
    j1: 0,
    j2: -35,
    j3: 60,
    j4: -20,
    j5: 30,
    j6: 0,
    ...joints,
  };

  const framing = framingFor(robot);

  return (
    <div style={{ width: "100%", height: "100%", background: "#0b0f17" }}>
      <Canvas
        shadows
        gl={{ antialias: true, alpha: true }}
        style={{ background: "#0b0f17" }}
      >
        <PerspectiveCamera makeDefault position={framing.position} />
        <SceneContent joints={defaultJoints} assetFile={assetFile} robotName={robotName} robot={robot} framing={framing} />
        <OrbitControls
          target={framing.target}
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          autoRotate={false}
          autoRotateSpeed={0}
        />
      </Canvas>
    </div>
  );
}

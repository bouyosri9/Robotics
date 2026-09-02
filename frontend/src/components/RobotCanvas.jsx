import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function RobotCanvas({ joints = [0, 0, 0, 0, 0, 0] }) {
  const mountRef = useRef(null);
  const jointsRef = useRef([]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f19);

    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(3, 3, 3);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    const material = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.3, roughness: 0.4 });

    const baseGroup = new THREE.Group();
    scene.add(baseGroup);

    const baseGeo = new THREE.CylinderGeometry(0.4, 0.5, 0.4, 32);
    const baseMesh = new THREE.Mesh(baseGeo, material);
    baseMesh.position.y = 0.2;
    baseGroup.add(baseMesh);

    const j1Group = new THREE.Group();
    j1Group.position.y = 0.4;
    baseGroup.add(j1Group);

    const arm1Geo = new THREE.BoxGeometry(0.3, 1.0, 0.3);
    const arm1Mesh = new THREE.Mesh(arm1Geo, material);
    arm1Mesh.position.y = 0.5;
    j1Group.add(arm1Mesh);

    const j2Group = new THREE.Group();
    j2Group.position.y = 1.0;
    j1Group.add(j2Group);

    const arm2Geo = new THREE.BoxGeometry(0.25, 0.9, 0.25);
    const arm2Mesh = new THREE.Mesh(arm2Geo, material);
    arm2Mesh.position.y = 0.45;
    j2Group.add(arm2Mesh);

    const j3Group = new THREE.Group();
    j3Group.position.y = 0.9;
    j2Group.add(j3Group);

    const arm3Geo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    const arm3Mesh = new THREE.Mesh(arm3Geo, material);
    arm3Mesh.position.y = 0.35;
    j3Group.add(arm3Mesh);

    jointsRef.current = [j1Group, j2Group, j3Group];

    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    if (jointsRef.current[0]) jointsRef.current[0].rotation.y = toRad(joints[0] || 0);
    if (jointsRef.current[1]) jointsRef.current[1].rotation.z = toRad(joints[1] || 0);
    if (jointsRef.current[2]) jointsRef.current[2].rotation.z = toRad(joints[2] || 0);
  }, [joints]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%', minHeight: '450px' }} />;
}

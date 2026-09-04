export const ROBOT_DEFINITIONS = {
  ur3e: {
    id: "ur3e",
    manufacturer: "Universal Robots",
    name: "UR3e",
    dof: 6,
    family: "e-Series",
    model: { url: "/models/ur3e.glb" },
    joints: [
      { id: "J1", key: "j1", label: "J1", min: -360, max: 360, default: 0, maxVelocity: 180, type: "revolute", continuous: true },
      { id: "J2", key: "j2", label: "J2", min: -360, max: 360, default: -90, maxVelocity: 180, type: "revolute", continuous: true },
      { id: "J3", key: "j3", label: "J3", min: -160, max: 160, default: 90, maxVelocity: 180, type: "revolute" },
      { id: "J4", key: "j4", label: "J4", min: -360, max: 360, default: -90, maxVelocity: 360, type: "revolute", continuous: true },
      { id: "J5", key: "j5", label: "J5", min: -360, max: 360, default: 90, maxVelocity: 360, type: "revolute", continuous: true },
      { id: "J6", key: "j6", label: "J6", min: -360, max: 360, default: 0, maxVelocity: 360, type: "revolute", continuous: true },
    ],
    kinematics: {
      baseHeight: 0.15185,
      upperArmLength: 0.24355,
      forearmLength: 0.2132,
      wristLength: 0.13105,
      toolLength: 0.08535,
      flangeLength: 0.0921,
      defaultScale: 1,
      // theta carries the standard UR joint offsets, so joint angles mean what
      // the teach pendant means: all-zeros is the arm standing straight up.
      dh: [
        { joint: 1, theta: 0, a: 0, d: 0.15185, alpha: Math.PI / 2 },
        { joint: 2, theta: -Math.PI / 2, a: -0.24355, d: 0, alpha: 0 },
        { joint: 3, theta: 0, a: -0.2132, d: 0, alpha: 0 },
        { joint: 4, theta: -Math.PI / 2, a: 0, d: 0.13105, alpha: Math.PI / 2 },
        { joint: 5, theta: 0, a: 0, d: 0.08535, alpha: -Math.PI / 2 },
        { joint: 6, theta: 0, a: 0, d: 0.0921, alpha: 0 },
      ],
    },
    /**
     * Rigging metadata for /models/ur3e.glb, which is converted from
     * models/UR3e.step by FreeCAD and keeps the CAD assembly intact.
     *
     * The GLB bakes geometry in world coordinates at the pose the CAD was
     * authored in (arm straight up). referencePoseDeg is the joint vector that
     * reproduces that pose under the `dh` table above, and dhToScene is the
     * rotation taking the DH frame (Z-up) to the scene frame (Y-up).
     *
     * Both were solved against the link origins measured from the STEP file and
     * agree to 0.00 mm on every independently constrained frame, so the rendered
     * arm and computeForwardKinematics() cannot disagree.
     */
    articulation: {
      type: "dh-rig",
      baseNode: "L0_base",
      linkNodes: [
        "L1_shoulder",
        "L2_upper_arm",
        "L3_forearm",
        "L4_wrist_1",
        "L5_wrist_2",
        "L6_wrist_3",
      ],
      // With the UR theta offsets above, all-zeros is the arm-up pose the CAD
      // was authored in, so the GLB binds at the origin of the joint ranges.
      referencePoseDeg: [0, 0, 0, 0, 0, 0],
      // Row-major 3x3: (x, y, z)_dh -> (-x, z, y)_scene
      dhToScene: [-1, 0, 0, 0, 0, 1, 0, 1, 0],
      // Flip to true to draw a coloured line through each J1-J6 rotation axis.
      showJointAxes: false,
    },
    motion: {
      maxAngularVelocityDegPerSec: 180,
      accelerationDegPerSec2: "TODO: requires verified manufacturer data",
      smoothing: 0.18,
    },
    specifications: {
      payload: 3,
      payloadKg: 3,
      reach: 500,
      reachMm: 500,
      repeatability: "±0.03 mm",
      repeatabilityMm: 0.03,
      weight: 11.2,
      weightKg: 11.2,
      axes: 6,
      maxTcpSpeed: 3,
      maxTcpSpeedMs: 3,
      dof: 6,
    },
    features: {
      vision: false,
      ai: false,
      collaborative: true,
    },
    presets: {
      home: [0, -90, 90, -90, 90, 0],
      demo: [30, -60, 120, -45, 75, 15],
    },
    asset: "ur3e.glb",
  },
  ur5e: {
    id: "ur5e",
    manufacturer: "Universal Robots",
    name: "UR5e",
    dof: 6,
    family: "e-Series",
    model: { url: "/models/ur5e.glb" },
    // Limits and velocities follow the UR3e entry above (same e-Series
    // convention in this codebase); only the kinematics below are measured.
    joints: [
      { id: "J1", key: "j1", label: "J1", min: -360, max: 360, default: 0, maxVelocity: 180, type: "revolute", continuous: true },
      { id: "J2", key: "j2", label: "J2", min: -360, max: 360, default: -90, maxVelocity: 180, type: "revolute", continuous: true },
      { id: "J3", key: "j3", label: "J3", min: -160, max: 160, default: 90, maxVelocity: 180, type: "revolute" },
      { id: "J4", key: "j4", label: "J4", min: -360, max: 360, default: -90, maxVelocity: 180, type: "revolute", continuous: true },
      { id: "J5", key: "j5", label: "J5", min: -360, max: 360, default: 90, maxVelocity: 180, type: "revolute", continuous: true },
      { id: "J6", key: "j6", label: "J6", min: -360, max: 360, default: 0, maxVelocity: 210, type: "revolute", continuous: true },
    ],
    /**
     * Measured from frontend/public/models/UR5e.step, not taken from a
     * datasheet. The joint bores in the CAD put J2 at Y=162.5, J3 at Y=587.5,
     * J4 at Y=979.7 and J6 at Y=1079.4 mm, with the J5 axis offset 133.3 mm and
     * the flange face 99.6 mm past the wrist centre, giving the table below.
     * They match UR5e's published link lengths, giving the 850 mm reach.
     */
    kinematics: {
      baseHeight: 0.1625,
      upperArmLength: 0.425,
      forearmLength: 0.3922,
      wristLength: 0.1333,
      toolLength: 0.0997,
      flangeLength: 0.0996,
      defaultScale: 1,
      // theta carries the standard UR joint offsets, so joint angles mean what
      // the teach pendant means: all-zeros is the arm standing straight up.
      dh: [
        { joint: 1, theta: 0, a: 0, d: 0.1625, alpha: Math.PI / 2 },
        { joint: 2, theta: -Math.PI / 2, a: -0.425, d: 0, alpha: 0 },
        { joint: 3, theta: 0, a: -0.3922, d: 0, alpha: 0 },
        { joint: 4, theta: -Math.PI / 2, a: 0, d: 0.1333, alpha: Math.PI / 2 },
        { joint: 5, theta: 0, a: 0, d: 0.0997, alpha: -Math.PI / 2 },
        { joint: 6, theta: 0, a: 0, d: 0.0996, alpha: 0 },
      ],
    },
    /**
     * Rigging metadata for /models/ur5e.glb, converted from UR5e.step by
     * tools/step_to_glb.py, which keeps the CAD assembly intact.
     *
     * Same scheme as UR3e, with one difference: the UR5e STEP was authored with
     * the arm facing the opposite way, so dhToScene is the UR3e matrix turned
     * 180 degrees about Y. Reusing the UR3e matrix unchanged places the J5 axis
     * 266.6 mm off (twice the 133.3 mm offset, mirrored), which would swing the
     * whole wrist about a line that misses the real one. With the matrix below
     * all six axes land on the bores measured from the STEP to 0.00 mm.
     */
    articulation: {
      type: "dh-rig",
      baseNode: "L0_base",
      linkNodes: [
        "L1_shoulder",
        "L2_upper_arm",
        "L3_forearm",
        "L4_wrist_1",
        "L5_wrist_2",
        "L6_wrist_3",
      ],
      referencePoseDeg: [0, 0, 0, 0, 0, 0],
      // Row-major 3x3: (x, y, z)_dh -> (x, z, -y)_scene
      dhToScene: [1, 0, 0, 0, 0, 1, 0, -1, 0],
      // Flip to true to draw a coloured line through each J1-J6 rotation axis.
      showJointAxes: false,
    },
    motion: {
      maxAngularVelocityDegPerSec: 180,
      accelerationDegPerSec2: "TODO: requires verified manufacturer data",
      smoothing: 0.18,
    },
    // Reach follows from the measured link lengths. The rest still needs
    // manufacturer data rather than a guess.
    specifications: {
      payload: 7,
      payloadKg: 7,
      reach: 850,
      reachMm: 850,
      repeatability: "unknown",
      weight: "unknown",
      axes: 6,
      maxTcpSpeed: "unknown",
      dof: 6,
    },
    features: {
      vision: false,
      ai: false,
      collaborative: true,
    },
    presets: {
      home: [0, -90, 90, -90, 90, 0],
      demo: [30, -60, 120, -45, 75, 15],
    },
    asset: "ur5e.glb",
  },
  ur10e: {
    id: "ur10e",
    manufacturer: "Universal Robots",
    name: "UR10e",
    dof: 6,
    family: "e-Series",
    model: { url: "/models/ur10e.glb" },
    // Limits and velocities follow the UR3e/UR5e entries (same e-Series
    // convention in this codebase); only the kinematics below are measured.
    joints: [
      { id: "J1", key: "j1", label: "J1", min: -360, max: 360, default: 0, maxVelocity: 180, type: "revolute", continuous: true },
      { id: "J2", key: "j2", label: "J2", min: -360, max: 360, default: -90, maxVelocity: 180, type: "revolute", continuous: true },
      { id: "J3", key: "j3", label: "J3", min: -160, max: 160, default: 90, maxVelocity: 180, type: "revolute" },
      { id: "J4", key: "j4", label: "J4", min: -360, max: 360, default: -90, maxVelocity: 180, type: "revolute", continuous: true },
      { id: "J5", key: "j5", label: "J5", min: -360, max: 360, default: 90, maxVelocity: 180, type: "revolute", continuous: true },
      { id: "J6", key: "j6", label: "J6", min: -360, max: 360, default: 0, maxVelocity: 210, type: "revolute", continuous: true },
    ],
    /**
     * Measured from frontend/public/models/UR10e.step, not taken from a
     * datasheet. The joint bores in the CAD put J2 at Y=180.70, J3 at Y=793.40,
     * J4 at Y=1364.95 and J6 at Y=1484.80 mm, with the J5 axis offset 174.15 mm
     * and the flange face 116.55 mm past the wrist centre, giving the table
     * below -- the published UR10e link lengths.
     *
     * That identification matters: this CAD arrived under the name UR12e.step
     * and was renamed by hand. The lengths above are UR10e's, not UR12e's
     * (which is a shorter arm), so the geometry, not the filename, is what
     * says which robot this is.
     */
    kinematics: {
      baseHeight: 0.1807,
      upperArmLength: 0.6127,
      forearmLength: 0.57155,
      wristLength: 0.17415,
      toolLength: 0.11985,
      flangeLength: 0.11655,
      defaultScale: 1,
      // theta carries the standard UR joint offsets, so joint angles mean what
      // the teach pendant means: all-zeros is the arm standing straight up.
      dh: [
        { joint: 1, theta: 0, a: 0, d: 0.1807, alpha: Math.PI / 2 },
        { joint: 2, theta: -Math.PI / 2, a: -0.6127, d: 0, alpha: 0 },
        { joint: 3, theta: 0, a: -0.57155, d: 0, alpha: 0 },
        { joint: 4, theta: -Math.PI / 2, a: 0, d: 0.17415, alpha: Math.PI / 2 },
        { joint: 5, theta: 0, a: 0, d: 0.11985, alpha: -Math.PI / 2 },
        { joint: 6, theta: 0, a: 0, d: 0.11655, alpha: 0 },
      ],
    },
    /**
     * Rigging metadata for /models/ur10e.glb, converted from UR10e.step by
     * tools/step_to_glb.py, which keeps the CAD assembly intact.
     *
     * This arm is authored the same way round as the UR5e, so it takes that
     * matrix and an all-zero reference pose: every axis lands on its measured
     * bore to 0.00 mm. J5 needed the flange to settle, as it did for UR15 --
     * J6 is parallel to J4 at this pose, so the axes alone allow 0 or -180.
     * At 0 the flange lands on the measured face exactly; at -180 it points
     * back down the arm and misses by 233.1 mm.
     */
    articulation: {
      type: "dh-rig",
      baseNode: "L0_base",
      linkNodes: [
        "L1_shoulder",
        "L2_upper_arm",
        "L3_forearm",
        "L4_wrist_1",
        "L5_wrist_2",
        "L6_wrist_3",
      ],
      referencePoseDeg: [0, 0, 0, 0, 0, 0],
      // Row-major 3x3: (x, y, z)_dh -> (x, z, -y)_scene
      dhToScene: [1, 0, 0, 0, 0, 1, 0, -1, 0],
      // Flip to true to draw a coloured line through each J1-J6 rotation axis.
      showJointAxes: false,
    },
    motion: {
      maxAngularVelocityDegPerSec: 180,
      accelerationDegPerSec2: "TODO: requires verified manufacturer data",
      smoothing: 0.18,
    },
    // Payload follows UR's naming convention (UR10e -> 10 kg... 12.5 kg on the
    // current datasheet) and reach is the catalogue envelope, consistent with
    // the measured link lengths. The rest still needs manufacturer data.
    specifications: {
      payload: 12.5,
      payloadKg: 12.5,
      reach: 1300,
      reachMm: 1300,
      repeatability: "unknown",
      weight: "unknown",
      axes: 6,
      maxTcpSpeed: "unknown",
      dof: 6,
    },
    features: {
      vision: false,
      ai: false,
      collaborative: true,
    },
    presets: {
      home: [0, -90, 90, -90, 90, 0],
      demo: [30, -60, 120, -45, 75, 15],
    },
    asset: "ur10e.glb",
  },
  ur15: {
    id: "ur15",
    manufacturer: "Universal Robots",
    name: "UR15",
    dof: 6,
    family: "UR Series",
    model: { url: "/models/ur15.glb" },
    // Velocities follow the UR3e/UR20 entries (same convention in this
    // codebase). J3 is +/-360 rather than +/-160 for the same reason as UR30:
    // the CAD is authored with the elbow at 167 deg. Only the kinematics
    // below are measured.
    joints: [
      { id: "J1", key: "j1", label: "J1", min: -360, max: 360, default: 0, maxVelocity: 180, type: "revolute", continuous: true },
      { id: "J2", key: "j2", label: "J2", min: -360, max: 360, default: -90, maxVelocity: 180, type: "revolute", continuous: true },
      { id: "J3", key: "j3", label: "J3", min: -360, max: 360, default: 90, maxVelocity: 180, type: "revolute", continuous: true },
      { id: "J4", key: "j4", label: "J4", min: -360, max: 360, default: -90, maxVelocity: 180, type: "revolute", continuous: true },
      { id: "J5", key: "j5", label: "J5", min: -360, max: 360, default: 90, maxVelocity: 180, type: "revolute", continuous: true },
      { id: "J6", key: "j6", label: "J6", min: -360, max: 360, default: 0, maxVelocity: 210, type: "revolute", continuous: true },
    ],
    /**
     * Measured from frontend/public/models/UR15.step, not taken from a
     * datasheet. Like UR30 this STEP is authored posed, so the table below was
     * solved from the joint bores rather than read off them: J2 and J3 are
     * parallel 647.50 mm apart, J3 and J4 parallel 516.40 mm apart, the wrist
     * axes perpendicular and intersecting. d6 is the flange face 143.40 mm
     * past the wrist centre, which lands it at x=325.80 -- the outer edge of
     * the wrist 3 casting, to 0.01 mm.
     */
    kinematics: {
      baseHeight: 0.2186,
      upperArmLength: 0.6475,
      forearmLength: 0.5164,
      wristLength: 0.1824,
      toolLength: 0.1361,
      flangeLength: 0.1434,
      defaultScale: 1,
      // theta carries the standard UR joint offsets, so joint angles mean what
      // the teach pendant means: all-zeros is the arm standing straight up.
      dh: [
        { joint: 1, theta: 0, a: 0, d: 0.2186, alpha: Math.PI / 2 },
        { joint: 2, theta: -Math.PI / 2, a: -0.6475, d: 0, alpha: 0 },
        { joint: 3, theta: 0, a: -0.5164, d: 0, alpha: 0 },
        { joint: 4, theta: -Math.PI / 2, a: 0, d: 0.1824, alpha: Math.PI / 2 },
        { joint: 5, theta: 0, a: 0, d: 0.1361, alpha: -Math.PI / 2 },
        { joint: 6, theta: 0, a: 0, d: 0.1434, alpha: 0 },
      ],
    },
    /**
     * Rigging metadata for /models/ur15.glb, converted from UR15.step by
     * tools/step_to_glb.py, which keeps the CAD assembly intact.
     *
     * As with UR30 the CAD is posed, so referencePoseDeg has to undo that pose
     * rather than an all-zero one. One wrinkle is specific to this arm: J6 is
     * parallel to J4 in the CAD pose, so the axis lines alone leave J5 free
     * between 0 and -180 -- both put every axis on its bore. The flange breaks
     * the tie. At J5=0 the tool points +X and the flange lands on the measured
     * face to 0.01 mm; at -180 it points the other way and misses by 286.8 mm.
     */
    articulation: {
      type: "dh-rig",
      baseNode: "L0_base",
      linkNodes: [
        "L1_shoulder",
        "L2_upper_arm",
        "L3_forearm",
        "L4_wrist_1",
        "L5_wrist_2",
        "L6_wrist_3",
      ],
      // The CAD pose, not a home pose. J6 is unconstrained (the wrist 3 casting
      // is a body of revolution about J6), so it stays at 0.
      referencePoseDeg: [-90, -101, 167, -170, 0, 0],
      // Row-major 3x3: (x, y, z)_dh -> (-x, z, y)_scene
      dhToScene: [-1, 0, 0, 0, 0, 1, 0, 1, 0],
      // Flip to true to draw a coloured line through each J1-J6 rotation axis.
      showJointAxes: false,
    },
    motion: {
      maxAngularVelocityDegPerSec: 180,
      accelerationDegPerSec2: "TODO: requires verified manufacturer data",
      smoothing: 0.18,
    },
    // Payload follows UR's naming convention (UR15 -> 15 kg) and reach is the
    // catalogue envelope. The rest still needs manufacturer data.
    specifications: {
      payload: 15,
      payloadKg: 15,
      reach: 1300,
      reachMm: 1300,
      repeatability: "unknown",
      weight: "unknown",
      axes: 6,
      maxTcpSpeed: "unknown",
      dof: 6,
    },
    features: {
      vision: false,
      ai: false,
      collaborative: true,
    },
    presets: {
      home: [0, -90, 90, -90, 90, 0],
      demo: [30, -60, 120, -45, 75, 15],
    },
    asset: "ur15.glb",
  },
  ur20: {
    id: "ur20",
    manufacturer: "Universal Robots",
    name: "UR20",
    dof: 6,
    family: "UR Series",
    model: { url: "/models/ur20.glb" },
    // Limits and velocities follow the UR3e/UR5e entries (same e-Series
    // convention in this codebase); only the kinematics below are measured.
    joints: [
      { id: "J1", key: "j1", label: "J1", min: -360, max: 360, default: 0, maxVelocity: 180, type: "revolute", continuous: true },
      { id: "J2", key: "j2", label: "J2", min: -360, max: 360, default: -90, maxVelocity: 180, type: "revolute", continuous: true },
      { id: "J3", key: "j3", label: "J3", min: -160, max: 160, default: 90, maxVelocity: 180, type: "revolute" },
      { id: "J4", key: "j4", label: "J4", min: -360, max: 360, default: -90, maxVelocity: 180, type: "revolute", continuous: true },
      { id: "J5", key: "j5", label: "J5", min: -360, max: 360, default: 90, maxVelocity: 180, type: "revolute", continuous: true },
      { id: "J6", key: "j6", label: "J6", min: -360, max: 360, default: 0, maxVelocity: 210, type: "revolute", continuous: true },
    ],
    /**
     * Measured from frontend/public/models/UR20.step, not taken from a
     * datasheet. The joint bores in the CAD put J2 at Y=236.3, J3 at Y=1098.3,
     * J4 at Y=1827.0 and J6 at Y=1986.3 mm, with the J5 axis offset 201.0 mm
     * and the flange face 154.3 mm past the wrist centre, giving the table
     * below -- the published UR20 link lengths, to 0.1 mm.
     */
    kinematics: {
      baseHeight: 0.2363,
      upperArmLength: 0.862,
      forearmLength: 0.7287,
      wristLength: 0.201,
      toolLength: 0.1593,
      flangeLength: 0.1543,
      defaultScale: 1,
      // theta carries the standard UR joint offsets, so joint angles mean what
      // the teach pendant means: all-zeros is the arm standing straight up.
      dh: [
        { joint: 1, theta: 0, a: 0, d: 0.2363, alpha: Math.PI / 2 },
        { joint: 2, theta: -Math.PI / 2, a: -0.862, d: 0, alpha: 0 },
        { joint: 3, theta: 0, a: -0.7287, d: 0, alpha: 0 },
        { joint: 4, theta: -Math.PI / 2, a: 0, d: 0.201, alpha: Math.PI / 2 },
        { joint: 5, theta: 0, a: 0, d: 0.1593, alpha: -Math.PI / 2 },
        { joint: 6, theta: 0, a: 0, d: 0.1543, alpha: 0 },
      ],
    },
    /**
     * Rigging metadata for /models/ur20.glb, converted from UR20.step by
     * tools/step_to_glb.py, which keeps the CAD assembly intact.
     *
     * The UR20 STEP is authored facing the same way as the UR3e one, so it
     * reuses the UR3e matrix rather than the UR5e one. That is not a guess:
     * solving both against the measured bores puts the UR5e matrix 402.0 mm
     * off at J5 (twice the 201.0 mm offset, mirrored), while the matrix below
     * lands all six axes on the bores to 0.00 mm.
     */
    articulation: {
      type: "dh-rig",
      baseNode: "L0_base",
      linkNodes: [
        "L1_shoulder",
        "L2_upper_arm",
        "L3_forearm",
        "L4_wrist_1",
        "L5_wrist_2",
        "L6_wrist_3",
      ],
      referencePoseDeg: [0, 0, 0, 0, 0, 0],
      // Row-major 3x3: (x, y, z)_dh -> (-x, z, y)_scene
      dhToScene: [-1, 0, 0, 0, 0, 1, 0, 1, 0],
      // Flip to true to draw a coloured line through each J1-J6 rotation axis.
      showJointAxes: false,
    },
    motion: {
      maxAngularVelocityDegPerSec: 180,
      accelerationDegPerSec2: "TODO: requires verified manufacturer data",
      smoothing: 0.18,
    },
    // Payload follows UR's naming convention (UR20 -> 20 kg) and reach is the
    // catalogue envelope, consistent with the measured link lengths being
    // UR20's. The rest still needs manufacturer data rather than a guess.
    specifications: {
      payload: 20,
      payloadKg: 20,
      reach: 1750,
      reachMm: 1750,
      repeatability: "unknown",
      weight: "unknown",
      axes: 6,
      maxTcpSpeed: "unknown",
      dof: 6,
    },
    features: {
      vision: false,
      ai: false,
      collaborative: true,
    },
    presets: {
      home: [0, -90, 90, -90, 90, 0],
      demo: [30, -60, 120, -45, 75, 15],
    },
    asset: "ur20.glb",
  },
  ur30: {
    id: "ur30",
    manufacturer: "Universal Robots",
    name: "UR30",
    dof: 6,
    family: "UR Series",
    model: { url: "/models/ur30.glb" },
    // Velocities follow the UR3e/UR20 entries (same convention in this
    // codebase). J3 is +/-360 rather than the +/-160 those two carry: the CAD
    // is authored with the elbow at 165.3 deg, so +/-160 is provably too tight
    // for this arm. Only the kinematics below are measured.
    joints: [
      { id: "J1", key: "j1", label: "J1", min: -360, max: 360, default: 0, maxVelocity: 180, type: "revolute", continuous: true },
      { id: "J2", key: "j2", label: "J2", min: -360, max: 360, default: -90, maxVelocity: 180, type: "revolute", continuous: true },
      { id: "J3", key: "j3", label: "J3", min: -360, max: 360, default: 90, maxVelocity: 180, type: "revolute", continuous: true },
      { id: "J4", key: "j4", label: "J4", min: -360, max: 360, default: -90, maxVelocity: 180, type: "revolute", continuous: true },
      { id: "J5", key: "j5", label: "J5", min: -360, max: 360, default: 90, maxVelocity: 180, type: "revolute", continuous: true },
      { id: "J6", key: "j6", label: "J6", min: -360, max: 360, default: 0, maxVelocity: 210, type: "revolute", continuous: true },
    ],
    /**
     * Measured from frontend/public/models/UR30.step, not taken from a
     * datasheet. Unlike the UR3e/UR20 STEPs this one is authored posed rather
     * than straight up, so the axes are not aligned with X/Y/Z and the table
     * below was solved from the joint bores rather than read off them:
     * J2 and J3 are parallel 637.00 mm apart, J3 and J4 parallel 503.70 mm
     * apart, J4/J5 and J5/J6 perpendicular and intersecting. d6 is the
     * 4896 mm^2 flange plane normal to J6, 154.30 mm past the wrist centre.
     */
    kinematics: {
      baseHeight: 0.2363,
      upperArmLength: 0.637,
      forearmLength: 0.5037,
      wristLength: 0.201,
      toolLength: 0.1593,
      flangeLength: 0.1543,
      defaultScale: 1,
      // theta carries the standard UR joint offsets, so joint angles mean what
      // the teach pendant means: all-zeros is the arm standing straight up.
      dh: [
        { joint: 1, theta: 0, a: 0, d: 0.2363, alpha: Math.PI / 2 },
        { joint: 2, theta: -Math.PI / 2, a: -0.637, d: 0, alpha: 0 },
        { joint: 3, theta: 0, a: -0.5037, d: 0, alpha: 0 },
        { joint: 4, theta: -Math.PI / 2, a: 0, d: 0.201, alpha: Math.PI / 2 },
        { joint: 5, theta: 0, a: 0, d: 0.1593, alpha: -Math.PI / 2 },
        { joint: 6, theta: 0, a: 0, d: 0.1543, alpha: 0 },
      ],
    },
    /**
     * Rigging metadata for /models/ur30.glb, converted from UR30.step by
     * tools/step_to_glb.py, which keeps the CAD assembly intact.
     *
     * referencePoseDeg is load-bearing here in a way it is not for the other
     * robots: the UR30 CAD is authored posed, so the bind offsets have to undo
     * that pose rather than an all-zero one. Leaving it at zeros scatters the
     * links. The angles below were solved against the measured bores together
     * with dhToScene, and put all six axes on them to within 0.008 mm.
     */
    articulation: {
      type: "dh-rig",
      baseNode: "L0_base",
      linkNodes: [
        "L1_shoulder",
        "L2_upper_arm",
        "L3_forearm",
        "L4_wrist_1",
        "L5_wrist_2",
        "L6_wrist_3",
      ],
      // The CAD pose, not a home pose. J6 is unconstrained by the bores (the
      // wrist 3 casting is a body of revolution about J6), so it stays at 0.
      referencePoseDeg: [111, -106, 165.281, -162, -8, 0],
      // Row-major 3x3: (x, y, z)_dh -> (-x, z, y)_scene
      dhToScene: [-1, 0, 0, 0, 0, 1, 0, 1, 0],
      // Flip to true to draw a coloured line through each J1-J6 rotation axis.
      showJointAxes: false,
    },
    motion: {
      maxAngularVelocityDegPerSec: 180,
      accelerationDegPerSec2: "TODO: requires verified manufacturer data",
      smoothing: 0.18,
    },
    // Payload follows UR's naming convention (UR30 -> 30 kg) and reach is the
    // catalogue envelope. The rest still needs manufacturer data.
    specifications: {
      payload: 30,
      payloadKg: 30,
      reach: 1300,
      reachMm: 1300,
      repeatability: "unknown",
      weight: "unknown",
      axes: 6,
      maxTcpSpeed: "unknown",
      dof: 6,
    },
    features: {
      vision: false,
      ai: false,
      collaborative: true,
    },
    presets: {
      home: [0, -90, 90, -90, 90, 0],
      demo: [30, -60, 120, -45, 75, 15],
    },
    asset: "ur30.glb",
  },
  zu5: {
    id: "zu5",
    manufacturer: "JAKA",
    name: "Zu 5",
    dof: 6,
    family: "Zu",
    model: { url: "/models/zu5.glb" },
    joints: [
      { id: "J1", key: "j1", label: "J1", min: -180, max: 180, default: 0, maxVelocity: 130 },
      { id: "J2", key: "j2", label: "J2", min: -180, max: 180, default: -48, maxVelocity: 130 },
      { id: "J3", key: "j3", label: "J3", min: -170, max: 170, default: 68, maxVelocity: 130 },
      { id: "J4", key: "j4", label: "J4", min: -180, max: 180, default: -35, maxVelocity: 170 },
      { id: "J5", key: "j5", label: "J5", min: -180, max: 180, default: 42, maxVelocity: 170 },
      { id: "J6", key: "j6", label: "J6", min: -360, max: 360, default: 0, maxVelocity: 200 },
    ],
    kinematics: {
      baseHeight: 90,
      upperArmLength: 280,
      forearmLength: 290,
      wristLength: 95,
      defaultScale: 0.001,
    },
    motion: {
      maxAngularVelocityDegPerSec: 128,
      accelerationDegPerSec2: 82,
      smoothing: 0.18,
    },
    specifications: {
      payload: 5,
      reach: 954,
      repeatability: "±0.03 mm",
      weight: "28 kg",
      axes: 6,
      maxTcpSpeed: "1.8 m/s",
    },
    features: {
      vision: false,
      ai: false,
      collaborative: true,
    },
    presets: {
      home: [0, -48, 68, -35, 42, 0],
      demo: [30, -80, 100, -60, 60, 15],
    },
    asset: "zu5.glb",
  },
  zu12: {
    id: "zu12",
    manufacturer: "JAKA",
    name: "Zu 12",
    dof: 6,
    family: "Zu",
    model: { url: "/models/zu12.glb" },
    joints: [
      { id: "J1", key: "j1", label: "J1", min: -180, max: 180, default: 0, maxVelocity: 140 },
      { id: "J2", key: "j2", label: "J2", min: -180, max: 180, default: -52, maxVelocity: 140 },
      { id: "J3", key: "j3", label: "J3", min: -170, max: 170, default: 72, maxVelocity: 140 },
      { id: "J4", key: "j4", label: "J4", min: -180, max: 180, default: -40, maxVelocity: 180 },
      { id: "J5", key: "j5", label: "J5", min: -180, max: 180, default: 45, maxVelocity: 180 },
      { id: "J6", key: "j6", label: "J6", min: -360, max: 360, default: 0, maxVelocity: 200 },
    ],
    kinematics: {
      baseHeight: 100,
      upperArmLength: 330,
      forearmLength: 360,
      wristLength: 110,
      defaultScale: 0.001,
    },
    motion: {
      maxAngularVelocityDegPerSec: 140,
      accelerationDegPerSec2: 90,
      smoothing: 0.17,
    },
    specifications: {
      payload: 12,
      reach: 1327,
      repeatability: "±0.03 mm",
      weight: "36 kg",
      axes: 6,
      maxTcpSpeed: "2.0 m/s",
    },
    features: {
      vision: false,
      ai: false,
      collaborative: true,
    },
    presets: {
      home: [0, -52, 72, -40, 45, 0],
      demo: [35, -85, 110, -65, 65, 18],
    },
    asset: "zu12.glb",
  },
  zu18: {
    id: "zu18",
    manufacturer: "JAKA",
    name: "Zu 18",
    dof: 6,
    family: "Zu",
    model: { url: "/models/zu18.glb" },
    joints: [
      { id: "J1", key: "j1", label: "J1", min: -180, max: 180, default: 0, maxVelocity: 145 },
      { id: "J2", key: "j2", label: "J2", min: -180, max: 180, default: -55, maxVelocity: 145 },
      { id: "J3", key: "j3", label: "J3", min: -170, max: 170, default: 80, maxVelocity: 145 },
      { id: "J4", key: "j4", label: "J4", min: -180, max: 180, default: -45, maxVelocity: 185 },
      { id: "J5", key: "j5", label: "J5", min: -180, max: 180, default: 50, maxVelocity: 185 },
      { id: "J6", key: "j6", label: "J6", min: -360, max: 360, default: 0, maxVelocity: 210 },
    ],
    kinematics: {
      baseHeight: 105,
      upperArmLength: 350,
      forearmLength: 390,
      wristLength: 115,
      defaultScale: 0.001,
    },
    motion: {
      maxAngularVelocityDegPerSec: 150,
      accelerationDegPerSec2: 95,
      smoothing: 0.17,
    },
    specifications: {
      payload: 18,
      reach: 1073,
      repeatability: "±0.04 mm",
      weight: "38 kg",
      axes: 6,
      maxTcpSpeed: "2.1 m/s",
    },
    features: {
      vision: false,
      ai: false,
      collaborative: true,
    },
    presets: {
      home: [0, -55, 80, -45, 50, 0],
      demo: [40, -90, 120, -70, 70, 20],
    },
    asset: "zu18.glb",
  },
  ai7: {
    id: "ai7",
    manufacturer: "JAKA",
    name: "Ai 7",
    dof: 6,
    family: "Ai",
    model: { url: "/models/ai7.glb" },
    joints: [
      { id: "J1", key: "j1", label: "J1", min: -180, max: 180, default: 0, maxVelocity: 135 },
      { id: "J2", key: "j2", label: "J2", min: -180, max: 180, default: -50, maxVelocity: 135 },
      { id: "J3", key: "j3", label: "J3", min: -170, max: 170, default: 72, maxVelocity: 135 },
      { id: "J4", key: "j4", label: "J4", min: -180, max: 180, default: -38, maxVelocity: 175 },
      { id: "J5", key: "j5", label: "J5", min: -180, max: 180, default: 45, maxVelocity: 175 },
      { id: "J6", key: "j6", label: "J6", min: -360, max: 360, default: 0, maxVelocity: 200 },
    ],
    kinematics: {
      baseHeight: 95,
      upperArmLength: 300,
      forearmLength: 320,
      wristLength: 105,
      defaultScale: 0.001,
    },
    motion: {
      maxAngularVelocityDegPerSec: 145,
      accelerationDegPerSec2: 92,
      smoothing: 0.17,
    },
    specifications: {
      payload: 7,
      reach: "unknown",
      repeatability: "unknown",
      weight: "unknown",
      axes: 6,
      maxTcpSpeed: "unknown",
    },
    features: {
      vision: true,
      ai: true,
      collaborative: true,
    },
    presets: {
      home: [0, -50, 72, -38, 45, 0],
      demo: [32, -82, 106, -62, 62, 16],
    },
    asset: "ai7.glb",
  },
  minicobo: {
    id: "minicobo",
    manufacturer: "JAKA",
    name: "MiniCobo",
    dof: 6,
    family: "Mini",
    model: { url: "/models/minicobo.glb" },
    joints: [
      { id: "J1", key: "j1", label: "J1", min: -180, max: 180, default: 0, maxVelocity: 120 },
      { id: "J2", key: "j2", label: "J2", min: -180, max: 180, default: -42, maxVelocity: 120 },
      { id: "J3", key: "j3", label: "J3", min: -170, max: 170, default: 60, maxVelocity: 120 },
      { id: "J4", key: "j4", label: "J4", min: -180, max: 180, default: -30, maxVelocity: 170 },
      { id: "J5", key: "j5", label: "J5", min: -180, max: 180, default: 36, maxVelocity: 170 },
      { id: "J6", key: "j6", label: "J6", min: -360, max: 360, default: 0, maxVelocity: 180 },
    ],
    kinematics: {
      baseHeight: 70,
      upperArmLength: 220,
      forearmLength: 240,
      wristLength: 80,
      defaultScale: 0.001,
    },
    motion: {
      maxAngularVelocityDegPerSec: 110,
      accelerationDegPerSec2: 74,
      smoothing: 0.2,
    },
    specifications: {
      payload: "unknown",
      reach: "unknown",
      repeatability: "unknown",
      weight: "unknown",
      axes: 6,
      maxTcpSpeed: "unknown",
    },
    features: {
      vision: false,
      ai: false,
      collaborative: true,
    },
    presets: {
      home: [0, -42, 60, -30, 36, 0],
      demo: [25, -70, 90, -55, 55, 10],
    },
    asset: "minicobo.glb",
  },
  lumi: {
    id: "lumi",
    manufacturer: "JAKA",
    name: "Lumi",
    dof: 12,
    family: "AI",
    model: { url: "/models/lumi.glb" },
    joints: [
      { id: "J1", key: "j1", label: "J1", min: -180, max: 180, default: 0, maxVelocity: 110 },
      { id: "J2", key: "j2", label: "J2", min: -180, max: 180, default: -45, maxVelocity: 110 },
      { id: "J3", key: "j3", label: "J3", min: -170, max: 170, default: 65, maxVelocity: 110 },
      { id: "J4", key: "j4", label: "J4", min: -180, max: 180, default: -35, maxVelocity: 160 },
      { id: "J5", key: "j5", label: "J5", min: -180, max: 180, default: 40, maxVelocity: 160 },
      { id: "J6", key: "j6", label: "J6", min: -360, max: 360, default: 0, maxVelocity: 180 },
      { id: "J7", key: "j7", label: "J7", min: -180, max: 180, default: 0, maxVelocity: 120 },
      { id: "J8", key: "j8", label: "J8", min: -180, max: 180, default: 0, maxVelocity: 120 },
      { id: "J9", key: "j9", label: "J9", min: -180, max: 180, default: 0, maxVelocity: 120 },
      { id: "J10", key: "j10", label: "J10", min: -180, max: 180, default: 0, maxVelocity: 120 },
      { id: "J11", key: "j11", label: "J11", min: -180, max: 180, default: 0, maxVelocity: 120 },
      { id: "J12", key: "j12", label: "J12", min: -180, max: 180, default: 0, maxVelocity: 120 },
    ],
    kinematics: {
      baseHeight: 100,
      upperArmLength: 260,
      forearmLength: 260,
      wristLength: 90,
      defaultScale: 0.001,
    },
    motion: {
      maxAngularVelocityDegPerSec: 120,
      accelerationDegPerSec2: 80,
      smoothing: 0.22,
    },
    specifications: {
      payload: "unknown",
      reach: "unknown",
      repeatability: "unknown",
      weight: "unknown",
      axes: 12,
      maxTcpSpeed: "unknown",
    },
    features: {
      vision: true,
      ai: true,
      collaborative: true,
      aiSimulation: true,
    },
    presets: {
      home: [0, -45, 65, -35, 40, 0, 0, 0, 0, 0, 0, 0],
      demo: [22, -60, 80, -45, 52, 12, 8, -12, 16, -10, 12, -8],
    },
    asset: "lumi.glb",
  },
};

export const ROBOT_LIST = Object.values(ROBOT_DEFINITIONS);

/**
 * Accent colour per manufacturer. The UI derives every brand-tinted surface
 * from this map, so a new manufacturer only needs one entry here.
 */
export const MANUFACTURER_ACCENTS = {
  JAKA: "#22b8cf",
  "Universal Robots": "#ff8a3d",
  default: "#4dabf7",
};

export function getManufacturerAccent(manufacturer) {
  return MANUFACTURER_ACCENTS[manufacturer] || MANUFACTURER_ACCENTS.default;
}

export function getRobotDefinition(robotId) {
  return ROBOT_DEFINITIONS[robotId] || ROBOT_DEFINITIONS.ur5e;
}

export function getDefaultJointValues(robot) {
  if (!robot?.joints) return {};
  return robot.joints.reduce((acc, joint) => {
    acc[joint.key] = joint.default ?? 0;
    return acc;
  }, {});
}

export function getRobotBrandGroups() {
  return ROBOT_LIST.reduce((groups, robot) => {
    const key = robot.manufacturer;
    if (!groups[key]) {
      groups[key] = { name: key, accent: getManufacturerAccent(key), robots: [] };
    }
    groups[key].robots.push(robot);
    return groups;
  }, {});
}

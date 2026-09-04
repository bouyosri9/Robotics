# -*- coding: utf-8 -*-
"""
Universal Robots STEP -> GLB converter (FreeCAD 1.1, headless).

Usage (Windows):
    set STEP2GLB_ROBOT=ur5e
    "%LOCALAPPDATA%\\Programs\\FreeCAD 1.1\\bin\\freecadcmd.exe" tools/step_to_glb.py

    STEP2GLB_ROBOT     which ROBOTS entry to build (default: ur3e)
    STEP2GLB_INSPECT   set to 1 to only report the assembly, writing no GLB

Reads  frontend/public/models/<Source>.step
Writes frontend/public/models/<robot>.glb
       tools/<robot>_analysis.json   (per-solid report + measured joint bore axes)

The CAD assembly is preserved: one glTF node per link group
(L0_base .. L6_wrist_3), each holding one child node per original CAD solid.
Geometry is baked in world coordinates at the pose the CAD was authored in
(arm straight up), converted from millimetres to metres, Y-up -- already the
convention shared by these STEP files and glTF.

Adding a robot means adding a ROBOTS entry, whose "links" table names the CAD
products making up each link. Those names are not guessable and differ per
model: UR3e ships readable ones (Link1_UR3), UR5e ships catalogue numbers
(C-1000248). Run the inspection pass first and read the assembly off the
geometry instead of guessing:

    set STEP2GLB_ROBOT=ur5e & set STEP2GLB_INSPECT=1 & freecadcmd tools/step_to_glb.py

It groups the solids by product and orders them along +Y, which is the kinematic
order for an arm authored straight up.

Two things worth knowing before editing this file:

1. Do NOT use Part.Face.tessellate(). It returns a cached triangulation and
   silently ignores the deflection you pass, which yields ~4.4M triangles and a
   106 MB GLB. MeshPart.meshFromShape honours the settings: the same model comes
   out at 225k triangles / 4.8 MB at a *finer* 0.30 mm deflection.

2. Normals use a crease angle rather than global smoothing, so tangent-continuous
   fillets shade smoothly while genuine edges stay sharp.

The importer refuses to write anything if a solid cannot be mapped to a link, so
a partial or flattened result fails loudly instead of shipping silently.
"""
import json, math, os, struct, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MODELS = os.path.join(ROOT, "frontend", "public", "models")

# "links" entries are (glTF node, material key, [CAD product name fragments]).
# None means the assembly has not been identified yet: run the inspection pass.
ROBOTS = {
    "ur3e": {
        "step": "UR3e.step",
        "root": "UR3e",
        "links": [
            ("L0_base",      "base",     ["Base_UR3"]),
            ("L1_shoulder",  "shoulder", ["Link1_UR3"]),
            ("L2_upper_arm", "upperarm", ["Link2_UR3"]),
            ("L3_forearm",   "forearm",  ["Link3_UR3"]),
            ("L4_wrist_1",   "wrist1",   ["Link4_UR3"]),
            ("L5_wrist_2",   "wrist2",   ["Link5_UR3"]),
            ("L6_wrist_3",   "wrist3",   ["C-2007033"]),
        ],
    },
    # UR5e names every part by catalogue number, so the mapping below was read
    # off the geometry (tools/ur5e_solids.json), not off the labels. Each moving
    # link is pinned by carrying the bores of *both* joints it sits between:
    #
    #   J1  axis Y through x=0, z=0        J4  axis Z at Y=979.7
    #   J2  axis Z at Y=162.5              J5  axis Y through z=133.3
    #   J3  axis Z at Y=587.5              J6  axis Z at Y=1079.4
    #
    # which also states the kinematics: d1=162.5, a2=425, a3=392.2, d4=133.3,
    # d5=99.7 mm -- UR5e reuses UR5e's link lengths exactly.
    "ur5e": {
        "step": "UR5e.step",
        "root": "UR5e",
        "links": [
            # C-1000257 .. C-1000272 is the contiguous block of fixed hardware
            # bolted to the pedestal (C-1000259): connector panel, clamps, feet.
            # None of it carries a joint bore, so it all rides with the base.
            ("L0_base",      "base",     ["C-10002%d" % n for n in range(57, 73)]),
            ("L1_shoulder",  "shoulder", ["C-1000248"]),
            ("L2_upper_arm", "upperarm", ["C-1000249"]),
            ("L3_forearm",   "forearm",  ["C-1000250"]),
            ("L4_wrist_1",   "wrist1",   ["C-1000251"]),
            # C-1000274 is a 3 mm plate centred on the J5 axis and coplanar with
            # the bottom of C-2007861, carrying J5 bores and nothing else, so it
            # is an interface piece between wrist 1 and wrist 2. It is placed on
            # the wrist 2 side; if J5 ever shears it away from the housing, move
            # it to L4_wrist_1 -- those are the only two possibilities.
            ("L5_wrist_2",   "wrist2",   ["C-2007861", "C-1000274"]),
            ("L6_wrist_3",   "wrist3",   ["C-2007038"]),
        ],
    },
    # UR20 also names its parts by catalogue number, so this mapping was read
    # off the geometry (tools/ur20_solids.json). Each moving link carries the
    # bores of both joints it sits between:
    #
    #   J1  axis Y through x=0, z=0        J4  axis Z at Y=1827.0
    #   J2  axis Z at Y=236.3              J5  axis Y through z=-201.0
    #   J3  axis Z at Y=1098.3             J6  axis Z at Y=1986.3
    #
    # which states the kinematics: d1=236.3, a2=862.0, a3=728.7, d4=201.0,
    # d5=159.3, d6=154.3 mm -- the published UR20 table, to 0.1 mm.
    "ur20": {
        "step": "UR20.step",
        "root": "UR20",
        "links": [
            # 1005866 is a small bracket sitting at Y=-15.5..30.3, bolted to the
            # pedestal and carrying no joint bore, so it rides with the base.
            ("L0_base",      "base",     ["C-2003903", "1005866"]),
            ("L1_shoulder",  "shoulder", ["C-2003904"]),
            ("L2_upper_arm", "upperarm", ["C-2003905"]),
            ("L3_forearm",   "forearm",  ["C-2003906"]),
            ("L4_wrist_1",   "wrist1",   ["C-2003907"]),
            ("L5_wrist_2",   "wrist2",   ["C-2003908"]),
            ("L6_wrist_3",   "wrist3",   ["C-2006871"]),
        ],
    },
    # UR30 differs from the others in two ways worth knowing.
    #
    # First, it is authored POSED, not straight up, so the products do not stack
    # along +Y and the inspection pass cannot be read top to bottom. The links
    # below were identified by which joint bores they share, not by Y order.
    # Solving the chain against those bores gives the CAD pose that
    # robotDefinitions.ur30.articulation.referencePoseDeg carries.
    #
    # Second, the upper arm and forearm are each three solids -- two end
    # castings plus the tube between them (the 704-* parts) -- where UR20 has
    # one apiece. UR30 does reuse UR20's base, shoulder and both wrist castings.
    #
    #   J1  axis Y through x=0, z=0                    J4  through (64.3, 318.0, 167.4)
    #   J2  through (0, 236.3, 0), dir (0.934,0,-.358) J5  through (-123.4, 318.0, 239.4)
    #   J3  through (219.5, 60.7, 571.6)               J6  through (-67.7, 283.0, 384.5)
    #
    # giving d1=236.3, a2=637.0, a3=503.7, d4=201.0, d5=159.3 mm, and d6=154.3
    # from the flange face (the 4896 mm^2 plane normal to J6).
    "ur30": {
        "step": "UR30.step",
        "root": "UR30",
        "links": [
            # 1005866 is the same base bracket the UR20 carries: no joint bore,
            # so it rides with the base.
            ("L0_base",      "base",     ["C-2003903", "1005866"]),
            ("L1_shoulder",  "shoulder", ["C-2003904"]),
            # C-2007307 holds the J2 bore, C-2007308 the J3 bore, and
            # 704-251-01 is the r=90 tube joining them.
            ("L2_upper_arm", "upperarm", ["C-2007307", "C-2007308", "704-251-01"]),
            # C-2007310 holds the J3 bore, C-2007311 the J4 bore, and
            # 704-250-01 is the r=75 tube joining them.
            ("L3_forearm",   "forearm",  ["C-2007310", "C-2007311", "704-250-01"]),
            ("L4_wrist_1",   "wrist1",   ["C-2003907"]),
            ("L5_wrist_2",   "wrist2",   ["C-2003908"]),
            ("L6_wrist_3",   "wrist3",   ["C-2007588"]),
        ],
    },
    # UR15 is one casting per link like UR20, but authored POSED like UR30, so
    # the products do not stack along +Y. Note the J3 and J4 bores are NOT in
    # the six largest cylinders this script reports, so the inspection output
    # alone does not identify this arm -- the pairs below were confirmed by
    # matching bore radius on the full face list (J3 r=60 on the y=95.05,
    # z=-635.60 line; J4 r=45 on the y=305.09, z=-163.85 line).
    #
    #   J1  axis Y through x=0, z=0        J4  axis X at y=305.1, z=-163.9
    #   J2  axis X at y=218.6, z=0         J5  through (182.4, 292.2, -215.4)
    #   J3  axis X at y=95.1, z=-635.6     J6  axis X at y=272.2, z=-295.9
    #
    # giving d1=218.6, a2=647.5, a3=516.4, d4=182.4, d5=136.1 mm, and d6=143.4
    # to the flange face -- which lands at x=325.80, the wrist 3 bbox edge.
    "ur15": {
        "step": "UR15.step",
        "root": "UR15",
        "links": [
            # 1005866 is the same base bracket UR20 and UR30 carry.
            ("L0_base",      "base",     ["C-2008876", "1005866"]),
            ("L1_shoulder",  "shoulder", ["C-2008877"]),
            ("L2_upper_arm", "upperarm", ["C-2008878"]),
            ("L3_forearm",   "forearm",  ["C-2008879"]),
            ("L4_wrist_1",   "wrist1",   ["C-2008880"]),
            ("L5_wrist_2",   "wrist2",   ["C-2008881"]),
            ("L6_wrist_3",   "wrist3",   ["C-2008882"]),
        ],
    },
    # Not identified yet: run the inspection pass and read the assembly off
    # tools/ur10e_solids.json before filling in "links".
    "ur10e": {
        "step": "UR10e.step",
        "root": "UR10e",
        "links": None,
    },
}

ROBOT = (os.environ.get("STEP2GLB_ROBOT") or "ur3e").strip().lower()
for _arg in sys.argv[1:]:
    if _arg.strip().lower() in ROBOTS:
        ROBOT = _arg.strip().lower()
if ROBOT not in ROBOTS:
    raise SystemExit("Unknown robot %r; known: %s" % (ROBOT, ", ".join(sorted(ROBOTS))))

CFG = ROBOTS[ROBOT]
INSPECT = (os.environ.get("STEP2GLB_INSPECT", "").strip() not in ("", "0")
           or "--inspect" in sys.argv
           or CFG["links"] is None)

STEP = os.path.join(MODELS, CFG["step"])
OUT_GLB = os.path.join(MODELS, ROBOT + ".glb")
OUT_JSON = os.path.join(HERE, ROBOT + "_analysis.json")
OUT_SOLIDS = os.path.join(HERE, ROBOT + "_solids.json")
FCSTD = os.path.join(HERE, ROBOT + ".FCStd")   # import cache; safe to delete

LINEAR_DEFLECTION = 0.30
ANGULAR_DEFLECTION = 0.50
CREASE_COS = math.cos(math.radians(35.0))
MM_TO_M = 0.001

import FreeCAD, MeshPart

HAVE_GUI = False
try:
    import FreeCADGui
    FreeCADGui.setupWithoutGUI()
    HAVE_GUI = True
except Exception as e:
    sys.stderr.write("[warn] GUI layer unavailable (%s)\n" % e)

# Import the STEP once and cache it; re-runs at other deflections are then fast.
t0 = time.time()
if os.path.exists(FCSTD):
    doc = FreeCAD.openDocument(FCSTD)
    sys.stderr.write("[info] reused %s (%.1fs)\n" % (os.path.basename(FCSTD), time.time() - t0))
else:
    try:
        import ImportGui as StepImporter
    except Exception:
        import Import as StepImporter
    p = FreeCAD.ParamGet("User parameter:BaseApp/Preferences/Mod/Import/hSTEP")
    p.SetBool("ReadShapeCompoundMode", False)   # keep solids separate
    p.SetBool("UseLinkGroup", True)             # keep the assembly tree
    p.SetBool("ImportHiddenObject", True)
    p.SetBool("UseBaseName", True)
    doc = FreeCAD.newDocument(ROBOT)
    StepImporter.insert(STEP, doc.Name)
    doc.recompute()
    doc.saveAs(FCSTD)
    sys.stderr.write("[info] imported STEP in %.1fs (%d objects)\n" % (time.time() - t0, len(doc.Objects)))

LINK_SPECS = CFG["links"]


def is_solid_feature(o):
    if not hasattr(o, "Shape") or o.Shape is None:
        return False
    try:
        return (not o.Shape.isNull()) and len(o.Shape.Solids) > 0 and o.TypeId == "Part::Feature"
    except Exception:
        return False


features = [o for o in doc.Objects if is_solid_feature(o)]
if not features:
    raise SystemExit("Refusing to export: %s yielded no solids" % CFG["step"])


def product_map(objs):
    """Map every solid label to the CAD product it is an instance of.

    FreeCAD uniquifies repeats of a product by appending a counter, keeping the
    first instance unsuffixed ('C-1000248' -> 'C-1000248001'), so the shortest
    label that prefixes a label is its product. Trimming trailing digits instead
    works for UR3e ('..._Solid003' -> '..._Solid') but shreds UR5e's catalogue
    numbers, collapsing the whole arm into a single 'C-' group.
    """
    labels = sorted(set(o.Label for o in objs))
    return dict((l, min((b for b in labels if l.startswith(b)), key=len)) for l in labels)


PRODUCTS = product_map(features)


def product_of(label):
    return PRODUCTS.get(label, label)


def merged_bbox(objs):
    """Bounding box over a whole product, world mm.

    OCC's box is conservative: it bounds the control polygons of the surfaces,
    not the surfaces, so a cylinder of radius R can report +-2R (the UR5e base
    measures +-151 here and +-75.5 once meshed). Good enough to order links
    along the arm, useless as a dimension -- identify links by their bores.
    """
    bb = objs[0].Shape.BoundBox
    lo = [bb.XMin, bb.YMin, bb.ZMin]
    hi = [bb.XMax, bb.YMax, bb.ZMax]
    for o in objs[1:]:
        b = o.Shape.BoundBox
        lo = [min(lo[0], b.XMin), min(lo[1], b.YMin), min(lo[2], b.ZMin)]
        hi = [max(hi[0], b.XMax), max(hi[1], b.YMax), max(hi[2], b.ZMax)]
    return [round(v, 2) for v in lo], [round(v, 2) for v in hi]


def cylinder_report(shape):
    """Large cylindrical faces -> measured joint bore axes, world mm."""
    out = []
    for f in shape.Faces:
        if f.Surface.__class__.__name__ != "Cylinder":
            continue
        try:
            r = float(f.Surface.Radius)
        except Exception:
            continue
        if r < 12.0:
            continue
        ax, ce = f.Surface.Axis, f.Surface.Center
        out.append({"radius": round(r, 3), "area": round(f.Area, 1),
                    "axis": [round(ax.x, 4), round(ax.y, 4), round(ax.z, 4)],
                    "center": [round(ce.x, 3), round(ce.y, 3), round(ce.z, 3)]})
    out.sort(key=lambda d: -d["area"])
    return out[:6]


if INSPECT:
    # Identifying an assembly only needs placement and bores, so no meshing here:
    # this pass answers "which product is which link" in seconds, not minutes.
    groups = {}
    for o in features:
        groups.setdefault(product_of(o.Label), []).append(o)

    report = []
    for name, objs in groups.items():
        lo, hi = merged_bbox(objs)
        report.append({"product": name, "solids": len(objs),
                       "labels": sorted(o.Label for o in objs),
                       "bbox_mm": {"min": lo, "max": hi},
                       "y_span_mm": [lo[1], hi[1]],
                       "cylinders": cylinder_report(objs[0].Shape)})
    report.sort(key=lambda r: r["y_span_mm"][0])

    with open(OUT_SOLIDS, "w") as fh:
        json.dump({"robot": ROBOT, "source_step": STEP,
                   "total_solids": len(features), "products": report}, fh, indent=2)

    sys.stderr.write("\n%-44s %6s  %-18s %s\n"
                     % ("PRODUCT (ordered along +Y)", "SOLIDS", "Y SPAN mm", "BBOX min -> max mm (loose)"))
    for r in report:
        sys.stderr.write("%-44s %6d  %-18s %s -> %s\n"
                         % (r["product"][:44], r["solids"],
                            "%.1f .. %.1f" % (r["y_span_mm"][0], r["y_span_mm"][1]),
                            r["bbox_mm"]["min"], r["bbox_mm"]["max"]))
    sys.stderr.write("\n[DONE] inspection only, no GLB written -> %s\n" % OUT_SOLIDS)
    if CFG["links"] is None:
        sys.stderr.write("[next] add a \"links\" table for %r to ROBOTS, then re-run "
                         "without STEP2GLB_INSPECT\n" % ROBOT)
    sys.exit(0)


assigned, links = set(), []
for node_name, short, patterns in LINK_SPECS:
    members = []
    for o in features:
        if o.Name in assigned:
            continue
        if any(pat.lower() in o.Label.lower() for pat in patterns):
            members.append(o)
            assigned.add(o.Name)
    links.append({"node": node_name, "short": short, "objs": members})

orphans = sorted(set(product_of(o.Label) for o in features if o.Name not in assigned))
if orphans:
    raise SystemExit("Refusing to export: unmapped products %s" % orphans)
for L in links:
    if not L["objs"]:
        raise SystemExit("Refusing to export: link %s has no geometry" % L["node"])
sys.stderr.write("[info] %d solids mapped across %d links\n" % (len(features), len(links)))


COLOR_SOURCE = {"step": 0, "default": 0}


def get_color(obj):
    if HAVE_GUI:
        try:
            vo = obj.ViewObject
            dc = list(getattr(vo, "DiffuseColor", []) or [])
            if dc and len(dc[0]) >= 3:
                COLOR_SOURCE["step"] += 1
                c = dc[0]
                return (round(c[0], 4), round(c[1], 4), round(c[2], 4), 1.0)
            sc = getattr(vo, "ShapeColor", None)
            if sc and len(sc) >= 3:
                COLOR_SOURCE["step"] += 1
                return (round(sc[0], 4), round(sc[1], 4), round(sc[2], 4), 1.0)
        except Exception:
            pass
    COLOR_SOURCE["default"] += 1
    return None


def build_mesh(obj):
    """Mesh a solid with crease-angle vertex normals. Positions in metres."""
    m = MeshPart.meshFromShape(Shape=obj.Shape,
                               LinearDeflection=LINEAR_DEFLECTION,
                               AngularDeflection=ANGULAR_DEFLECTION,
                               Relative=False)
    pts, facets = m.Topology
    if not facets:
        return [], [], []

    fnorm = []
    for (a, b, c) in facets:
        p0, p1, p2 = pts[a], pts[b], pts[c]
        ux, uy, uz = p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]
        vx, vy, vz = p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]
        nx, ny, nz = uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx
        ln = math.sqrt(nx * nx + ny * ny + nz * nz)
        fnorm.append((0.0, 0.0, 0.0) if ln < 1e-15 else (nx / ln, ny / ln, nz / ln))

    incident = [[] for _ in pts]
    for fi, (a, b, c) in enumerate(facets):
        incident[a].append(fi)
        incident[b].append(fi)
        incident[c].append(fi)

    positions, normals = [], []
    vmap = [None] * len(pts)
    for vi, fis in enumerate(incident):
        clusters = []
        for fi in fis:
            n = fnorm[fi]
            placed = False
            for cl in clusters:
                s = cl[0]
                ln = math.sqrt(s[0] * s[0] + s[1] * s[1] + s[2] * s[2])
                if ln > 1e-15 and (n[0] * s[0] + n[1] * s[1] + n[2] * s[2]) / ln >= CREASE_COS:
                    cl[0] = (s[0] + n[0], s[1] + n[1], s[2] + n[2])
                    cl[1].append(fi)
                    placed = True
                    break
            if not placed:
                clusters.append([n, [fi]])
        slot = {}
        p = pts[vi]
        for cl in clusters:
            s = cl[0]
            ln = math.sqrt(s[0] * s[0] + s[1] * s[1] + s[2] * s[2])
            nrm = (0.0, 1.0, 0.0) if ln < 1e-15 else (s[0] / ln, s[1] / ln, s[2] / ln)
            idx = len(positions) // 3
            positions.extend((p[0] * MM_TO_M, p[1] * MM_TO_M, p[2] * MM_TO_M))
            normals.extend(nrm)
            for fi in cl[1]:
                slot[fi] = idx
        vmap[vi] = slot

    indices = []
    for fi, (a, b, c) in enumerate(facets):
        indices.extend((vmap[a][fi], vmap[b][fi], vmap[c][fi]))
    return positions, normals, indices


class Glb(object):
    def __init__(self):
        self.bin = bytearray()
        self.bufferViews, self.accessors = [], []
        self.meshes, self.nodes, self.materials = [], [], []

    def _view(self, data, target):
        while len(self.bin) % 4:
            self.bin.append(0)
        off = len(self.bin)
        self.bin.extend(data)
        self.bufferViews.append({"buffer": 0, "byteOffset": off,
                                 "byteLength": len(data), "target": target})
        return len(self.bufferViews) - 1

    def add_vec3(self, values, with_bounds):
        bv = self._view(struct.pack("<%df" % len(values), *values), 34962)
        acc = {"bufferView": bv, "componentType": 5126,
               "count": len(values) // 3, "type": "VEC3"}
        if with_bounds:
            xs, ys, zs = values[0::3], values[1::3], values[2::3]
            acc["min"] = [min(xs), min(ys), min(zs)]
            acc["max"] = [max(xs), max(ys), max(zs)]
        self.accessors.append(acc)
        return len(self.accessors) - 1

    def add_indices(self, idx):
        if max(idx) < 65536:
            data, ctype = struct.pack("<%dH" % len(idx), *idx), 5123
        else:
            data, ctype = struct.pack("<%dI" % len(idx), *idx), 5125
        bv = self._view(data, 34963)
        self.accessors.append({"bufferView": bv, "componentType": ctype,
                               "count": len(idx), "type": "SCALAR"})
        return len(self.accessors) - 1

    def add_material(self, name, rgba):
        self.materials.append({"name": name, "doubleSided": False,
                               "pbrMetallicRoughness": {"baseColorFactor": list(rgba),
                                                        "metallicFactor": 0.25,
                                                        "roughnessFactor": 0.55}})
        return len(self.materials) - 1

    def write(self, path, scene_nodes):
        gltf = {"asset": {"version": "2.0",
                          "generator": "FreeCAD 1.1.3 STEP to GLB, %s assembly preserving" % CFG["root"]},
                "scene": 0, "scenes": [{"nodes": scene_nodes}],
                "nodes": self.nodes, "meshes": self.meshes,
                "materials": self.materials, "accessors": self.accessors,
                "bufferViews": self.bufferViews,
                "buffers": [{"byteLength": len(self.bin)}]}
        js = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
        while len(js) % 4:
            js += b" "
        blob = bytes(self.bin)
        while len(blob) % 4:
            blob += b"\x00"
        total = 12 + 8 + len(js) + 8 + len(blob)
        with open(path, "wb") as fh:
            fh.write(struct.pack("<III", 0x46546C67, 2, total))
            fh.write(struct.pack("<II", len(js), 0x4E4F534A))
            fh.write(js)
            fh.write(struct.pack("<II", len(blob), 0x004E4942))
            fh.write(blob)
        return total


# STEP colours are not reachable from a headless FreeCAD, so links fall back to
# UR-like materials. Geometry is untouched CAD either way.
DEFAULT_RGBA = {
    "base":     (0.29, 0.31, 0.34, 1.0),
    "shoulder": (0.83, 0.84, 0.86, 1.0),
    "upperarm": (0.83, 0.84, 0.86, 1.0),
    "forearm":  (0.83, 0.84, 0.86, 1.0),
    "wrist1":   (0.83, 0.84, 0.86, 1.0),
    "wrist2":   (0.83, 0.84, 0.86, 1.0),
    "wrist3":   (0.22, 0.23, 0.25, 1.0),
}

glb = Glb()
analysis = {"source_step": STEP, "units": "metres", "up_axis": "+Y",
            "linear_deflection_mm": LINEAR_DEFLECTION,
            "angular_deflection_rad": ANGULAR_DEFLECTION,
            "crease_angle_deg": 35.0, "links": []}
root_children = []
glb.nodes.append({"name": CFG["root"], "children": root_children})

total_tris = 0
t0 = time.time()
for L in links:
    child_nodes, info = [], {"node": L["node"], "solids": []}
    for i, obj in enumerate(L["objs"]):
        pos, nrm, idx = build_mesh(obj)
        if not idx:
            sys.stderr.write("[warn] no geometry for %s\n" % obj.Label)
            continue
        rgba = get_color(obj) or DEFAULT_RGBA[L["short"]]
        nm = "%s_solid_%02d" % (L["short"], i)
        mat = glb.add_material(nm + "_mat", rgba)
        a_pos, a_nrm, a_idx = glb.add_vec3(pos, True), glb.add_vec3(nrm, False), glb.add_indices(idx)
        glb.meshes.append({"name": nm + "_mesh",
                           "primitives": [{"attributes": {"POSITION": a_pos, "NORMAL": a_nrm},
                                           "indices": a_idx, "material": mat, "mode": 4}]})
        glb.nodes.append({"name": nm, "mesh": len(glb.meshes) - 1})
        child_nodes.append(len(glb.nodes) - 1)
        bb = obj.Shape.BoundBox
        info["solids"].append({
            "node": nm, "label": obj.Label, "triangles": len(idx) // 3,
            "vertices": len(pos) // 3, "rgba": list(rgba),
            "bbox_mm": {"min": [round(bb.XMin, 2), round(bb.YMin, 2), round(bb.ZMin, 2)],
                        "max": [round(bb.XMax, 2), round(bb.YMax, 2), round(bb.ZMax, 2)]},
            "placement_mm": [round(obj.Placement.Base.x, 4),
                             round(obj.Placement.Base.y, 4),
                             round(obj.Placement.Base.z, 4)],
            "cylinders": cylinder_report(obj.Shape)})
        total_tris += len(idx) // 3
    glb.nodes.append({"name": L["node"], "children": child_nodes})
    root_children.append(len(glb.nodes) - 1)
    info["triangles"] = sum(s["triangles"] for s in info["solids"])
    analysis["links"].append(info)
    sys.stderr.write("[info] %-14s %7d tris / %d solids\n" % (L["node"], info["triangles"], len(child_nodes)))

size = glb.write(OUT_GLB, [0])
analysis["total_triangles"] = total_tris
analysis["glb_bytes"] = size
analysis["color_source"] = dict(COLOR_SOURCE)
with open(OUT_JSON, "w") as fh:
    json.dump(analysis, fh, indent=2)

sys.stderr.write("[info] colours: %d from STEP, %d fallback\n" % (COLOR_SOURCE["step"], COLOR_SOURCE["default"]))
sys.stderr.write("[DONE] %s (%.2f MB, %d triangles, %d nodes, %.0fs)\n"
                 % (OUT_GLB, size / 1048576.0, total_tris, len(glb.nodes), time.time() - t0))

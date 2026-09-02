#!/usr/bin/env python3
"""
Convert STEP CAD file to GLB for web rendering.
Requires: trimesh, pyassimp, or cadquery
"""

import sys
import os
from pathlib import Path

def check_dependencies():
    """Check which CAD/mesh libraries are available."""
    available = {}
    
    libs = {
        'trimesh': 'trimesh',
        'pyassimp': 'pyassimp', 
        'cadquery': 'cadquery',
        'numpy': 'numpy',
        'OCP': 'OCP'
    }
    
    for name, module in libs.items():
        try:
            __import__(module)
            available[name] = True
            print(f"✓ {name} available")
        except ImportError:
            available[name] = False
            print(f"✗ {name} NOT available")
    
    return available

def convert_with_trimesh(step_file, output_file):
    """Convert STEP to GLB using trimesh."""
    try:
        import trimesh
        print(f"\nLoading STEP with trimesh: {step_file}")
        mesh = trimesh.load_mesh(step_file)
        
        if isinstance(mesh, trimesh.Trimesh):
            # Single mesh
            meshes = [mesh]
        else:
            # Scene with multiple meshes
            meshes = mesh.geometry.values() if hasattr(mesh, 'geometry') else [mesh]
        
        # Merge all meshes
        combined = trimesh.util.concatenate(meshes)
        
        print(f"Mesh statistics:")
        print(f"  Vertices: {len(combined.vertices)}")
        print(f"  Faces: {len(combined.faces)}")
        print(f"  Bounds: {combined.bounds}")
        
        # Export to GLB
        combined.export(output_file, file_type='glb')
        print(f"✓ Exported to: {output_file}")
        return True
        
    except Exception as e:
        print(f"✗ trimesh conversion failed: {e}")
        return False

def convert_with_cadquery(step_file, output_file):
    """Convert STEP to GLB using CadQuery."""
    try:
        import cadquery as cq
        print(f"\nLoading STEP with CadQuery: {step_file}")
        
        # Load assembly
        assembly = cq.Assembly.load(step_file)
        print(f"✓ Assembly loaded successfully")
        print(f"Assembly children: {len(assembly.children)}")
        
        # Convert to mesh
        # Note: CadQuery's export to GLB is limited, may need intermediate format
        print("! CadQuery STEP→GLB export not fully supported in this version")
        return False
        
    except Exception as e:
        print(f"✗ CadQuery conversion failed: {e}")
        return False

def main():
    step_file = Path("c:/Users/gigabyte/Desktop/UR3e.step").resolve()
    output_dir = Path("c:/Users/gigabyte/Desktop/robot-collaborative-simulator-main/frontend/public/models")
    output_file = output_dir / "ur3e.glb"
    
    if not step_file.exists():
        print(f"✗ STEP file not found: {step_file}")
        return False
    
    print(f"STEP file: {step_file}")
    print(f"Output: {output_file}\n")
    
    # Check dependencies
    deps = check_dependencies()
    
    # Try conversion methods in order of preference
    success = False
    
    if deps.get('trimesh'):
        success = convert_with_trimesh(str(step_file), str(output_file))
    
    if not success and deps.get('cadquery'):
        success = convert_with_cadquery(str(step_file), str(output_file))
    
    if not success:
        print("\n✗ No suitable conversion library found.")
        print("  Install one of:")
        print("    pip install trimesh pyassimp")
        print("    pip install cadquery")
        return False
    
    return success

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)

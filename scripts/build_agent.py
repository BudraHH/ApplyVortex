
import os
import shutil
import PyInstaller.__main__
import platform

def build():
    print("--- Building ApplyVortex Agent ---")
    
    # Determine OS specific separator
    sep = os.path.sep
    
    # Clean previous builds
    if os.path.exists("dist"): shutil.rmtree("dist")
    if os.path.exists("build"): shutil.rmtree("build")

    # Arguments
    args = [
        'agent/main.py',                # Script
        '--name=ApplyVortexAgent',       # Name
        '--onefile',                    # Single Executable
        '--noconsole',                  # No black terminal window (GUI mode)
        '--clean',                      # Clean cache
        # Include necessary data/assets if any (e.g., config, images)
        # '--add-data=agent/assets;assets', 
    ]
    
    # Run PyInstaller
    PyInstaller.__main__.run(args)
    
    print("\n✅ Build Complete!")
    print(f"Executable is located in: {os.getcwd()}{sep}dist{sep}ApplyVortexAgent")

if __name__ == "__main__":
    build()

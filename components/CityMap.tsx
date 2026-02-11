
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Text, OrbitControls, Environment, Stars, Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Building, LotData, Player, District, BlockData, DecorVariant } from '../types';
import { Map as MapIcon, X, CloudRain, Sun, Moon, Play, Pause, FastForward, Hammer, ArrowDown } from 'lucide-react';
import { LOGO_ICONS } from './UserProfile';

interface CityMapProps {
  buildings: Building[];
  cityLayout: LotData[];
  gridSize: number;
  onLotSelect: (index: number) => void;
  user: Player;
  districts: District[];
  focusedLotIndex: number | null;
  theme: 'CYBER' | 'ISO';
}

const LOT_SIZE = 12;
const ROAD_WIDTH = 2; 
const BLOCK_SCALE_FACTOR = 0.5;
const DAY_DURATION = 120; 

// --- Texture Generators ---

const useFacadeTexture = (color: string, theme: 'CYBER' | 'ISO') => {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (theme === 'ISO') {
        // --- ISO VECTOR ART STYLE ---
        const r = parseInt(color.slice(1,3), 16);
        const g = parseInt(color.slice(3,5), 16);
        const b = parseInt(color.slice(5,7), 16);
        
        let wallColor = color;
        let windowColor = '#2c3e50';
        let style = 'MODERN'; 

        if (r > 200 && g > 150) { 
             wallColor = '#f3d2ac'; 
             windowColor = '#2c3e50';
             style = 'RESIDENTIAL';
        } else if (g > 150 && b > 200) { 
             wallColor = '#76c4ae';
             windowColor = '#a3e4d7';
             style = 'GLASS';
        } else {
             wallColor = '#ecf0f1'; 
             windowColor = '#34495e';
        }

        ctx.fillStyle = wallColor;
        ctx.fillRect(0, 0, 128, 128);

        if (style === 'RESIDENTIAL') {
             ctx.fillStyle = windowColor;
             for(let y=10; y<128; y+=25) {
                 for(let x=10; x<128; x+=25) {
                     ctx.fillRect(x, y, 14, 18);
                 }
             }
        } else if (style === 'GLASS') {
            ctx.fillStyle = windowColor;
            ctx.fillRect(10, 0, 20, 128);
            ctx.fillRect(50, 0, 20, 128);
            ctx.fillRect(90, 0, 20, 128);
        } else {
            ctx.fillStyle = windowColor;
            ctx.fillRect(0, 20, 128, 30);
            ctx.fillRect(0, 80, 128, 30);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(0,0,128, 4);

      } else {
        // --- CYBER STYLE (Night Windows Logic) ---
        // Dark background for the building structure
        ctx.fillStyle = '#0f172a'; // Very dark slate
        ctx.fillRect(0, 0, 128, 128);
        
        // Add subtle noise/texture to wall
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(0, 0, 128, 128);
        ctx.globalAlpha = 1.0;

        const rows = 4;
        const cols = 4;
        const pad = 8;
        const w = (128 - (pad * (cols + 1))) / cols;
        const h = (128 - (pad * (rows + 1))) / rows;

        for(let r=0; r<rows; r++) {
            for(let c=0; c<cols; c++) {
                const rand = Math.random();
                // 50% chance of a light being on
                if (rand > 0.5) {
                    // varied light colors: warm yellow, cool cyan, or standard white
                    if (rand > 0.9) ctx.fillStyle = '#fbbf24'; // bright amber
                    else if (rand > 0.8) ctx.fillStyle = '#38bdf8'; // cyan
                    else ctx.fillStyle = '#fef3c7'; // warm white
                } else {
                    ctx.fillStyle = '#1e293b'; // Dark window (off)
                }
                const x = pad + c * (w + pad);
                const y = pad + r * (h + pad);
                ctx.fillRect(x, y, w, h);
            }
        }
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.LinearFilter; 
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [color, theme]);
}

// --- Cinematic Rain System ---

const Rain = ({ visible, simulationSpeed }: { visible: boolean, simulationSpeed: number }) => {
  const count = 2000;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const splashMesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 200,
        y: Math.random() * 80,
        z: (Math.random() - 0.5) * 200,
        speed: 1.5 + Math.random() * 2,
        offset: Math.random() * 100
      });
    }
    return temp;
  }, []);

  useFrame((state, delta) => {
    if (!mesh.current || !splashMesh.current || !visible) return;
    
    // Adjust logic to use delta * simulationSpeed for smooth variable time
    const speedFactor = simulationSpeed * 60 * delta; // Normalize to 60fps base

    particles.forEach((p, i) => {
      p.y -= p.speed * speedFactor;
      if (p.y < 0) p.y = 80;
      
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(0.02, 1.5, 0.02); 
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);

      if (p.y < 2) {
         dummy.position.set(p.x, 0.1, p.z);
         dummy.scale.set(0.5 * (p.y/2), 0.05, 0.5 * (p.y/2)); 
         dummy.updateMatrix();
         splashMesh.current!.setMatrixAt(i, dummy.matrix);
      } else {
         dummy.scale.set(0,0,0);
         dummy.updateMatrix();
         splashMesh.current!.setMatrixAt(i, dummy.matrix);
      }
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    splashMesh.current.instanceMatrix.needsUpdate = true;
  });

  if (!visible) return null;

  return (
    <group>
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#a5b4fc" transparent opacity={0.3} depthWrite={false} />
        </instancedMesh>
        <instancedMesh ref={splashMesh} args={[undefined, undefined, count]}>
            <ringGeometry args={[0.5, 0.6, 6]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.2} depthWrite={false} side={THREE.DoubleSide} />
        </instancedMesh>
    </group>
  );
};

// --- Ambient Life (Birds & Planes) ---

const AmbientPlane = ({ height, speed, theme, simulationSpeed }: { height: number, speed: number, theme: 'CYBER' | 'ISO', simulationSpeed: number }) => {
    const ref = useRef<THREE.Group>(null);
    const posRef = useRef(0);

    useFrame((state, delta) => {
        if (ref.current) {
            posRef.current += delta * speed * simulationSpeed;
            
            // Fly in a large circle
            ref.current.position.x = (posRef.current % 300) - 150;
            ref.current.position.z = -50 + Math.sin(posRef.current * 0.05) * 20;
            ref.current.position.y = height;
            // Bank slightly
            ref.current.rotation.z = -0.1;
            ref.current.rotation.x = Math.sin(posRef.current * 0.1) * 0.05;
        }
    });

    return (
        <group ref={ref}>
            <mesh rotation={[0, 0, -Math.PI/2]}>
                <capsuleGeometry args={[0.8, 8, 4, 8]} />
                <meshStandardMaterial color={theme === 'ISO' ? '#fff' : '#64748b'} />
            </mesh>
            <mesh position={[0, 0, 0]} scale={[1, 0.1, 4]}>
                <boxGeometry args={[3, 1, 6]} />
                <meshStandardMaterial color={theme === 'ISO' ? '#e2e8f0' : '#475569'} />
            </mesh>
             {theme === 'CYBER' && (
                <>
                    <pointLight position={[-4, 0, 3]} color="green" distance={8} intensity={2} />
                    <pointLight position={[-4, 0, -3]} color="red" distance={8} intensity={2} />
                    <mesh position={[-4.5, 0, 0]} rotation={[0,0,Math.PI/2]}>
                        <coneGeometry args={[0.3, 3, 8]} />
                        <meshBasicMaterial color="cyan" transparent opacity={0.6} />
                    </mesh>
                </>
             )}
        </group>
    );
};

const AmbientBirds = ({ heightRange, theme, simulationSpeed }: { heightRange: [number, number], theme: 'CYBER' | 'ISO', simulationSpeed: number }) => {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const count = 30;
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const [birds] = useState(() => Array.from({length: count}).map(() => ({
        speed: 5 + Math.random() * 5,
        offset: Math.random() * 100,
        yBase: heightRange[0] + Math.random() * (heightRange[1] - heightRange[0]),
        radius: 30 + Math.random() * 30,
        centerX: (Math.random() - 0.5) * 100,
        centerZ: (Math.random() - 0.5) * 100,
    })));

    useFrame((state, delta) => {
        if (!mesh.current) return;
        
        birds.forEach((bird, i) => {
            // Update internal time based on simulation speed
            bird.offset += delta * bird.speed * 0.2 * simulationSpeed;
            
            const t = bird.offset;
            const x = bird.centerX + Math.sin(t) * bird.radius;
            const z = bird.centerZ + Math.cos(t) * bird.radius;
            const y = bird.yBase + Math.sin(t * 3) * 2;
            
            dummy.position.set(x, y, z);
            // Look ahead
            dummy.lookAt(
                bird.centerX + Math.sin(t + 0.1) * bird.radius, 
                y, 
                bird.centerZ + Math.cos(t + 0.1) * bird.radius
            );
            dummy.scale.set(0.8, 0.2, 0.4);
            dummy.updateMatrix();
            mesh.current!.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            <coneGeometry args={[1, 2, 4]} />
            <meshStandardMaterial color={theme === 'ISO' ? '#333' : '#00ffcc'} emissive={theme === 'CYBER' ? '#00ffcc' : '#000'} />
        </instancedMesh>
    );
};

// --- Background City (Skyline) ---
const DistantCity = ({ theme }: { theme: 'CYBER' | 'ISO' }) => {
    const count = 40;
    const dummy = new THREE.Object3D();
    const mesh = useRef<THREE.InstancedMesh>(null);

    useEffect(() => {
        if (mesh.current) {
            for(let i=0; i<count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = 100 + Math.random() * 80;
                const x = Math.sin(angle) * radius;
                const z = Math.cos(angle) * radius;
                const h = 20 + Math.random() * 60;
                
                dummy.position.set(x, h/2 - 10, z);
                dummy.scale.set(5 + Math.random() * 10, h, 5 + Math.random() * 10);
                dummy.updateMatrix();
                mesh.current.setMatrixAt(i, dummy.matrix);
            }
            mesh.current.instanceMatrix.needsUpdate = true;
        }
    }, []);

    const color = theme === 'ISO' ? '#c0d6e4' : '#0f172a';
    const opacity = theme === 'ISO' ? 0.9 : 0.8;

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} fog={true} /> 
        </instancedMesh>
    )
}

// --- Dynamic Props & Drones ---

const Drone = ({ center, simulationSpeed }: { center: [number, number, number], simulationSpeed: number }) => {
    const ref = useRef<THREE.Group>(null);
    const speed = 0.5 + Math.random() * 0.5;
    const radius = 5 + Math.random() * 5;
    const offset = useRef(Math.random() * 100);

    useFrame((state, delta) => {
        if(ref.current) {
            offset.current += delta * speed * simulationSpeed;
            const t = offset.current;
            ref.current.position.x = center[0] + Math.sin(t) * radius;
            ref.current.position.z = center[2] + Math.cos(t) * radius;
            ref.current.position.y = center[1] + Math.sin(t * 2) * 1;
            ref.current.lookAt(center[0], center[1], center[2]);
        }
    });

    return (
        <group ref={ref} position={new THREE.Vector3(...center)}>
            <mesh>
                <sphereGeometry args={[0.2, 8, 8]} />
                <meshBasicMaterial color="#ef4444" />
            </mesh>
            <pointLight distance={5} intensity={1} color="#ef4444" decay={2} />
        </group>
    )
}

const StreetLamp = ({ position, color, on }: { position: [number, number, number], color: string, on: boolean }) => {
  return (
    <group position={new THREE.Vector3(...position)}>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 3]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0.4, 2.8, 0]} rotation={[0, 0, -Math.PI/4]}>
        <cylinderGeometry args={[0.05, 0.05, 0.8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0.7, 2.5, 0]}>
         <boxGeometry args={[0.2, 0.1, 0.2]} />
         <meshStandardMaterial color="#cbd5e1" emissive="#fbbf24" emissiveIntensity={on ? 3 : 0} />
      </mesh>
      {on && (
          <>
            <pointLight position={[0.7, 2.3, 0]} color="#fbbf24" intensity={1} distance={15} decay={2} />
            <mesh position={[0.7, 0, 0]} rotation={[0, 0, 0]}>
                 <cylinderGeometry args={[0.1, 1.5, 5, 16, 1, true]} />
                 <meshBasicMaterial color="#fbbf24" transparent opacity={0.05} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
            </mesh>
          </>
      )}
    </group>
  );
};

const ConstructionCrane = ({ position, height, simulationSpeed }: { position: [number, number, number], height: number, simulationSpeed: number }) => {
    const craneHeight = (height * BLOCK_SCALE_FACTOR) + 4;
    const ref = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if(ref.current) ref.current.rotation.y += delta * 0.2 * simulationSpeed;
    })

    return (
        <group position={new THREE.Vector3(...position)}>
            <mesh position={[0, craneHeight/2, 0]}>
                <boxGeometry args={[0.5, craneHeight, 0.5]} />
                <meshStandardMaterial color="#f59e0b" wireframe />
            </mesh>
            <group position={[0, craneHeight, 0]} ref={ref}>
                 <mesh position={[2, 0, 0]}>
                    <boxGeometry args={[6, 0.5, 0.5]} />
                    <meshStandardMaterial color="#f59e0b" />
                 </mesh>
                 <mesh position={[5, 0, 0]}>
                     <boxGeometry args={[0.2, 0.2, 0.2]} />
                     <meshBasicMaterial color="red" />
                 </mesh>
                 <pointLight position={[5, 0.5, 0]} color="red" distance={5} intensity={2} />
            </group>
        </group>
    )
}

const Pedestrian = ({ startPos, rangeX, rangeZ, speed, simulationSpeed }: { startPos: [number, number, number], rangeX: number, rangeZ: number, speed: number, simulationSpeed: number }) => {
    const mesh = useRef<THREE.Group>(null);
    const offset = useRef(Math.random() * 100);
    
    useFrame((state, delta) => {
        if(!mesh.current) return;
        offset.current += delta * speed * simulationSpeed;
        const time = offset.current;
        const walk = Math.sin(time) * 4; 
        
        if (rangeX > 0) {
            mesh.current.position.x = startPos[0] + walk;
            mesh.current.rotation.y = Math.cos(time) > 0 ? Math.PI/2 : -Math.PI/2;
        } else {
             mesh.current.position.z = startPos[2] + walk;
             mesh.current.rotation.y = Math.cos(time) > 0 ? 0 : Math.PI;
        }
        mesh.current.position.y = 0.25 + Math.abs(Math.sin(time * 3)) * 0.05;
    });

    return (
        <group ref={mesh} position={new THREE.Vector3(...startPos)}>
            <mesh position={[0, 0.3, 0]}>
                <capsuleGeometry args={[0.1, 0.4, 4, 8]} />
                <meshStandardMaterial color="#64748b" />
            </mesh>
        </group>
    )
}

const Car = ({ startPos, axis, speed, range, color, lightsOn, theme, simulationSpeed }: { startPos: [number, number, number], axis: 'x' | 'z', speed: number, range: number, color: string, lightsOn: boolean, theme: 'CYBER' | 'ISO', simulationSpeed: number }) => {
  const mesh = useRef<THREE.Group>(null);
  const positionRef = useRef(0);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    
    positionRef.current += delta * speed * simulationSpeed;
    const movement = positionRef.current % range;
    const pos = movement - (range / 2);

    if (axis === 'x') {
      mesh.current.position.set(startPos[0] + pos, startPos[1], startPos[2]);
      mesh.current.rotation.y = speed > 0 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      mesh.current.position.set(startPos[0], startPos[1], startPos[2] + pos);
      mesh.current.rotation.y = speed > 0 ? 0 : Math.PI;
    }
  });

  return (
    <group ref={mesh}>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.6, 0.4, 1.2]} />
        <meshStandardMaterial color={theme === 'ISO' ? '#ecf0f1' : color} roughness={theme === 'ISO' ? 0.5 : 0.2} metalness={theme === 'ISO' ? 0 : 0.5} />
      </mesh>
      {/* Top of car (Iso bus look) */}
      {theme === 'ISO' && (
          <mesh position={[0, 0.5, 0]}>
               <boxGeometry args={[0.55, 0.1, 1.1]} />
               <meshStandardMaterial color={color} />
          </mesh>
      )}
      
      {lightsOn && (
         <group position={[0, 0.3, 2]} rotation={[-Math.PI/2, 0, 0]}>
            <mesh position={[0.2, 0, 0]}>
                <coneGeometry args={[0.3, 3, 32, 1, true]} />
                <meshBasicMaterial color="#fef08a" transparent opacity={0.15} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>
            <mesh position={[-0.2, 0, 0]}>
                <coneGeometry args={[0.3, 3, 32, 1, true]} />
                <meshBasicMaterial color="#fef08a" transparent opacity={0.15} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>
         </group>
      )}
      {/* Taillights */}
       <mesh position={[0.2, 0.3, -0.55]}><boxGeometry args={[0.1, 0.1, 0.1]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={theme === 'ISO' ? 0 : 2} /></mesh>
       <mesh position={[-0.2, 0.3, -0.55]}><boxGeometry args={[0.1, 0.1, 0.1]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={theme === 'ISO' ? 0 : 2} /></mesh>
    </group>
  );
};

// --- Minimap ---
const Minimap = ({ buildings, layout, gridSize, user, onClose }: any) => {
  return (
    <div className="absolute bottom-6 left-6 w-64 bg-slate-900/90 border border-slate-700 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 z-40">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Strategic Map</h3>
        <button onClick={onClose}><X size={14} className="text-slate-500 hover:text-white" /></button>
      </div>
      <div className="grid gap-1 mb-4" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, aspectRatio: '1/1' }}>
        {Array.from({ length: gridSize * gridSize }).map((_, i) => {
          const lot = layout.find((l: any) => l.index === i);
          const building = buildings.find((b: any) => b.lotIndex === i);
          let bg = '#1e293b';
          if (lot?.type === 'PARK') bg = '#14532d';
          if (lot?.type === 'COMMERCIAL') bg = '#ca8a04';
          if (lot?.type === 'CIVIC') bg = '#2563eb';
          if (building) {
            if (building.ownerId === user.id) bg = '#4ade80';
            else bg = '#ef4444'; 
          }
          return (
            <div key={i} className="rounded-sm transition-colors duration-300 border border-black/20" style={{ backgroundColor: bg, opacity: building ? 1 : 0.6 }} />
          );
        })}
      </div>
    </div>
  );
};

// --- Decoration Buildings ---

const DecorBuilding = ({ variant, theme, nightTime }: { variant: DecorVariant, theme: 'CYBER' | 'ISO', nightTime: boolean }) => {
    const isIso = theme === 'ISO';

    if (variant === 'HOSPITAL') {
        return (
            <group>
                <mesh position={[0, 1.5, 0]}>
                    <boxGeometry args={[6, 3, 6]} />
                    <meshStandardMaterial color={isIso ? '#f8fafc' : '#e2e8f0'} />
                </mesh>
                <mesh position={[0, 3.5, 0]}>
                    <boxGeometry args={[4, 1, 4]} />
                    <meshStandardMaterial color={isIso ? '#e2e8f0' : '#cbd5e1'} />
                </mesh>
                {/* Red Cross */}
                <group position={[0, 4.2, 0]}>
                    <mesh rotation={[0,0,0]}><boxGeometry args={[2, 0.4, 0.4]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={nightTime ? 2 : 0} /></mesh>
                    <mesh rotation={[0,Math.PI/2,0]}><boxGeometry args={[2, 0.4, 0.4]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={nightTime ? 2 : 0} /></mesh>
                </group>
                {/* Helipad */}
                <mesh position={[0, 4.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
                    <circleGeometry args={[1.5, 16]} />
                    <meshStandardMaterial color="#334155" />
                </mesh>
                <mesh position={[0, 4.02, 0]} rotation={[-Math.PI/2, 0, 0]}>
                    <ringGeometry args={[1.2, 1.3, 16]} />
                    <meshBasicMaterial color="#facc15" />
                </mesh>
            </group>
        )
    }

    if (variant === 'SCHOOL') {
        return (
             <group>
                <mesh position={[0, 1, 0]}>
                    <boxGeometry args={[8, 2, 5]} />
                    <meshStandardMaterial color={isIso ? '#eab308' : '#78350f'} />
                </mesh>
                {/* Clock Tower */}
                <mesh position={[2, 2.5, 0]}>
                    <boxGeometry args={[1.5, 3, 1.5]} />
                    <meshStandardMaterial color={isIso ? '#fcd34d' : '#92400e'} />
                </mesh>
                <mesh position={[2, 3, 0.8]}>
                    <circleGeometry args={[0.4, 16]} />
                    <meshStandardMaterial color="#fff" />
                </mesh>
                {/* Flag */}
                <mesh position={[-3, 2.5, 0]}><cylinderGeometry args={[0.05, 0.05, 3]} /><meshStandardMaterial color="#94a3b8" /></mesh>
                <mesh position={[-2.5, 3.5, 0]}><boxGeometry args={[1, 0.6, 0.05]} /><meshStandardMaterial color="#3b82f6" /></mesh>
            </group>
        )
    }

    if (variant === 'TOWN_HALL') {
         return (
             <group>
                {/* Base Steps */}
                <mesh position={[0, 0.2, 0]}>
                    <boxGeometry args={[7, 0.4, 7]} />
                    <meshStandardMaterial color="#94a3b8" />
                </mesh>
                {/* Main Building */}
                <mesh position={[0, 1.5, 0]}>
                    <boxGeometry args={[5, 2.5, 5]} />
                    <meshStandardMaterial color={isIso ? '#f1f5f9' : '#64748b'} />
                </mesh>
                {/* Columns */}
                {[[-2, -2], [2, -2], [-2, 2], [2, 2]].map((pos, i) => (
                    <mesh key={i} position={[pos[0], 1.5, 2.6]}>
                        <cylinderGeometry args={[0.3, 0.3, 2.5]} />
                        <meshStandardMaterial color="#e2e8f0" />
                    </mesh>
                ))}
                {/* Dome */}
                <mesh position={[0, 2.8, 0]}>
                    <sphereGeometry args={[2, 16, 16, 0, Math.PI * 2, 0, Math.PI/2]} />
                    <meshStandardMaterial color={isIso ? '#fcd34d' : '#ca8a04'} metalness={0.5} roughness={0.2} />
                </mesh>
            </group>
         )
    }

    // SHOPS (Small or Large)
    const isLarge = variant === 'SHOP_LARGE';
    const shopColor = isIso ? '#f472b6' : '#be185d';
    
    return (
        <group>
             <mesh position={[0, isLarge ? 1.5 : 1, 0]}>
                <boxGeometry args={[isLarge ? 7 : 4, isLarge ? 3 : 2, isLarge ? 5 : 4]} />
                <meshStandardMaterial color={isIso ? '#fff' : '#1e293b'} />
             </mesh>
             
             {/* Awning */}
             <mesh position={[0, isLarge ? 1.5 : 1.2, 2.1]} rotation={[0.4, 0, 0]}>
                <boxGeometry args={[isLarge ? 7.2 : 4.2, 0.2, 1.5]} />
                <meshStandardMaterial color={shopColor} />
             </mesh>

             {/* Signage */}
             <mesh position={[0, isLarge ? 3.2 : 2.2, 0]}>
                 <boxGeometry args={[isLarge ? 4 : 2, 0.6, 0.2]} />
                 <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={nightTime ? 1.5 : 0} />
             </mesh>

             {/* Windows */}
             <mesh position={[0, isLarge ? 1 : 0.8, 2.51]}>
                 <planeGeometry args={[isLarge ? 6 : 3, isLarge ? 1.5 : 1]} />
                 <meshStandardMaterial color="#bfdbfe" emissive="#bfdbfe" emissiveIntensity={0.5} />
             </mesh>
        </group>
    )
}

// --- 3D Building Components ---

const BuildingBlock: React.FC<{ block: BlockData, ownerColor: string, nightTime: boolean, theme: 'CYBER' | 'ISO' }> = ({ block, ownerColor, nightTime, theme }) => {
    const texture = useFacadeTexture(block.color, theme);
    
    return (
        <mesh 
          position={[
            block.position[0] * BLOCK_SCALE_FACTOR, 
            (block.position[1] + 1) * BLOCK_SCALE_FACTOR, 
            block.position[2] * BLOCK_SCALE_FACTOR
          ]}
          scale={[
            block.size[0] * BLOCK_SCALE_FACTOR, 
            block.size[1] * BLOCK_SCALE_FACTOR, 
            block.size[2] * BLOCK_SCALE_FACTOR
          ]}
        >
          <boxGeometry args={[1, 1, 1]} />
          {/* FIX: Removed overriding emissive color that turned buildings yellow. 
              Now using texture as emissive map so only windows glow. */}
          <meshStandardMaterial 
            map={texture}
            emissiveMap={theme === 'CYBER' ? texture : undefined} // Use texture for glow pattern
            color={theme === 'ISO' ? '#ffffff' : block.color} 
            roughness={theme === 'ISO' ? 0.8 : 0.1}
            metalness={theme === 'ISO' ? 0 : 0.4}
            emissive={theme === 'ISO' ? '#000000' : '#ffffff'} // White emissive color, filtered by map
            emissiveIntensity={nightTime ? (theme === 'ISO' ? 0.3 : 1) : 0}
          />
        </mesh>
    )
}

const CompanyHologram = ({ ownerColor, logoId, height }: { ownerColor: string, logoId?: string, height: number }) => {
    // Determine which icon to render based on logoId
    const IconComponent = LOGO_ICONS[logoId || 'zap'] || Hammer;

    return (
        <group position={[0, (height * BLOCK_SCALE_FACTOR) + 3, 0]}>
            <Float speed={3} rotationIntensity={0} floatIntensity={0.5}>
                <Html transform sprite distFactor={15}>
                    <div 
                        className="w-12 h-12 rounded-full border-2 flex items-center justify-center backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-transform hover:scale-125"
                        style={{ 
                            borderColor: ownerColor,
                            backgroundColor: `${ownerColor}40`, // 25% opacity
                            color: ownerColor
                        }}
                    >
                       <IconComponent size={24} strokeWidth={3} />
                    </div>
                </Html>
                {/* 3D Line anchor */}
                <mesh position={[0, -1.5, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 3]} />
                    <meshBasicMaterial color={ownerColor} transparent opacity={0.5} />
                </mesh>
            </Float>
        </group>
    );
};

const BuildingPreview = ({ building, isOwnedByUser, nightTime, theme, simulationSpeed, user }: { building: Building, isOwnedByUser: boolean, nightTime: boolean, theme: 'CYBER' | 'ISO', simulationSpeed: number, user: Player }) => {
  const blocks = useMemo(() => building.blocks, [building]);
  const ownerColor = building.ownerColor || (isOwnedByUser ? '#4ade80' : '#ef4444');
  const isActive = useMemo(() => (Date.now() - building.timestamp) < 60 * 60 * 1000, [building]);
  
  // Decide which logo to show: if user owns it, show user's logo. Else, show a generic/rival one based on name hash if we had rival logos
  const logoId = isOwnedByUser ? user.logoId : undefined; 

  return (
    <group>
      {/* Status Ring */}
      {theme === 'CYBER' && (
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI/2, 0, 0]}>
           <ringGeometry args={[3.5, 3.8, 32]} />
           <meshBasicMaterial color={ownerColor} transparent opacity={nightTime ? 0.8 : 0.4} blending={THREE.AdditiveBlending} />
        </mesh>
      )}

      {blocks.map((block, i) => (
          <BuildingBlock key={i} block={block} ownerColor={ownerColor} nightTime={nightTime} theme={theme} />
      ))}

      {isOwnedByUser && (
          <CompanyHologram ownerColor={ownerColor} logoId={logoId} height={building.height} />
      )}

      {isActive && <ConstructionCrane position={[2, 0, 2]} height={building.height} simulationSpeed={simulationSpeed} />}
      {building.height > 5 && theme === 'CYBER' && <Drone center={[0, building.height * BLOCK_SCALE_FACTOR, 0]} simulationSpeed={simulationSpeed} />}
    </group>
  );
};

const ConstructionMarker = ({ theme }: { theme: 'CYBER' | 'ISO' }) => {
  return (
      <group position={[0, 4, 0]}>
          <Float speed={4} rotationIntensity={0} floatIntensity={1}>
              {/* 3D Arrow */}
              <group>
                  <mesh position={[0, 1, 0]}>
                      <cylinderGeometry args={[0.5, 0.5, 2, 8]} />
                      <meshStandardMaterial color="#fbbf24" />
                  </mesh>
                   <mesh position={[0, -0.5, 0]}>
                      <coneGeometry args={[1, 1.5, 8]} />
                      <meshStandardMaterial color="#fbbf24" />
                  </mesh>
              </group>
              
              {/* Construction Icon Overlay */}
              <Html transform sprite distFactor={12}>
                  <div className={`p-2 rounded-lg ${theme === 'ISO' ? 'bg-white text-slate-900 border-2 border-slate-900' : 'bg-black/80 text-yellow-500 border border-yellow-500'} shadow-xl flex flex-col items-center gap-1`}>
                      <Hammer size={24} />
                  </div>
              </Html>
          </Float>
      </group>
  )
}

const PreBuiltBase = ({ nightTime, theme }: { nightTime: boolean, theme: 'CYBER' | 'ISO' }) => {
  const texture = useFacadeTexture('#475569', theme);
  return (
    <group>
        {Array.from({length: 5}).map((_, i) => (
             <mesh key={i} position={[0, (i + 1) * BLOCK_SCALE_FACTOR, 0]} scale={[3 * BLOCK_SCALE_FACTOR, 1 * BLOCK_SCALE_FACTOR, 3 * BLOCK_SCALE_FACTOR]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial map={texture} color={theme === 'ISO' ? '#bdc3c7' : '#475569'} roughness={0.5} />
             </mesh>
        ))}
         <ConstructionMarker theme={theme} />
    </group>
  )
}

const Tree: React.FC<{ position: [number, number, number], theme: 'CYBER' | 'ISO' }> = ({ position, theme }) => {
    return (
      <group position={new THREE.Vector3(...position)}>
        <mesh position={[0, 0.4, 0]}><boxGeometry args={[0.3, 0.8, 0.3]} /><meshStandardMaterial color={theme === 'ISO' ? '#8e44ad' : "#3f2c20"} /></mesh>
        <mesh position={[0, 1.5, 0]}>
            {theme === 'ISO' ? (
                <sphereGeometry args={[0.8, 8, 8]} />
            ) : (
                <boxGeometry args={[1, 1, 1]} />
            )}
            <meshStandardMaterial color={theme === 'ISO' ? '#2ecc71' : "#166534"} />
        </mesh>
      </group>
    );
};

interface LotProps {
  data: LotData;
  x: number;
  z: number;
  building: Building | undefined;
  onClick: () => void;
  isOwnedByUser: boolean;
  simulationSpeed: number;
  user: Player;
}

const Lot: React.FC<LotProps & { nightTime: boolean, districtColor: string, theme: 'CYBER' | 'ISO' }> = ({ data, x, z, building, onClick, isOwnedByUser, nightTime, districtColor, theme, simulationSpeed, user }) => {
  const [hovered, setHover] = useState(false);
  const isPark = data.type === 'PARK';
  const isDecor = data.type === 'COMMERCIAL' || data.type === 'CIVIC';
  
  // Iso Theme Colors
  let groundColor = theme === 'ISO' ? '#ecf0f1' : "#0f172a";
  if (isPark) groundColor = theme === 'ISO' ? '#27ae60' : "#064e3b";
  if (isDecor) groundColor = theme === 'ISO' ? '#e5e7eb' : "#1e293b";

  const hoverColor = theme === 'ISO' ? '#d5dbdb' : "#334155";

  return (
    <group position={[x, 0, z]}>
      {/* Base */}
      <mesh position={[0, 0, 0]} onClick={(e) => { e.stopPropagation(); if(!isPark && !isDecor) onClick(); }} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
        <boxGeometry args={[LOT_SIZE - ROAD_WIDTH, 0.2, LOT_SIZE - ROAD_WIDTH]} />
        <meshStandardMaterial 
            color={hovered && !building && !isPark && !isDecor ? hoverColor : groundColor} 
            roughness={theme === 'ISO' ? 1 : 0.9} 
        />
      </mesh>
      
      {/* Sidewalk for ISO */}
      {theme === 'ISO' && !isPark && (
          <mesh position={[0, 0.1, 0]}>
             <boxGeometry args={[LOT_SIZE - ROAD_WIDTH + 0.5, 0.1, LOT_SIZE - ROAD_WIDTH + 0.5]} />
             <meshStandardMaterial color="#bdc3c7" />
          </mesh>
      )}

      {/* Decorative Buildings (Shops, Hospitals, etc) */}
      {isDecor && data.variant && (
          <DecorBuilding variant={data.variant} theme={theme} nightTime={nightTime} />
      )}

      {!isPark && !isDecor && (
          <>
            <StreetLamp position={[4.5, 0, 4.5]} color={districtColor} on={nightTime} />
            <StreetLamp position={[-4.5, 0, -4.5]} color={districtColor} on={nightTime} />
            <Pedestrian startPos={[5, 0, 0]} rangeX={0} rangeZ={8} speed={1 + Math.random()} simulationSpeed={simulationSpeed} />
          </>
      )}

      {isPark && (
          <>
            <mesh position={[0, 0.15, 0]}><cylinderGeometry args={[2, 2, 0.1, 16]} /><meshStandardMaterial color={theme === 'ISO' ? '#229954' : "#065f46"} /></mesh>
            {[[-2.5, -2.5], [2.5, 2.5], [-2.5, 2.5], [2.5, -2.5]].map((pos, i) => <Tree key={i} position={[pos[0], 0, pos[1]]} theme={theme} />)}
            <StreetLamp position={[2, 0, 2]} color="#fbbf24" on={nightTime} />
          </>
      )}

      {!isPark && !isDecor && (
        <>
            {building ? (
                <BuildingPreview building={building} isOwnedByUser={isOwnedByUser} nightTime={nightTime} theme={theme} simulationSpeed={simulationSpeed} user={user} />
            ) : (
                data.type === 'PRE_BUILT_BASE' ? <PreBuiltBase nightTime={nightTime} theme={theme} /> : (hovered && (
                    <group>
                         <lineSegments position={[0, 0.2, 0]} rotation={[-Math.PI/2, 0, 0]}>
                            <ringGeometry args={[1.5, 1.7, 32]} />
                            <lineBasicMaterial color={theme === 'ISO' ? "#7f8c8d" : "#94a3b8"} />
                        </lineSegments>
                        {/* Hover hint */}
                        <Html position={[0, 2, 0]} center>
                            <div className="bg-white/90 text-slate-900 px-2 py-1 rounded text-xs font-bold pointer-events-none">Click to Build</div>
                        </Html>
                    </group>
                ))
            )}
        </>
      )}
    </group>
  );
};

const CameraController = ({ focusedLotIndex, cityLayout }: { focusedLotIndex: number | null, cityLayout: LotData[] }) => {
    const { camera, controls } = useThree();
    useEffect(() => {
        if (focusedLotIndex !== null) {
            const lot = cityLayout.find(l => l.index === focusedLotIndex);
            if (lot && controls) {
                const targetX = lot.x * LOT_SIZE;
                const targetZ = lot.z * LOT_SIZE;
                // @ts-ignore
                controls.target.set(targetX, 0, targetZ);
                camera.position.set(targetX + 60, 60, targetZ + 60);
                // @ts-ignore
                controls.update();
            }
        }
    }, [focusedLotIndex, cityLayout, camera, controls]);
    return null;
}

const CityScene = ({ buildings, cityLayout, gridSize, onLotSelect, user, focusedLotIndex, districts, time, weather, theme, simulationSpeed }: Omit<CityMapProps, 'districts'> & { districts: District[], time: number, weather: 'CLEAR' | 'RAIN', theme: 'CYBER' | 'ISO', simulationSpeed: number }) => {
  const totalSize = gridSize * LOT_SIZE;
  const offset = -(totalSize)/2 + LOT_SIZE/2;
  const isNight = time > 0.75 || time < 0.25;

  // Lightning Logic
  const lightningRef = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (weather === 'RAIN' && lightningRef.current) {
        if (Math.random() > 0.99) {
            lightningRef.current.intensity = 10 + Math.random() * 20;
            lightningRef.current.position.set((Math.random()-0.5)*100, 50, (Math.random()-0.5)*100);
        } else {
            lightningRef.current.intensity *= 0.85; // Fast fade
        }
    } else if (lightningRef.current) {
        lightningRef.current.intensity = 0;
    }
  });
  
  // Environment colors based on Theme
  let skyColor, fogColor, sunColor, sunIntensity, groundColor;

  if (theme === 'ISO') {
      // Sunny, bright vector art style
      skyColor = '#87CEEB';
      fogColor = '#87CEEB';
      sunColor = '#ffffff';
      sunIntensity = 1.5;
      groundColor = '#95a5a6'; // Grey road
  } else {
      // Dark Cyberpunk
      skyColor = isNight ? '#0b1121' : (weather === 'RAIN' ? '#334155' : '#7dd3fc');
      fogColor = isNight ? '#0b1121' : (weather === 'RAIN' ? '#334155' : '#bae6fd');
      sunIntensity = isNight ? 0.1 : (weather === 'RAIN' ? 0.2 : 1.2);
      sunColor = isNight ? "#6366f1" : (time < 0.3 || time > 0.7 ? "#fdba74" : "#fefce8");
      groundColor = '#0f172a';
  }

  return (
    <>
      <color attach="background" args={[skyColor]} />
      {/* Depth Fog: Only dense at distance */}
      <fog attach="fog" color={fogColor} near={40} far={150} />
      
      <ambientLight intensity={theme === 'ISO' ? 0.8 : (isNight ? 0.2 : 0.5)} />
      <directionalLight 
        position={[50, 80, 50]} 
        intensity={sunIntensity} 
        castShadow 
        shadow-bias={-0.0005} 
        color={sunColor} 
      />
      <pointLight ref={lightningRef} color="#a5b4fc" distance={200} decay={1} />
      
      {theme === 'CYBER' && isNight && <Stars radius={120} depth={20} count={3000} factor={4} saturation={0} fade speed={0.5 * simulationSpeed} />}
      
      {theme === 'CYBER' && <Rain visible={weather === 'RAIN'} simulationSpeed={simulationSpeed} />}
      <DistantCity theme={theme} />

      {/* Atmospheric Birds/Planes */}
      <AmbientPlane height={50} speed={20} theme={theme} simulationSpeed={simulationSpeed} />
      <AmbientPlane height={70} speed={25} theme={theme} simulationSpeed={simulationSpeed} />
      <AmbientBirds heightRange={[30, 60]} theme={theme} simulationSpeed={simulationSpeed} />

      <CameraController focusedLotIndex={focusedLotIndex} cityLayout={cityLayout} />

      <group position={[offset, 0, offset]}>
        {cityLayout.map((lot) => {
          const building = buildings.find(b => b.lotIndex === lot.index);
          const isOwned = building?.ownerId === user.id;
          const district = districts.find(d => d.id === lot.districtId);
          return (
            <Lot 
              key={lot.index} 
              data={lot}
              x={lot.x * LOT_SIZE} 
              z={lot.z * LOT_SIZE} 
              building={building} 
              onClick={() => onLotSelect(lot.index)} 
              isOwnedByUser={isOwned}
              nightTime={isNight}
              districtColor={district?.color || '#ffffff'}
              theme={theme}
              simulationSpeed={simulationSpeed}
              user={user}
            />
          );
        })}

        {/* Roads & Traffic */}
        {Array.from({length: gridSize}).map((_, i) => (
            <group key={`road-x-${i}`} position={[(gridSize * LOT_SIZE)/2 - LOT_SIZE/2, 0, i * LOT_SIZE + LOT_SIZE/2]}>
                 <Car startPos={[0, 0, 0]} axis="x" speed={5 + Math.random() * 2} range={totalSize} color="#eab308" lightsOn={isNight || weather === 'RAIN'} theme={theme} simulationSpeed={simulationSpeed} />
                 <Car startPos={[10, 0, 0]} axis="x" speed={6 + Math.random() * 2} range={totalSize} color="#a855f7" lightsOn={isNight || weather === 'RAIN'} theme={theme} simulationSpeed={simulationSpeed} />
            </group>
        ))}
        {Array.from({length: gridSize}).map((_, i) => (
            <group key={`road-z-${i}`} position={[i * LOT_SIZE + LOT_SIZE/2, 0, (gridSize * LOT_SIZE)/2 - LOT_SIZE/2]}>
                 <Car startPos={[0, 0, 0]} axis="z" speed={4 + Math.random() * 2} range={totalSize} color="#3b82f6" lightsOn={isNight || weather === 'RAIN'} theme={theme} simulationSpeed={simulationSpeed} />
            </group>
        ))}
      </group>

      {/* Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial 
            color={groundColor} 
            roughness={theme === 'ISO' ? 1 : (weather === 'RAIN' ? 0.2 : 0.8)} 
            metalness={theme === 'ISO' ? 0 : (weather === 'RAIN' ? 0.5 : 0.1)} 
        />
      </mesh>
    </>
  );
};

const CityMap: React.FC<CityMapProps> = (props) => {
  const [showMinimap, setShowMinimap] = useState(false);
  const [time, setTime] = useState(0.5); 
  const [weather, setWeather] = useState<'CLEAR' | 'RAIN'>('CLEAR');
  const [simulationSpeed, setSimulationSpeed] = useState(1); // 0 = pause, 1 = normal, 5 = fast
  const timeRef = useRef(0.5);

  useEffect(() => {
    const weatherInterval = setInterval(() => {
        setWeather(prev => Math.random() > 0.6 ? (prev === 'CLEAR' ? 'RAIN' : 'CLEAR') : prev);
    }, 15000); 
    return () => clearInterval(weatherInterval);
  }, []);

  useEffect(() => {
     let frame: number;
     const tick = () => {
         // Update time based on speed
         const timeStep = (1 / (60 * DAY_DURATION)) * simulationSpeed;
         timeRef.current = (timeRef.current + timeStep) % 1; 
         setTime(timeRef.current);
         frame = requestAnimationFrame(tick);
     };
     tick();
     return () => cancelAnimationFrame(frame);
  }, [simulationSpeed]);

  const timeString = useMemo(() => {
      const hours = Math.floor(time * 24);
      const mins = Math.floor((time * 24 * 60) % 60);
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }, [time]);

  return (
    <div className={`w-full h-full relative ${props.theme === 'ISO' ? 'bg-sky-200' : 'bg-slate-900'} transition-colors duration-700`}>
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
          {/* Time & Weather */}
          <div className={`backdrop-blur-md px-4 py-2 rounded-xl border shadow-lg flex items-center gap-3 ${props.theme === 'ISO' ? 'bg-white/80 border-white text-slate-800' : 'bg-slate-800/80 border-slate-700 text-white'}`}>
             <div className="text-2xl font-mono font-bold">{timeString}</div>
             {time > 0.25 && time < 0.75 ? <Sun className="text-orange-400" /> : <Moon className="text-blue-200" />}
             {weather === 'RAIN' && <CloudRain className="text-blue-400 animate-pulse" />}
          </div>

          {/* Speed Controls */}
          <div className={`backdrop-blur-md px-2 py-2 rounded-xl border shadow-lg flex items-center gap-1 ${props.theme === 'ISO' ? 'bg-white/80 border-white text-slate-800' : 'bg-slate-800/80 border-slate-700 text-white'}`}>
             <button 
                onClick={() => setSimulationSpeed(0)} 
                className={`p-2 rounded-lg hover:bg-black/10 ${simulationSpeed === 0 ? 'bg-black/20 text-yellow-400' : ''}`}
             >
                <Pause size={16} fill="currentColor" />
             </button>
             <button 
                onClick={() => setSimulationSpeed(1)} 
                className={`p-2 rounded-lg hover:bg-black/10 ${simulationSpeed === 1 ? 'bg-black/20 text-green-400' : ''}`}
             >
                <Play size={16} fill="currentColor" />
             </button>
             <button 
                onClick={() => setSimulationSpeed(10)} 
                className={`p-2 rounded-lg hover:bg-black/10 ${simulationSpeed === 10 ? 'bg-black/20 text-red-400' : ''}`}
             >
                <FastForward size={16} fill="currentColor" />
             </button>
             <span className="text-xs font-bold font-mono ml-1 w-12 text-center">
                 {simulationSpeed}x
             </span>
          </div>
      </div>

      <button onClick={() => setShowMinimap(!showMinimap)} className={`absolute bottom-6 left-6 z-20 p-3 rounded-full transition shadow-xl border ${props.theme === 'ISO' ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-900' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'}`}>
        <MapIcon size={24} />
      </button>

      {showMinimap && (
        <Minimap buildings={props.buildings} layout={props.cityLayout} gridSize={props.gridSize} user={props.user} districts={props.districts} onClose={() => setShowMinimap(false)} />
      )}

      <Canvas shadows camera={{ position: [60, 60, 60], zoom: 10 }} orthographic>
        <CityScene 
            buildings={props.buildings} 
            cityLayout={props.cityLayout} 
            gridSize={props.gridSize} 
            onLotSelect={props.onLotSelect}
            user={props.user}
            focusedLotIndex={props.focusedLotIndex}
            districts={props.districts}
            time={time}
            weather={weather}
            theme={props.theme}
            simulationSpeed={simulationSpeed}
        />
        <OrbitControls enableZoom={true} enablePan={true} minZoom={5} maxZoom={30} maxPolarAngle={Math.PI / 2.2} autoRotate={false} />
      </Canvas>
    </div>
  );
};

export default CityMap;

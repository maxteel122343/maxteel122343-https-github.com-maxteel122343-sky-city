
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Stars, Float, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { CONFIG, GamePhase, BlockData, Building, GameResult, PlateType, PLATE_STATS } from '../types';
import { Play, RotateCcw, Home, Share2, Building2, Construction, Bird, Plane, Cloud, AlertTriangle, Hammer } from 'lucide-react';
import { LOGO_ICONS } from './UserProfile';

// --- Utils ---
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

// Helper to generate a gradient based on a base HSL color
const getBlockColor = (height: number, baseColorHex: string) => {
  const c = new THREE.Color(baseColorHex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  
  // Vary lightness and slightly shift hue based on height
  const lightness = Math.max(0.2, Math.min(0.8, hsl.l + (Math.sin(height * 0.1) * 0.2)));
  const hue = (hsl.h + (height * 0.01)) % 1.0;
  
  return new THREE.Color().setHSL(hue, hsl.s, lightness).getStyle();
};

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
        
        if (r > 200) { wallColor = '#f3d2ac'; }
        else if (b > 200) { wallColor = '#76c4ae'; windowColor = '#a3e4d7'; }
        else { wallColor = '#ecf0f1'; }

        wallColor = color; 

        ctx.fillStyle = wallColor;
        ctx.fillRect(0, 0, 128, 128);

        ctx.fillStyle = windowColor;
        for(let y=15; y<128; y+=30) {
            for(let x=15; x<128; x+=30) {
                ctx.fillRect(x, y, 18, 22);
            }
        }
        
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(0,0,128, 4);

      } else {
        // --- CYBER STYLE ---
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 128, 128);
        
        ctx.fillStyle = '#1e293b'; 
        const lightColor = '#fef3c7';
        
        const rows = 4;
        const cols = 4;
        const pad = 4;
        const w = (128 - (pad * (cols + 1))) / cols;
        const h = (128 - (pad * (rows + 1))) / rows;

        for(let r=0; r<rows; r++) {
            for(let c=0; c<cols; c++) {
                const isLit = Math.random() > 0.6;
                ctx.fillStyle = isLit ? lightColor : '#0f172a';
                if (Math.random() > 0.95) ctx.fillStyle = '#38bdf8'; 
                
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
    return tex;
  }, [color, theme]);
}

// --- Base Plate Visuals ---
const RooftopBase = ({ plateType, theme, userColor, logoId }: { plateType: PlateType, theme: 'CYBER' | 'ISO', userColor: string, logoId: string }) => {
    const config = PLATE_STATS[plateType];
    const plateBaseColor = config.color;
    
    // Icon component for the "Printed" logo
    const LogoIcon = LOGO_ICONS[logoId] || Hammer;

    // N1: Standard
    if (plateType === 'N1') {
        return (
            <group position={[0, -0.5, 0]}>
                <mesh receiveShadow>
                    <boxGeometry args={[12, 1, 12]} />
                    <meshStandardMaterial color={theme === 'ISO' ? '#94a3b8' : "#1e293b"} roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.6, 0]}>
                    <boxGeometry args={[12.5, 0.2, 12.5]} />
                    {/* User Color applied here */}
                    <meshStandardMaterial color={userColor} /> 
                </mesh>
                
                {/* Printed Logo on the Plate */}
                <Html transform position={[0, 0.71, 0]} rotation={[-Math.PI / 2, 0, 0]} occlude>
                    <div className="w-48 h-48 flex items-center justify-center opacity-50" style={{ color: '#000000' }}>
                        <LogoIcon size={120} strokeWidth={3} />
                    </div>
                </Html>
            </group>
        );
    }

    // N2: Reinforced
    if (plateType === 'N2') {
        return (
            <group position={[0, -0.5, 0]}>
                <mesh receiveShadow>
                    <boxGeometry args={[12, 2, 12]} />
                    <meshStandardMaterial color="#475569" roughness={0.5} />
                </mesh>
                {/* Main Plate Top */}
                <mesh position={[0, 1.1, 0]}>
                    <boxGeometry args={[11, 0.2, 11]} />
                    <meshStandardMaterial color={userColor} />
                </mesh>
                
                {/* Logo */}
                <Html transform position={[0, 1.21, 0]} rotation={[-Math.PI / 2, 0, 0]} occlude>
                    <div className="w-48 h-48 flex items-center justify-center opacity-40 mix-blend-overlay" style={{ color: '#ffffff' }}>
                        <LogoIcon size={120} strokeWidth={4} />
                    </div>
                </Html>

                {/* Hazard Stripes */}
                <mesh position={[6.1, 0, 0]}>
                    <boxGeometry args={[0.2, 2, 12]} />
                    <meshStandardMaterial color="#facc15" />
                </mesh>
                <mesh position={[-6.1, 0, 0]}>
                    <boxGeometry args={[0.2, 2, 12]} />
                    <meshStandardMaterial color="#facc15" />
                </mesh>
                {/* Corner Bolts */}
                {[[-5,-5], [5,5], [-5,5], [5,-5]].map((pos, i) => (
                    <mesh key={i} position={[pos[0], 1, pos[1]]}>
                        <cylinderGeometry args={[0.5, 0.5, 0.5]} />
                        <meshStandardMaterial color="#94a3b8" />
                    </mesh>
                ))}
            </group>
        );
    }

    // N3: Industrial
    if (plateType === 'N3') {
        return (
            <group position={[0, -1, 0]}>
                <mesh receiveShadow>
                    <cylinderGeometry args={[8, 9, 2, 8]} />
                    <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.6} />
                </mesh>
                <mesh position={[0, 1.1, 0]}>
                    <boxGeometry args={[14, 0.2, 14]} />
                    <meshStandardMaterial color={userColor} metalness={0.5} roughness={0.5} />
                </mesh>
                 {/* Logo */}
                <Html transform position={[0, 1.21, 0]} rotation={[-Math.PI / 2, 0, 0]} occlude>
                    <div className="w-48 h-48 flex items-center justify-center opacity-60" style={{ color: '#000000' }}>
                        <div className="border-4 border-black p-4 rounded-full">
                             <LogoIcon size={80} strokeWidth={3} />
                        </div>
                    </div>
                </Html>

                 {/* Heavy Supports */}
                {[0, Math.PI/2, Math.PI, -Math.PI/2].map((rot, i) => (
                    <mesh key={i} position={[Math.sin(rot)*6, 0.5, Math.cos(rot)*6]} rotation={[0, rot, 0]}>
                        <boxGeometry args={[2, 3, 4]} />
                        <meshStandardMaterial color="#f97316" />
                    </mesh>
                ))}
            </group>
        );
    }

    // N4: Titanium
    if (plateType === 'N4') {
         return (
            <group position={[0, -1, 0]}>
                <mesh receiveShadow>
                    <boxGeometry args={[14, 2, 14]} />
                    <meshStandardMaterial color="#111" roughness={0.2} metalness={0.9} />
                </mesh>
                {/* Colored Trim */}
                <mesh position={[0, 1.01, 0]} rotation={[-Math.PI/2,0,0]}>
                    <ringGeometry args={[5, 5.5, 32]} />
                    <meshBasicMaterial color={userColor} />
                </mesh>
                 {/* Logo Glow */}
                 <Html transform position={[0, 1.05, 0]} rotation={[-Math.PI / 2, 0, 0]} occlude>
                    <div className="w-48 h-48 flex items-center justify-center" style={{ color: userColor }}>
                        <LogoIcon size={100} strokeWidth={3} style={{ filter: `drop-shadow(0 0 10px ${userColor})` }} />
                    </div>
                </Html>

                 <mesh position={[7.1, 0, 0]}>
                    <boxGeometry args={[0.2, 2, 10]} />
                    <meshStandardMaterial color="#991b1b" emissive="#ef4444" emissiveIntensity={2} />
                </mesh>
                 <mesh position={[-7.1, 0, 0]}>
                    <boxGeometry args={[0.2, 2, 10]} />
                    <meshStandardMaterial color="#991b1b" emissive="#ef4444" emissiveIntensity={2} />
                </mesh>
            </group>
        );
    }

    // N5: Quantum
    if (plateType === 'N5') {
        return (
             <group position={[0, -1.5, 0]}>
                 <mesh receiveShadow>
                     <cylinderGeometry args={[10, 2, 3, 6]} />
                     <meshStandardMaterial color="#3b0764" metalness={1} roughness={0} />
                 </mesh>
                 {/* Floating Ring */}
                 <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                    <mesh position={[0, 1, 0]} rotation={[-Math.PI/2, 0, 0]}>
                        <torusGeometry args={[8, 0.2, 16, 100]} />
                        <meshBasicMaterial color={userColor} />
                    </mesh>
                 </Float>
                 
                 <Html transform position={[0, 1.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <div className="flex items-center justify-center animate-pulse" style={{ color: userColor }}>
                         <LogoIcon size={140} strokeWidth={1} />
                    </div>
                </Html>

                 {/* Energy Core */}
                 <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[4, 4, 3]} />
                    <meshStandardMaterial color={userColor} emissive={userColor} emissiveIntensity={2} wireframe />
                 </mesh>
             </group>
        )
    }

    return null;
}

// ... (Atmosphere Components - Kept same as previous)
// Level 1: Distant City (0 - 60 height)
const DistantBuildings = ({ theme }: { theme: 'CYBER' | 'ISO' }) => {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const count = 100;
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useEffect(() => {
        if (!mesh.current) return;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 40 + Math.random() * 60; 
            const x = Math.sin(angle) * radius;
            const z = Math.cos(angle) * radius;
            const height = 10 + Math.random() * 50; 
            const scaleW = 3 + Math.random() * 5;

            dummy.position.set(x, height / 2 - 20, z); 
            dummy.scale.set(scaleW, height, scaleW);
            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);
            
            if (theme === 'ISO') {
                const colors = [new THREE.Color('#e2e8f0'), new THREE.Color('#cbd5e1'), new THREE.Color('#94a3b8')];
                mesh.current.setColorAt(i, colors[Math.floor(Math.random() * colors.length)]);
            } else {
                const c = new THREE.Color('#0f172a').multiplyScalar(0.5 + Math.random());
                mesh.current.setColorAt(i, c);
            }
        }
        mesh.current.instanceMatrix.needsUpdate = true;
        if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    }, [theme]);

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial 
                color={theme === 'ISO' ? '#ffffff' : '#1e293b'} 
                transparent opacity={theme === 'ISO' ? 0.9 : 0.8} fog={true} 
            />
        </instancedMesh>
    );
};

// ... (Other props like Crane, Birds, Planes - Kept logic but shortened for brevity in response, assuming full file replacement)
const FloatingCrane = ({ position, rotationSpeed, theme }: any) => {
    const group = useRef<THREE.Group>(null);
    useFrame(() => { if (group.current) group.current.rotation.y += rotationSpeed * 0.01; });
    const color = theme === 'ISO' ? '#facc15' : '#f59e0b'; 
    return (
        <group ref={group} position={new THREE.Vector3(...position)}>
            <mesh position={[0, -10, 0]}><boxGeometry args={[1, 20, 1]} /><meshStandardMaterial color={color} wireframe={theme === 'CYBER'} /></mesh>
            <mesh position={[5, 0, 0]}><boxGeometry args={[12, 1, 1]} /><meshStandardMaterial color={color} /></mesh>
            <mesh position={[-3, 0, 0]}><boxGeometry args={[4, 2, 2]} /><meshStandardMaterial color="#475569" /></mesh>
            {theme === 'CYBER' && <pointLight color="red" distance={10} intensity={2} position={[10, 1, 0]} />}
        </group>
    );
};

const FlockingBirds = ({ heightRange, theme }: any) => {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const count = 20;
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const [birds] = useState(() => Array.from({length: count}).map(() => ({
        speed: 0.1 + Math.random() * 0.1, offset: Math.random() * 100,
        yBase: heightRange[0] + Math.random() * (heightRange[1] - heightRange[0]), radius: 20 + Math.random() * 15
    })));
    useFrame((state) => {
        if (!mesh.current) return;
        birds.forEach((bird, i) => {
            const t = state.clock.elapsedTime * bird.speed + bird.offset;
            const x = Math.sin(t) * bird.radius;
            const z = Math.cos(t) * bird.radius;
            const y = bird.yBase + Math.sin(t * 3) * 2;
            dummy.position.set(x, y, z);
            dummy.lookAt(Math.sin(t + 0.1) * bird.radius, y, Math.cos(t + 0.1) * bird.radius);
            dummy.scale.set(0.5, 0.1, 0.2);
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

const Airplane = ({ height, speed, theme }: any) => {
    const ref = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (ref.current) {
            const t = state.clock.elapsedTime * speed;
            ref.current.position.x = (t % 200) - 100;
            ref.current.position.z = -30;
            ref.current.position.y = height;
            ref.current.rotation.z = -0.1;
        }
    });
    return (
        <group ref={ref}>
            <mesh rotation={[0, 0, -Math.PI/2]}><capsuleGeometry args={[0.5, 6, 4, 8]} /><meshStandardMaterial color={theme === 'ISO' ? '#fff' : '#64748b'} /></mesh>
            <mesh position={[0, 0, 0]} scale={[1, 0.1, 3]}><boxGeometry args={[2, 1, 4]} /><meshStandardMaterial color={theme === 'ISO' ? '#e2e8f0' : '#475569'} /></mesh>
             {theme === 'CYBER' && <><pointLight position={[-3, 0, 2]} color="green" distance={5} /><pointLight position={[-3, 0, -2]} color="red" distance={5} /></>}
        </group>
    );
};

const HighClouds = ({ theme }: any) => {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const count = 30;
    const dummy = useMemo(() => new THREE.Object3D(), []);
    useEffect(() => {
        if (!mesh.current) return;
        for (let i = 0; i < count; i++) {
            dummy.position.set((Math.random() - 0.5) * 100, 240 + Math.random() * 100, (Math.random() - 0.5) * 100);
            dummy.scale.set(8 + Math.random() * 10, 2, 5 + Math.random() * 5);
            dummy.rotation.y = Math.random() * Math.PI;
            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);
        }
        mesh.current.instanceMatrix.needsUpdate = true;
    }, []);
    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={theme === 'ISO' ? '#fff' : '#6366f1'} transparent opacity={0.4} />
        </instancedMesh>
    );
};

// --- 3D Components ---

const Block: React.FC<BlockData & { isCurrent?: boolean, theme: 'CYBER' | 'ISO' }> = ({ position, size, color, isCurrent, theme }) => {
  const texture = useFacadeTexture(color, theme);

  return (
    <mesh position={new THREE.Vector3(...position)} scale={new THREE.Vector3(...size)}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        map={texture}
        color={theme === 'ISO' ? '#ffffff' : color} 
        roughness={theme === 'ISO' ? 0.6 : 0.1} 
        metalness={theme === 'ISO' ? 0 : 0.4}
        emissive={isCurrent ? (theme === 'ISO' ? '#000000' : color) : '#000000'}
        emissiveIntensity={isCurrent ? 0.4 : 0}
      />
    </mesh>
  );
};

const Debris: React.FC<BlockData & { theme: 'CYBER' | 'ISO' }> = ({ position, size, color, theme }) => {
  const ref = useRef<THREE.Mesh>(null);
  const texture = useFacadeTexture(color, theme);
  const [vel] = useState(() => new THREE.Vector3(
      (Math.random() - 0.5) * 0.2, 
      -0.2 - Math.random() * 0.2, 
      (Math.random() - 0.5) * 0.2
  ));
  const [rot] = useState(() => new THREE.Vector3(Math.random() * 0.1, Math.random() * 0.1, Math.random() * 0.1));

  useFrame(() => {
    if (ref.current) {
      ref.current.position.add(vel);
      ref.current.rotation.x += rot.x;
      ref.current.rotation.y += rot.y;
      ref.current.rotation.z += rot.z;
      vel.y -= 0.02;
      
      if (ref.current.position.y < -30) {
          ref.current.visible = false;
      }
    }
  });

  return (
    <mesh ref={ref} position={new THREE.Vector3(...position)} scale={new THREE.Vector3(...size)}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial map={texture} color={theme === 'ISO' ? '#ffffff' : color} transparent opacity={0.6} roughness={0.5} />
    </mesh>
  );
};

// --- Game Logic Hook inside Canvas ---

interface GameStateInternal {
  stack: BlockData[];
  debris: BlockData[];
  currentBlock: BlockData;
  phase: GamePhase;
  score: number;
  validForLeaderboard: boolean;
  failReason?: string;
}

interface SceneProps {
  internalState: GameStateInternal;
  setInternalState: React.Dispatch<React.SetStateAction<GameStateInternal>>;
  activeBlockRef: React.MutableRefObject<THREE.Mesh | null>;
  userColor: string;
  theme: 'CYBER' | 'ISO';
  setHeightLevel: (level: number) => void;
  plateType: PlateType;
  logoId: string;
}

const GameScene = ({ internalState, setInternalState, activeBlockRef, userColor, theme, setHeightLevel, plateType, logoId }: SceneProps) => {
  const { stack, currentBlock, phase, debris } = internalState;
  const time = useRef(0);
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useEffect(() => {
    // @ts-ignore
    activeBlockRef.current = meshRef.current;
  });

  // Calculate current height level based on top block Y
  const currentHeight = stack.length * CONFIG.blockHeight;
  useEffect(() => {
      // Mapping Y height to Levels
      if (currentHeight < 60) setHeightLevel(1);
      else if (currentHeight < 120) setHeightLevel(2);
      else if (currentHeight < 180) setHeightLevel(3);
      else if (currentHeight < 240) setHeightLevel(4);
      else setHeightLevel(5);
  }, [currentHeight, setHeightLevel]);

  useFrame((state, delta) => {
    if (phase === GamePhase.SKYSCRAPER) {
      time.current += delta; 
      
      if (meshRef.current) {
        const speed = CONFIG.speed + (stack.length * 0.01); 
        const limit = 5.5; 
        
        const isMoveX = stack.length % 2 === 0;
        const prevBlock = stack[stack.length - 1];
        
        const offset = Math.sin(time.current * speed) * limit;
        
        if (isMoveX) {
            meshRef.current.position.x = prevBlock.position[0] + offset;
            meshRef.current.position.z = prevBlock.position[2];
        } else {
            meshRef.current.position.z = prevBlock.position[2] + offset;
            meshRef.current.position.x = prevBlock.position[0];
        }
        meshRef.current.position.y = stack.length * CONFIG.blockHeight;
      }
    }

    // --- Dynamic Camera Logic ---
    const topY = stack.length * CONFIG.blockHeight;
    const targetY = topY + 4; 
    const camY = topY + 12 + (stack.length * 0.1); 
    const camDist = 14 + (stack.length * 0.1); 

    const idealPos = new THREE.Vector3(camDist, camY, camDist);
    camera.position.lerp(idealPos, 0.05);
    camera.lookAt(0, topY - 2, 0);
  });

  return (
    <>
      <ambientLight intensity={theme === 'ISO' ? 0.8 : 0.4} />
      <directionalLight position={[30, 50, 20]} intensity={theme === 'ISO' ? 1.2 : 1.5} castShadow color={theme === 'ISO' ? '#fff7ed' : '#e0f2fe'} />
      {theme === 'CYBER' && <pointLight position={[-10, stack.length * CONFIG.blockHeight, -10]} intensity={0.5} color={userColor} distance={20} />}
      
      {theme === 'CYBER' && <Stars radius={150} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />}
      {theme === 'CYBER' && <Environment preset="city" />}
      
      {theme === 'ISO' ? (
          <fog attach="fog" args={['#bae6fd', 10, 120]} />
      ) : (
          <fog attach="fog" args={['#0f172a', 10, 100]} />
      )}

      {/* --- ATMOSPHERE LAYERS --- */}
      <group position={[0, -10, 0]}>
         <DistantBuildings theme={theme} />
      </group>
      <FloatingCrane position={[15, 80, -15]} rotationSpeed={1} theme={theme} />
      <FloatingCrane position={[-20, 100, 10]} rotationSpeed={-0.8} theme={theme} />
      <group position={[0, 0, 0]}>
        <FlockingBirds heightRange={[130, 170]} theme={theme} />
      </group>
      <Airplane height={200} speed={10} theme={theme} />
      <Airplane height={220} speed={15} theme={theme} />
      <HighClouds theme={theme} />

      {/* The Tower */}
      {stack.map((block, i) => (
        <Block key={i} {...block} theme={theme} />
      ))}

      {/* Falling Debris */}
      {debris.map((d, i) => (
        <Debris key={`d-${i}`} {...d} theme={theme} />
      ))}

      {/* Active Moving Block */}
      {phase === GamePhase.SKYSCRAPER && (
        <mesh 
          ref={meshRef}
          scale={new THREE.Vector3(...currentBlock.size)}
        >
          <boxGeometry args={[1, 1, 1]} />
           <meshStandardMaterial 
            color={currentBlock.color} 
            emissive={currentBlock.color} 
            emissiveIntensity={theme === 'ISO' ? 0.1 : 0.8}
            roughness={theme === 'ISO' ? 0.5 : 0.2}
          />
          <lineSegments>
             <edgesGeometry args={[boxGeometry]} />
             <lineBasicMaterial color={theme === 'ISO' ? "#333" : "white"} linewidth={2} />
          </lineSegments>
        </mesh>
      )}

      {/* Visual Plate Base */}
      <RooftopBase plateType={plateType} theme={theme} userColor={userColor} logoId={logoId} />
    </>
  );
};

// --- Main Component ---

interface GameProps {
  lotIndex: number;
  bestScore: number;
  credits: number;
  setCredits: (c: number) => void;
  onExit: () => void;
  onComplete: (building: GameResult) => void;
  userColor: string;
  userName: string;
  theme: 'CYBER' | 'ISO';
  plateType: PlateType;
  logoId?: string; // Add optional logoId
}

export default function Game({ lotIndex, bestScore, credits, setCredits, onExit, onComplete, userColor, userName, theme, plateType, logoId = 'zap' }: GameProps) {
  const [justShared, setJustShared] = useState(false);
  const [heightLevel, setHeightLevel] = useState(1);
  
  const getInitialStack = (): BlockData[] => {
    return Array.from({ length: CONFIG.baseHeight }).map((_, i) => ({
        position: [0, i * CONFIG.blockHeight, 0],
        size: [CONFIG.initialSize, CONFIG.blockHeight, CONFIG.initialSize],
        color: theme === 'ISO' ? '#bdc3c7' : '#475569' 
    }));
  };

  const [internalState, setInternalState] = useState<GameStateInternal>({
    stack: getInitialStack(),
    debris: [],
    currentBlock: { 
        position: [0, CONFIG.baseHeight, 0], 
        size: [CONFIG.initialSize, CONFIG.blockHeight, CONFIG.initialSize], 
        color: getBlockColor(CONFIG.baseHeight, userColor) 
    },
    phase: GamePhase.SKYSCRAPER,
    score: 0, 
    validForLeaderboard: true,
  });

  const [perfectMatch, setPerfectMatch] = useState(false);
  const activeBlockRef = useRef<THREE.Mesh>(null);

  const performStack = () => {
    if (internalState.phase === GamePhase.GAME_OVER) return;

    if (!activeBlockRef.current) return;
    const currentPos = activeBlockRef.current.position.toArray();
    
    setInternalState(prev => {
        const { stack, phase } = prev;
        
        // --- HEIGHT CHECK ---
        const currentHeight = stack.length * CONFIG.blockHeight;
        const plateConfig = PLATE_STATS[plateType];
        
        if (currentHeight >= plateConfig.maxHeight) {
             return { 
                 ...prev, 
                 phase: GamePhase.GAME_OVER, 
                 failReason: `Foundation Limit Reached (${plateConfig.name})` 
             };
        }

        const prevBlock = stack[stack.length - 1];
        
        const isMoveX = stack.length % 2 === 0;

        const deltaX = currentPos[0] - prevBlock.position[0];
        const deltaZ = currentPos[2] - prevBlock.position[2];
        const diff = isMoveX ? deltaX : deltaZ;
        const absDiff = Math.abs(diff);

        // --- FORGIVING LOGIC ---
        const isPerfect = absDiff < CONFIG.tolerance;

        if (isPerfect) {
            setPerfectMatch(true);
            setTimeout(() => setPerfectMatch(false), 300);
        }

        let newSizeX = prev.currentBlock.size[0];
        let newSizeZ = prev.currentBlock.size[2];
        let newPosX = prevBlock.position[0]; 
        let newPosZ = prevBlock.position[2]; 

        if (isPerfect) {
            // Snap
        } else {
            if (isMoveX) {
                newSizeX = prev.currentBlock.size[0] - absDiff;
                newPosX = prevBlock.position[0] + (diff / 2);
                newPosZ = prevBlock.position[2];
            } else {
                newSizeZ = prev.currentBlock.size[2] - absDiff;
                newPosZ = prevBlock.position[2] + (diff / 2);
                newPosX = prevBlock.position[0];
            }
        }

        if (newSizeX <= 0 || newSizeZ <= 0) {
            return { ...prev, phase: GamePhase.GAME_OVER, failReason: 'Structural Failure' };
        }

        const newBlock: BlockData = {
            position: [newPosX, stack.length * CONFIG.blockHeight, newPosZ],
            size: [newSizeX, CONFIG.blockHeight, newSizeZ],
            color: prev.currentBlock.color
        };

        const newDebris = [...prev.debris];
        if (!isPerfect) {
            const debrisWidth = isMoveX ? absDiff : newSizeX;
            const debrisDepth = isMoveX ? newSizeZ : absDiff;
            
            let debrisX = newPosX;
            let debrisZ = newPosZ;
            const sign = Math.sign(diff);

            if (isMoveX) {
                debrisX = newPosX + (sign * ((newSizeX / 2) + (debrisWidth / 2)));
            } else {
                debrisZ = newPosZ + (sign * ((newSizeZ / 2) + (debrisDepth / 2)));
            }

            newDebris.push({
                position: [debrisX, newBlock.position[1], debrisZ],
                size: [debrisWidth, CONFIG.blockHeight, debrisDepth],
                color: prev.currentBlock.color
            });
        }

        const nextHeight = (stack.length + 1) * CONFIG.blockHeight;
        
        return {
            ...prev,
            stack: [...stack, newBlock],
            debris: newDebris,
            currentBlock: {
                position: [newPosX, nextHeight, newPosZ],
                size: [newSizeX, CONFIG.blockHeight, newSizeZ],
                color: getBlockColor(stack.length + 1, userColor)
            },
            score: prev.score + 1,
            phase: GamePhase.SKYSCRAPER
        };
    });
  };

  const handleRestart = () => {
    setInternalState({
      stack: getInitialStack(),
      debris: [],
      currentBlock: { 
          position: [0, CONFIG.baseHeight, 0], 
          size: [CONFIG.initialSize, CONFIG.blockHeight, CONFIG.initialSize], 
          color: getBlockColor(CONFIG.baseHeight, userColor) 
      },
      phase: GamePhase.SKYSCRAPER,
      score: 0,
      validForLeaderboard: true,
    });
  };

  const handleKeepGoing = () => {
    if (credits < 300) return;
    setCredits(credits - 300);
    
    setInternalState(prev => {
        const topBlock = prev.stack[prev.stack.length - 1];
        const nextHeight = (prev.stack.length) * CONFIG.blockHeight;
        
        return {
            ...prev,
            phase: GamePhase.SKYSCRAPER,
            validForLeaderboard: false,
            currentBlock: {
                position: [topBlock.position[0], nextHeight, topBlock.position[2]],
                size: [topBlock.size[0], topBlock.size[1], topBlock.size[2]],
                color: getBlockColor(prev.stack.length, userColor)
            }
        };
    });
  };

  const handleQuit = () => {
    onComplete({
        id: Date.now().toString(),
        lotIndex,
        score: internalState.score,
        height: internalState.stack.length,
        blocks: internalState.stack,
        baseStatus: 'PRE_BUILT', 
        timestamp: Date.now(),
        validForLeaderboard: internalState.validForLeaderboard,
        plateType: plateType
    });
  };

  const handleShare = (e: React.MouseEvent) => {
      e.stopPropagation();
      const url = new URL(window.location.href);
      url.searchParams.set('lot', lotIndex.toString());
      url.searchParams.set('score', internalState.score.toString());
      url.searchParams.set('challenger', userName);
      url.searchParams.set('color', userColor.replace('#', ''));
      navigator.clipboard.writeText(url.toString());
      setJustShared(true);
      setTimeout(() => setJustShared(false), 2000);
  }

  const isHighScore = internalState.score > bestScore && internalState.validForLeaderboard;

  // Level Info Config
  const levelInfo = {
      1: { name: 'Urban Layer', icon: Building2, height: '0 - 120m' },
      2: { name: 'Crane Layer', icon: Construction, height: '120 - 240m' },
      3: { name: 'Sky Layer', icon: Bird, height: '240 - 360m' },
      4: { name: 'High Altitude', icon: Plane, height: '360 - 480m' },
      5: { name: 'Stratosphere', icon: Cloud, height: '480m+' },
  }[heightLevel as 1|2|3|4|5] || { name: 'Unknown', icon: Building2, height: '' };

  const CurrentIcon = levelInfo.icon;
  const plateConfig = PLATE_STATS[plateType];

  return (
    <div className={`relative w-full h-full ${theme === 'ISO' ? 'bg-sky-200' : 'bg-slate-900'}`} onClick={performStack}>
      {/* HUD Score */}
      <div className="absolute top-12 left-0 w-full flex flex-col items-center pointer-events-none z-10">
        <h2 className={`${theme === 'ISO' ? 'text-slate-800/60' : 'text-white/60'} text-lg font-light uppercase tracking-[0.2em] mb-1`}>Score</h2>
        <h1 className={`text-8xl font-black ${theme === 'ISO' ? 'text-slate-900 drop-shadow-xl' : 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]'} transition-all duration-200 ${perfectMatch ? 'scale-110 text-yellow-500' : ''}`}>
            {internalState.score}
        </h1>
        {internalState.phase !== GamePhase.GAME_OVER && (
            <div className={`${theme === 'ISO' ? 'text-slate-600' : 'text-white/40'} text-sm font-medium tracking-wide`}>
                Best: {Math.max(bestScore, internalState.score)}
            </div>
        )}
      </div>

      {/* HUD Credits & Level */}
      <div className="absolute top-6 right-6 z-10 flex flex-col items-end gap-3 pointer-events-none">
          <div className={`px-4 py-2 rounded-full border backdrop-blur-md ${theme === 'ISO' ? 'bg-white/80 border-white shadow-lg' : 'bg-slate-800/80 border-slate-700'}`}>
             <span className="text-yellow-500 font-bold mr-1">Credits:</span> 
             <span className={theme === 'ISO' ? 'text-slate-900' : 'text-white'}>{credits}</span>
          </div>

          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md transition-all duration-500 ${theme === 'ISO' ? 'bg-white/90 border-white shadow-xl' : 'bg-slate-900/90 border-slate-700'}`}>
             <div className={`p-2 rounded-full ${theme === 'ISO' ? 'bg-sky-100 text-sky-600' : 'bg-slate-800 text-cyan-400'}`}>
                 <CurrentIcon size={20} />
             </div>
             <div className="text-right">
                 <div className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'ISO' ? 'text-slate-400' : 'text-slate-500'}`}>Altitude Level {heightLevel}</div>
                 <div className={`font-bold leading-none ${theme === 'ISO' ? 'text-slate-800' : 'text-white'}`}>{levelInfo.name}</div>
                 <div className={`text-[10px] ${theme === 'ISO' ? 'text-slate-500' : 'text-slate-400'}`}>{levelInfo.height}</div>
             </div>
          </div>
          
           {/* Plate Badge */}
           <div className={`px-3 py-1 rounded-lg border bg-black/50 backdrop-blur-md border-white/10 flex items-center gap-2`}>
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: plateConfig.color }} />
                <div className="text-[10px] font-mono text-white/70">
                    BASE: {plateConfig.name} (Max {plateConfig.maxHeight})
                </div>
           </div>
      </div>

      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[12, 12, 12]} fov={45} />
        <GameScene 
            internalState={internalState} 
            setInternalState={setInternalState} 
            activeBlockRef={activeBlockRef} 
            userColor={userColor}
            theme={theme}
            setHeightLevel={setHeightLevel}
            plateType={plateType}
            logoId={logoId}
        />
      </Canvas>

      {/* --- GAME OVER UI --- */}
      {internalState.phase === GamePhase.GAME_OVER && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-500">
           <div className="text-center mb-12">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mb-4">
                  {internalState.failReason || 'Score submitted!'}
              </div>
              
              <div className="text-slate-400 text-sm uppercase tracking-widest mb-1">Score</div>
              <div className="text-8xl font-black text-white mb-6 drop-shadow-2xl">{internalState.score}</div>
              
              <div className="text-slate-500 text-sm uppercase tracking-widest mb-1">Best</div>
              <div className="text-4xl font-bold text-white mb-4">{Math.max(bestScore, internalState.score)}</div>

              {internalState.failReason && internalState.failReason.includes('Limit') && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 justify-center mb-4">
                      <AlertTriangle size={14} /> Upgrade Plate to build higher!
                  </div>
              )}
              
              {isHighScore && (
                <div className="inline-block bg-green-500/10 text-green-400 px-4 py-2 rounded-full text-xs font-bold border border-green-500/20 animate-bounce">
                    High score updated!
                </div>
              )}
           </div>

           <div className="flex flex-col gap-3 w-72">
              <div className="flex gap-2">
                  <button 
                     onClick={(e) => { e.stopPropagation(); handleRestart(); }}
                     className="flex-1 flex items-center justify-center gap-2 py-4 bg-white text-slate-900 rounded-2xl font-bold hover:bg-slate-200 transition active:scale-95 shadow-lg shadow-white/10"
                  >
                     <RotateCcw size={20} /> Replay
                  </button>
                  <button 
                     onClick={handleShare}
                     className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 transition active:scale-95 shadow-lg"
                  >
                     <Share2 size={20} /> {justShared ? 'Copied!' : 'Share'}
                  </button>
              </div>

              <button 
                 onClick={(e) => { e.stopPropagation(); handleQuit(); }}
                 className="flex items-center justify-center gap-2 w-full py-4 bg-slate-800 text-slate-200 rounded-2xl font-bold hover:bg-slate-700 hover:text-white transition active:scale-95"
              >
                 <Home size={20} /> Back to Home
              </button>

              <button 
                 onClick={(e) => { e.stopPropagation(); handleKeepGoing(); }}
                 disabled={credits < 300 || (internalState.failReason && internalState.failReason.includes('Limit'))}
                 className={`flex items-center justify-center gap-2 w-full py-4 mt-6 rounded-2xl border transition group
                    ${credits >= 300 && !(internalState.failReason && internalState.failReason.includes('Limit'))
                        ? 'bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500 hover:text-white cursor-pointer' 
                        : 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed'}`}
              >
                 <Play className={credits >= 300 ? "fill-slate-300 group-hover:fill-white" : "fill-slate-600"} size={20} />
                 <span className="font-semibold">Keep going? 300 credits</span>
              </button>
           </div>
        </div>
      )}
    </div>
  );
}

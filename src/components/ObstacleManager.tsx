import React, { useRef, useState, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGameStore } from "../store";
import { Group, Box3, Vector3 } from "three";
import { Sparkles } from "@react-three/drei";

const LANE_WIDTH = 3;
const SPAWN_Z = -50;
const DESPAWN_Z = 10;

interface ObstacleData {
  id: number;
  type: "jump" | "duck" | "block" | "energy";
  subtype: string;
  lane: number; // -1, 0, 1
  z: number;
  hit: boolean;
}

const TreeObstacle = () => {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (ref.current) {
        ref.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });
  return (
    <group ref={ref} position={[0, 0.5, 0]}>
        {/* Trunk */}
        <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.2, 0.3, 1]} />
            <meshStandardMaterial color="#8B4513" />
        </mesh>
        {/* Leaves */}
        <mesh position={[0, 1.5, 0]}>
            <coneGeometry args={[0.8, 1.5, 8]} />
            <meshStandardMaterial color="#228B22" />
        </mesh>
    </group>
  );
};

const AnimalObstacle = () => {
    const ref = useRef<Group>(null);
    useFrame((state) => {
        if (ref.current) {
            ref.current.position.y = 2.5 + Math.sin(state.clock.elapsedTime * 6) * 0.3;
        }
    });

    return (
      <group ref={ref}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.4]} />
          <meshStandardMaterial color="#FF6347" />
        </mesh>
        <mesh position={[0.3, 0.2, 0]}>
          <sphereGeometry args={[0.25]} />
          <meshStandardMaterial color="#FF6347" />
        </mesh>
      </group>
    );
};

const HouseObstacle = () => {
    const ref = useRef<Group>(null);
    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
        }
    });
    return (
        <group ref={ref} position={[0, 1.5, 0]}>
            <mesh>
                <boxGeometry args={[2.5, 3, 2.5]} />
                <meshStandardMaterial color="#DAA520" />
            </mesh>
            <mesh position={[0, 2, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[2, 1.5, 4]} />
                <meshStandardMaterial color="#A52A2A" />
            </mesh>
        </group>
    );
};

const CarObstacle = () => (
    <group position={[0, 0.5, 0]}>
        <mesh>
            <boxGeometry args={[2, 1, 3]} />
            <meshStandardMaterial color="blue" />
        </mesh>
        <mesh position={[0.7, -0.3, 0.8]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.3, 0.3, 0.2]} />
            <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[-0.7, -0.3, 0.8]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.3, 0.3, 0.2]} />
            <meshStandardMaterial color="black" />
        </mesh>
    </group>
);

const LionObstacle = () => (
    <group position={[0, 0.5, 0]}>
        <mesh>
            <boxGeometry args={[1.5, 1.5, 2]} />
            <meshStandardMaterial color="orange" />
        </mesh>
        <mesh position={[0, 1, 0]}>
            <sphereGeometry args={[0.6]} />
            <meshStandardMaterial color="yellow" />
        </mesh>
    </group>
);

const WaterfallObstacle = () => (
    <group position={[0, 1.5, 0]}>
        <mesh>
            <boxGeometry args={[4, 4, 0.2]} />
            <meshStandardMaterial color="cyan" transparent opacity={0.6} />
        </mesh>
    </group>
);

const LavaObstacle = () => (
    <group position={[0, 0.1, 0]}>
        <mesh>
            <boxGeometry args={[3, 0.2, 3]} />
            <meshStandardMaterial color="#FF4500" emissive="#FF0000" emissiveIntensity={2} />
        </mesh>
    </group>
);

const RockFallObstacle = () => (
    <group position={[0, 2, 0]}>
        <mesh position={[0, 0, 0]}>
            <dodecahedronGeometry args={[0.5]} />
            <meshStandardMaterial color="#555" />
        </mesh>
        <mesh position={[0.4, 0.3, 0]}>
             <dodecahedronGeometry args={[0.3]} />
            <meshStandardMaterial color="#666" />
        </mesh>
    </group>
);

const HurricaneObstacle = () => {
    const ref = useRef<Group>(null);
    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y += 0.2;
        }
    });
    return (
        <group ref={ref} position={[0, 1, 0]}>
            <mesh>
                <coneGeometry args={[1.5, 3, 16]} />
                <meshStandardMaterial color="#888" transparent opacity={0.3} />
            </mesh>
        </group>
    );
};

export const ObstacleManager = ({ colors }: { colors?: any }) => {
  const {
    speed,
    screen,
    distance,
    isFeverMode,
    loseLife,
    addEnergy,
    addScore,
    isTransitioning,
    isAutoplay,
    lane,
    setLane,
  } = useGameStore();

  const { scene } = useThree();
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const nextSpawnZ = useRef(SPAWN_Z);
  const idCounter = useRef(0);

  const playerBox = useMemo(() => new Box3(), []);
  const obstacleBox = useMemo(() => new Box3(), []);

  useFrame((_, delta) => {
    if (screen === 'PAUSED' || screen === 'GAME_OVER' || isTransitioning) return;

    // Move obstacles
    const distanceToMove = speed * delta;
    
    // Defer store updates
    const deferredActions: Array<() => void> = [];
    
    // Autoplay logic
    if (isAutoplay) {
      const blockedLanes = obstacles
        .filter(obs => obs.z > 2 && obs.z < 8)
        .map(obs => obs.lane);
      
      const safeLanes = [-1, 0, 1].filter(l => !blockedLanes.includes(l));
      if (safeLanes.length > 0 && !safeLanes.includes(lane)) {
        let bestLane = safeLanes[0];
        let minDistance = Math.abs(safeLanes[0] - lane);
        for (let i = 1; i < safeLanes.length; i++) {
           const dist = Math.abs(safeLanes[i] - lane);
           if (dist < minDistance) {
              minDistance = dist;
              bestLane = safeLanes[i];
           }
        }
        if (lane !== bestLane) {
          deferredActions.push(() => setLane(bestLane));
        }
      }
    }

    setObstacles((prev) => {
      let nextState = [...prev];
      let hasChanges = false;

      // Update positions
      for (let i = 0; i < nextState.length; i++) {
        nextState[i].z += distanceToMove;
        hasChanges = true;
      }

      // Despawn old obstacles
      if (nextState.length > 0 && nextState[0].z > DESPAWN_Z) {
        nextState.shift();
        hasChanges = true;
      }

      // Check collision
      const playerNode = scene.getObjectByName("playerNode");
      if (playerNode) {
        // Approximate player bounding box based on its actual position
        // Player is at Player.tsx: groupRef (y varies with jump/duck)
        const pPos = playerNode.position;
        // The hitbox is roughly 1 unit wide, 2 units high
        // Reduce height if ducking (pPos.y ~ 0.5)
        const height = pPos.y < 0.8 ? 0.8 : 2.0;
        playerBox.min.set(pPos.x - 0.5, pPos.y - 0.5, pPos.z - 0.5);
        playerBox.max.set(pPos.x + 0.5, pPos.y - 0.5 + height, pPos.z + 0.5);

        for (let i = 0; i < nextState.length; i++) {
          const obs = nextState[i];
          if (obs.hit || obs.z < 2 || obs.z > 8) continue; // Only check when near player (Z=5)

          // Approximate obstacle box
          const centerX = obs.lane * LANE_WIDTH;

          if (obs.type === "jump") {
            // jump: tree=0.5, lion=0.75, waterfall=2
            const halfW = obs.subtype === "tree" ? 0.5 : obs.subtype === "lion" ? 0.75 : 2;
            const height = obs.subtype === "tree" ? 2.5 : obs.subtype === "lion" ? 1.5 : 4;
            obstacleBox.min.set(centerX - halfW, 0, obs.z - 0.5);
            obstacleBox.max.set(centerX + halfW, height, obs.z + 0.5);
          } else if (obs.type === "duck") {
            // duck: animal=0.5, car=1.0, rockfall=0.5, hurricane=1.5
            const halfW = obs.subtype === "animal" ? 0.5 : obs.subtype === "car" ? 1.0 : obs.subtype === "rockfall" ? 0.5 : 1.5;
            const height = obs.subtype === "animal" ? 3.2 : obs.subtype === "car" ? 1.5 : obs.subtype === "rockfall" ? 2.5 : 3.0;
            obstacleBox.min.set(centerX - halfW, 2.2, obs.z - 0.5);
            obstacleBox.max.set(centerX + halfW, height, obs.z + 0.5);
          } else if (obs.type === "block") {
            // block: house=1.25, waterfall=2.0, lava=1.5
            const halfW = obs.subtype === "house" ? 1.25 : obs.subtype === "lava" ? 1.5 : 2.0;
            const height = obs.subtype === "house" ? 4 : obs.subtype === "lava" ? 0.2 : 4;
            obstacleBox.min.set(centerX - halfW, 0, obs.z - 1.25);
            obstacleBox.max.set(centerX + halfW, height, obs.z + 1.25);
          } else if (obs.type === "energy") {
            // energy: octahedronGeometry(0.5) position={[0, 1.5, 0]} -> minY = 1, maxY = 2
            obstacleBox.min.set(centerX - 0.5, 1, obs.z - 0.5);
            obstacleBox.max.set(centerX + 0.5, 2, obs.z + 0.5);
          }

          if (playerBox.intersectsBox(obstacleBox)) {
            obs.hit = true;
            if (obs.type === "energy") {
              deferredActions.push(() => addEnergy(10));
              if (!isAutoplay) deferredActions.push(() => addScore(50));
            } else {
              if (isFeverMode) {
                // Smash through!
                if (!isAutoplay) deferredActions.push(() => addScore(100));
              } else {
                deferredActions.push(() => loseLife());
              }
            }
          }
        }
      }

      // Spawn new obstacles
      if (
        nextState.length === 0 ||
        nextState[nextState.length - 1].z > SPAWN_Z + 15
      ) {
        // determine type
        const rand = Math.random();
        let type: ObstacleData["type"] = "block";
        let subtype = "house";
        
        const stage = Math.floor(distance / 100);
        
        if (stage === 0) {
            if (rand < 0.2) { type = "jump"; subtype = "tree"; }
            else if (rand < 0.4) { type = "duck"; subtype = "animal"; }
            else if (rand < 0.7) { type = "energy"; subtype = "coin"; }
            else { type = "block"; subtype = "house"; }
        } else if (stage === 1) {
            if (rand < 0.3) { type = "jump"; subtype = "lion"; }
            else if (rand < 0.6) { type = "duck"; subtype = "car"; }
            else if (rand < 0.8) { type = "block"; subtype = "house"; }
            else { type = "energy"; subtype = "coin"; }
        } else if (stage === 2) {
             if (rand < 0.3) { type = "jump"; subtype = "waterfall"; }
            else if (rand < 0.6) { type = "duck"; subtype = "rockfall"; }
            else if (rand < 0.8) { type = "block"; subtype = "lava"; }
            else { type = "energy"; subtype = "coin"; }
        } else {
             if (rand < 0.3) { type = "jump"; subtype = "hurricane"; }
            else if (rand < 0.6) { type = "duck"; subtype = "rockfall"; }
            else if (rand < 0.8) { type = "block"; subtype = "lava"; }
            else { type = "energy"; subtype = "coin"; }
        }

        let lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1

        nextState.push({
          id: idCounter.current++,
          type,
          subtype,
          lane,
          z: SPAWN_Z,
          hit: false,
        });

        // Add extra obstacle sometimes for difficulty
        if (Math.random() > 0.5 && type !== "energy") {
          let lane2 = Math.floor(Math.random() * 3) - 1;
          if (lane2 !== lane) {
            nextState.push({
              id: idCounter.current++,
              type: "energy",
              subtype: "coin",
              lane: lane2,
              z: SPAWN_Z,
              hit: false,
            });
          }
        }

        hasChanges = true;
        // Every successful spawn tick increases score slightly
        if (screen === 'PLAYING' && !isAutoplay) deferredActions.push(() => addScore(1));
      }

      return hasChanges ? nextState : prev;
    });

    if (deferredActions.length > 0) {
      setTimeout(() => {
        deferredActions.forEach((a) => a());
      }, 0);
    }
  });

  return (
    <group>
      {obstacles.map((obs) => {
        if (obs.hit && obs.type === "energy") return null; // hide collected energy

        const x = obs.lane * LANE_WIDTH;

        // Show explosion sparkles if hit
        if (obs.hit && obs.type !== "energy") {
          return (
            <group key={obs.id} position={[x, 1.5, obs.z]}>
               <Sparkles count={50} speed={2} opacity={1} color="red" size={5} scale={[3, 3, 3]} />
            </group>
          );
        }

        return (
          <group key={obs.id} position={[x, 0, obs.z]}>
            {obs.type === "jump" && obs.subtype === "tree" && <TreeObstacle />}
            {obs.type === "jump" && obs.subtype === "lion" && <LionObstacle />}
            {obs.type === "jump" && obs.subtype === "waterfall" && <WaterfallObstacle />}
            {obs.type === "jump" && obs.subtype === "hurricane" && <HurricaneObstacle />}
            {obs.type === "duck" && obs.subtype === "animal" && <AnimalObstacle />}
            {obs.type === "duck" && obs.subtype === "car" && <CarObstacle />}
            {obs.type === "duck" && obs.subtype === "rockfall" && <RockFallObstacle />}
            {obs.type === "block" && obs.subtype === "house" && <HouseObstacle />}
            {obs.type === "block" && obs.subtype === "lava" && <LavaObstacle />}
            {obs.type === "energy" && (
              <mesh
                position={[0, 1.5, 0]}
                rotation={[Math.PI / 4, Math.PI / 4, 0]}
              >
                <octahedronGeometry args={[0.5]} />
                <meshStandardMaterial
                  color="#00ff00"
                  emissive="#00ff00"
                  emissiveIntensity={1}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};

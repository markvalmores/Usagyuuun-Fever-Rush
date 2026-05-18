import React, { Suspense, useEffect, useState } from "react";
import { Canvas, useThree, useLoader } from "@react-three/fiber";
import { TextureLoader, Color, FogExp2 } from "three";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
} from "@react-three/postprocessing";
import { Player } from "./Player";
import { Corridor } from "./Environment";
import { ObstacleManager } from "./ObstacleManager";
import { useGameStore } from "../store";
import { BlendFunction } from "postprocessing";

const SceneSetup = ({ colors, isFeverMode }: { colors: any, isFeverMode: boolean }) => {
  const { scene } = useThree();

  useEffect(() => {
    if (isFeverMode) {
      scene.background = new Color("#0a001a");
      scene.fog = new FogExp2("#0a001a", 0.04);
    } else {
      scene.background = new Color(colors?.wallColor || "#cceeff");
      scene.fog = new FogExp2(colors?.wallColor || "#cceeff", 0.04);
    }
  }, [colors, isFeverMode, scene]);

  return null;
};

const BackgroundImage = ({ image }: { image: string }) => {
    const texture = useLoader(TextureLoader, image);
    return (
        <mesh position={[0, 5, -30]}>
            <planeGeometry args={[120, 80]} />
            <meshBasicMaterial map={texture} depthWrite={false} />
        </mesh>
    );
};

export const GameScene = () => {
  const { isFeverMode, distance, screen, setTransitioning, isTransitioning } = useGameStore();
  const [colors, setColors] = useState<any>(null);
  const [themeName, setThemeName] = useState<string>("");
  const [stageLevel, setStageLevel] = useState(1);
  const [fetching, setFetching] = useState(false);

    // Check distance and update stage
  useEffect(() => {
     if (screen !== 'PLAYING' || fetching || isTransitioning) return;
     // stage goes up every 100m
     const newLevel = Math.floor(distance / 100) + 1;
     
     const generateLocalColors = (level: number) => {
        const hue = ((level - 1) * 35) % 360;
        const themeNames = ["Nature Field", "Deep Forest", "Mountain Peak", "Sunlit Valley"];
        const weathers = ["stars", "rain", "snow", "none"];
        
        return {
            themeName: themeNames[(level - 1) % themeNames.length],
            wallColor: `hsl(${hue}, 70%, 10%)`,
            floorColor: `hsl(${hue}, 70%, 5%)`,
            gridColor: `hsl(${hue}, 100%, 50%)`,
            weather: weathers[(level - 1) % weathers.length],
            backgroundImage: null, // No external image
            obstacleColors: {
                jump: `hsl(${(hue + 60) % 360}, 100%, 60%)`,
                duck: `hsl(${(hue + 120) % 360}, 100%, 60%)`,
                block: `hsl(${(hue + 180) % 360}, 100%, 60%)`
            }
        };
    };

     if (newLevel > stageLevel) {
        setFetching(true);
        setTransitioning(true);
        // fetch new colors
        fetch("/api/generate-stage", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ level: newLevel, distance })
        }).then(res => res.json())
        .then(data => {
            if (data && data.wallColor) {
               setColors(data);
               setThemeName(data.themeName || `Stage ${newLevel}`);
               setStageLevel(newLevel);
            } else {
               throw new Error("Invalid stage data");
            }
            // give a brief pause
            setTimeout(() => {
               setTransitioning(false);
               setFetching(false);
            }, 1000); // 1 second screen wipe duration
        }).catch(err => {
            console.error("Failed to generate stage from server, generating locally", err);
            const localColors = generateLocalColors(newLevel);
            setColors(localColors);
            setThemeName(localColors.themeName);
            setStageLevel(newLevel);
            setTransitioning(false);
            setFetching(false);
        });
     }
  }, [distance, screen, stageLevel, fetching, isTransitioning, setTransitioning]);

  // Reset stage when starting a new game (distance becomes 0)
  useEffect(() => {
    if (distance === 0 && screen === 'PLAYING') {
      setStageLevel(1);
      setColors(null);
      setThemeName("");
    }
  }, [distance, screen]);

  return (
    <>
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          {themeName && screen === 'PLAYING' && !isFeverMode && (
              <div className="text-cyan-400 font-black italic uppercase tracking-[0.5em] text-sm animate-pulse drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] opacity-50">
                  {themeName}
              </div>
          )}
      </div>
      <Canvas
        camera={{ position: [0, 4, 12], fov: 60 }}
        gl={{ antialias: false }} // Postprocessing might handle it, or we leave it off for performance
      >
        <SceneSetup colors={colors} isFeverMode={isFeverMode} />

        <ambientLight intensity={isFeverMode ? 0.2 : 0.8} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={isFeverMode ? 0.5 : 1.5}
        />
        {isFeverMode && (
          <pointLight
            position={[0, 5, 0]}
            intensity={2}
            color="#ff00ff"
            distance={30}
          />
        )}

        <Suspense fallback={null}>
          {colors?.backgroundImage && !isFeverMode && <BackgroundImage image={colors.backgroundImage} />}
          <Player />
          <Corridor colors={colors} />
          <ObstacleManager colors={colors} />
        </Suspense>

        <EffectComposer>
          <Bloom
            luminanceThreshold={isFeverMode ? 0.1 : 0.8}
            luminanceSmoothing={0.9}
            intensity={isFeverMode ? 2.5 : 0.5}
          />
          {isFeverMode && (
            <ChromaticAberration
              blendFunction={BlendFunction.NORMAL}
              offset={[0.02, 0.02] as any}
            />
          )}
        </EffectComposer>
      </Canvas>
    </>
  );
};

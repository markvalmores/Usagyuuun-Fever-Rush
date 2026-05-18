import React, { useState, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, Group, Color } from "three";
import { useGameStore } from "../store";
import { playSound } from "../AudioManager";
import { Trail } from "@react-three/drei";

const LANE_WIDTH = 3;

export const Player = () => {
  const [isDucking, setIsDucking] = useState(false);
  const [isMovingLeft, setIsMovingLeft] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [isMovingRight, setIsMovingRight] = useState(false);
  
  const groupRef = useRef<Group>(null);
  const spriteRef = useRef<any>(null); // To scale the sprite

  const jumpStartTime = useRef(0);
  const duckStartTime = useRef(0);
  const moveStartTime = useRef(0);
  const tiltRef = useRef(0);
  const hitStartTime = useRef(0);

  const { isFeverMode, screen, speed, triggerFever, lives, loseLife, toggleAutoplay, lane, setLane } = useGameStore();
  const [isDead, setIsDead] = useState(false);
  const laneRef = useRef(lane);
  useEffect(() => { laneRef.current = lane; }, [lane]);
  const prevLives = useRef(lives);

  useEffect(() => {
    if (lives === 0 && prevLives.current > 0) {
        setIsDead(true);
    }
    prevLives.current = lives;
  }, [lives]);

  useEffect(() => {
    let lastTiltLane = 0;

    const handleMoveLeft = () => {
        if (laneRef.current - 1 < -1) {
          loseLife();
        } else {
          playSound("jump");
          setIsMovingLeft(true);
          moveStartTime.current = performance.now();
          setTimeout(() => setIsMovingLeft(false), 200);
          setLane(laneRef.current - 1);
        }
    };

    const handleMoveRight = () => {
        if (laneRef.current + 1 > 1) {
          loseLife();
        } else {
          playSound("jump");
          setIsMovingRight(true);
          moveStartTime.current = performance.now();
          setTimeout(() => setIsMovingRight(false), 200);
          setLane(laneRef.current + 1);
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'PLAYING') return;
      if (e.key === "p" || e.key === "P") toggleAutoplay();
      if (e.key === "ArrowLeft" || e.key === "a") handleMoveLeft();
      if (e.key === "ArrowRight" || e.key === "d") handleMoveRight();
      if (e.key === "ArrowUp" || e.key === "w") handleJump();
      if (e.key === "ArrowDown" || e.key === "s") handleDuck();
      if (e.key === " ") triggerFever();
    };

    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (screen !== 'PLAYING') return;
      const gamma = e.gamma || 0; // Left-to-right
      const beta = e.beta || 0; // up-down

      if (gamma < -15 && lastTiltLane !== -1) {
        setLane(-1);
        lastTiltLane = -1;
        playSound("jump");
      } else if (gamma > 15 && lastTiltLane !== 1) {
        setLane(1);
        lastTiltLane = 1;
        playSound("jump");
      } else if (gamma >= -5 && gamma <= 5 && lastTiltLane !== 0) {
        setLane(0);
        lastTiltLane = 0;
      }

      // Simple jump/duck based on tilt
      if (beta > 60) handleJump();
      if (beta < 30) handleDuck();
    };

    // ... rest

    const handleTouch = (e: TouchEvent) => {
      if (screen === 'PLAYING') {
        triggerFever();
      }
    };

    let prevGamepadState = {
      left: false,
      right: false,
      up: false,
      down: false,
      rb: false,
    };

    const checkGamepad = () => {
      if (screen !== 'PLAYING') return;
      const gamepads = navigator.getGamepads();
      for (const gp of gamepads) {
        if (!gp) continue;

        const left = gp.buttons[14]?.pressed || gp.axes[0] < -0.5;
        const right = gp.buttons[15]?.pressed || gp.axes[0] > 0.5;
        const up = gp.buttons[12]?.pressed || gp.axes[1] < -0.5;
        const down = gp.buttons[13]?.pressed || gp.axes[1] > 0.5;
        const rb = gp.buttons[5]?.pressed;

        if (rb && !prevGamepadState.rb) toggleAutoplay();
        if (left && !prevGamepadState.left) handleMoveLeft();
        if (right && !prevGamepadState.right) handleMoveRight();

        if (up && !prevGamepadState.up) handleJump();
        if (down && !prevGamepadState.down) handleDuck();

        prevGamepadState = { left, right, up, down, rb };

        // A / X / B for fever (buttons 0, 1, 2)
        if (
          gp.buttons[0]?.pressed ||
          gp.buttons[1]?.pressed ||
          gp.buttons[2]?.pressed
        ) {
          triggerFever();
        }
      }
      requestAnimationFrame(checkGamepad);
    };

    let gamepadRaf = requestAnimationFrame(checkGamepad);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("deviceorientation", handleDeviceOrientation);
    window.addEventListener("touchstart", handleTouch);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("deviceorientation", handleDeviceOrientation);
      window.removeEventListener("touchstart", handleTouch);
      cancelAnimationFrame(gamepadRaf);
    };
  }, [screen, triggerFever]);

  const handleJump = () => {
    if (!isJumping && !isDucking && screen === 'PLAYING') {
      playSound("jump");
      setIsJumping(true);
      jumpStartTime.current = performance.now();
      setTimeout(() => setIsJumping(false), 500); // 0.5s jump
    }
  };

  const handleDuck = () => {
    if (!isJumping && !isDucking && screen === 'PLAYING') {
      playSound("duck");
      setIsDucking(true);
      duckStartTime.current = performance.now();
      setTimeout(() => setIsDucking(false), 500); // 0.5s duck
    }
  };

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Smooth lane shift
    const targetX = lane * LANE_WIDTH;
    groupRef.current.position.x = MathUtils.lerp(
      groupRef.current.position.x,
      targetX,
      delta * 15,
    );

    // Jump arc and Duck squish
    let targetY = 1; // base height
    let scaleY = 2.5; // base sprite scale y
    let scaleX = 2.5; // base sprite scale x
    
    if (isJumping) {
      const elapsed = performance.now() - jumpStartTime.current;
      const progress = Math.min(elapsed / 500, 1); // 0 to 1
      targetY = 1 + Math.sin(progress * Math.PI) * 2;
      
      // Slight stretch while jumping
      scaleY = 2.5 + Math.sin(progress * Math.PI) * 0.5;
      scaleX = 2.5 - Math.sin(progress * Math.PI) * 0.3;
    } else if (isDucking) {
      const elapsed = performance.now() - duckStartTime.current;
      const progress = Math.min(elapsed / 500, 1); // 0 to 1
      targetY = 0.5;
      
      // Squish while ducking
      scaleY = 2.5 - Math.sin(progress * Math.PI) * 1.5;
      scaleX = 2.5 + Math.sin(progress * Math.PI) * 0.5;
    }
    
    groupRef.current.position.y = MathUtils.lerp(
      groupRef.current.position.y,
      targetY,
      delta * 20,
    );
    
    if (spriteRef.current) {
        spriteRef.current.scale.set(scaleX, scaleY, 1);
    }

    // Give it a run wobble
    if (!isJumping && !isDucking) {
      groupRef.current.position.y =
        1 + Math.sin(state.clock.elapsedTime * speed * 0.5) * 0.2;
    }

    // Roll / Tilt effect when changing lanes
    let extraTilt = 0;
    if (isMovingLeft || isMovingRight) {
        const elapsed = performance.now() - moveStartTime.current;
        const progress = Math.min(elapsed / 200, 1);
        // extra jump arc for move
        if (!isJumping) {
            groupRef.current.position.y += Math.sin(progress * Math.PI) * 0.5;
        }
        // extra tilt for move
        extraTilt = Math.sin(progress * Math.PI) * (isMovingLeft ? 0.3 : -0.3);
    }

    if (isDead) {
        groupRef.current.rotation.z += delta * 5;
        groupRef.current.position.y -= delta * 5;
        return;
    }

    const tiltTarget = (groupRef.current.position.x - targetX) * 0.15 + extraTilt;
    tiltRef.current = MathUtils.lerp(tiltRef.current, tiltTarget, delta * 15);
    // Apply tilt to the sprite slightly
    if (spriteRef.current) {
        // group tilt + lean tilt
        groupRef.current.rotation.z = tiltRef.current;
        spriteRef.current.material.rotation = tiltRef.current * 0.5; // tilt texture visually
        
        // hit flash
        const timeSinceHit = performance.now() - hitStartTime.current;
        if (timeSinceHit < 300) {
            // blink red every 50ms
            if (Math.floor(timeSinceHit / 50) % 2 === 0) {
               spriteRef.current.material.color.setHex(0xff0000);
            } else {
               spriteRef.current.material.color.setHex(0xffffff);
            }
        } else {
            spriteRef.current.material.color.setHex(0xffffff);
        }
    }
  });

  return (
    <group name="playerNode" ref={groupRef} position={[0, 1, 5]}>
      {/* Shadow */}
      <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>

      {/* Sprite / Billboard for character */}
      <Trail
        width={3}
        length={4}
        color={isFeverMode ? new Color(0xff00ff) : new Color(0x00ffff)}
        attenuation={(t) => t * t}
        target={groupRef}
      />
      <mesh ref={spriteRef} scale={[2.5, 2.5, 1]} position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="white" />
      </mesh>

      {/* Fever Glow */}
      {isFeverMode && (
        <pointLight color="#00ffff" distance={10} intensity={5} />
      )}
    </group>
  );
};

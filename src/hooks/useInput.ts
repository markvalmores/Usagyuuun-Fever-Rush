import { useEffect, useRef } from "react";

export const useInput = () => {
  const inputRef = useRef({
    laneDirection: 0, // -1, 0, 1
    jump: false,
    duck: false,
    fever: false,
  });

  useEffect(() => {
    let ignoreTiltUntilStable = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a")
        inputRef.current.laneDirection = -1;
      if (e.key === "ArrowRight" || e.key === "d")
        inputRef.current.laneDirection = 1;
      if (e.key === "ArrowUp" || e.key === "w") inputRef.current.jump = true;
      if (e.key === "ArrowDown" || e.key === "s") inputRef.current.duck = true;
      if (e.key === " ") inputRef.current.fever = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // For one-off presses, we usually reset after consuming them.
    };

    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      const tiltThresholdX = 15; // degrees tilt left/right
      const tiltThresholdY = 15; // degrees tilt up/down

      const gamma = e.gamma || 0; // Left-to-right tilt
      const beta = e.beta || 0; // Front-to-back tilt

      if (gamma < -tiltThresholdX) inputRef.current.laneDirection = -1;
      else if (gamma > tiltThresholdX) inputRef.current.laneDirection = 1;

      if (beta < 45 - tiltThresholdY)
        inputRef.current.duck = true; // adjust based on typical phone hold angle (~45 deg)
      else if (beta > 45 + tiltThresholdY) inputRef.current.jump = true;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("deviceorientation", handleDeviceOrientation);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("deviceorientation", handleDeviceOrientation);
    };
  }, []);

  return inputRef;
};

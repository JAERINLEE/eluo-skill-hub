"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface BackgroundBeamsWithCollisionProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface BeamConfig {
  initialX: number;
  translateX: number;
  duration: number;
  initialY: number;
  translateY: string;
  className?: string;
  delay?: number;
}

const BEAM_CONFIGS: BeamConfig[] = [
  { initialX: 10,   translateX: 10,   duration: 7,  initialY: -200, translateY: "1800px", className: "h-6" },
  { initialX: 600,  translateX: 600,  duration: 3,  initialY: -200, translateY: "1800px", delay: 4, className: "h-6" },
  { initialX: 100,  translateX: 100,  duration: 7,  initialY: -200, translateY: "1800px", delay: 2 },
  { initialX: 400,  translateX: 400,  duration: 5,  initialY: -200, translateY: "1800px", delay: 3, className: "h-20" },
  { initialX: 800,  translateX: 800,  duration: 11, initialY: -200, translateY: "1800px" },
  { initialX: 1000, translateX: 1000, duration: 4,  initialY: -200, translateY: "1800px", className: "h-12" },
  { initialX: 1200, translateX: 1200, duration: 6,  initialY: -200, translateY: "1800px", delay: 2, className: "h-6" },
];

export function BackgroundBeamsWithCollision({
  children,
  className,
  style,
}: BackgroundBeamsWithCollisionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const parentRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={parentRef}
      style={style}
      className={cn(
        "h-screen bg-gradient-to-b from-white to-neutral-100 relative flex items-center w-full justify-center overflow-hidden",
        className
      )}
    >
      {BEAM_CONFIGS.map((beam, idx) => (
        <CollisionMechanism
          key={`beam-${idx}`}
          containerRef={containerRef}
          parentRef={parentRef}
          {...beam}
        />
      ))}
      {children}
      <div
        ref={containerRef}
        className="absolute bottom-0 bg-neutral-100 w-full inset-x-0 pointer-events-none"
        style={{
          boxShadow:
            "0 0 24px rgba(34,42,53,0.06), 0 1px 1px rgba(0,0,0,0.05), 0 0 0 1px rgba(34,42,53,0.04), 0 0 4px rgba(34,42,53,0.08), 0 16px 68px rgba(47,48,55,0.05), 0 1px 0 rgba(255,255,255,0.1) inset",
        }}
      />
    </div>
  );
}

interface CollisionMechanismProps extends BeamConfig {
  containerRef: React.RefObject<HTMLDivElement | null>;
  parentRef: React.RefObject<HTMLDivElement | null>;
}

interface CollisionState {
  detected: boolean;
  coordinates: { x: number; y: number } | null;
}

function CollisionMechanism({
  containerRef,
  parentRef,
  initialX,
  translateX,
  initialY,
  translateY,
  duration,
  delay = 0,
  className,
}: CollisionMechanismProps) {
  const beamRef = useRef<HTMLDivElement | null>(null);
  const [collision, setCollision] = useState<CollisionState>({
    detected: false,
    coordinates: null,
  });
  const [beamKey, setBeamKey] = useState(0);
  const [cycleCollisionDetected, setCycleCollisionDetected] = useState(false);

  useEffect(() => {
    const checkCollision = () => {
      if (
        beamRef.current &&
        containerRef.current &&
        parentRef.current &&
        !cycleCollisionDetected
      ) {
        const beamRect = beamRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const parentRect = parentRef.current.getBoundingClientRect();

        if (beamRect.bottom >= containerRect.top) {
          const relativeX =
            beamRect.left - parentRect.left + beamRect.width / 2;
          const relativeY = beamRect.bottom - parentRect.top;
          setCollision({
            detected: true,
            coordinates: { x: relativeX, y: relativeY },
          });
          setCycleCollisionDetected(true);
        }
      }
    };

    const animationInterval = setInterval(checkCollision, 50);
    return () => clearInterval(animationInterval);
  }, [beamRef, containerRef, parentRef, cycleCollisionDetected]);

  useEffect(() => {
    if (collision.detected && collision.coordinates) {
      const hideTimer = setTimeout(() => {
        setCollision({ detected: false, coordinates: null });
        setCycleCollisionDetected(false);
      }, 2000);
      const resetTimer = setTimeout(() => {
        setBeamKey((prev) => prev + 1);
      }, 2000);
      return () => {
        clearTimeout(hideTimer);
        clearTimeout(resetTimer);
      };
    }
  }, [collision.detected, collision.coordinates]);

  return (
    <>
      <motion.div
        key={beamKey}
        ref={beamRef}
        animate="animate"
        initial={{ translateY: initialY, translateX: translateX, rotate: 0 }}
        variants={{
          animate: { translateY: translateY, translateX: translateX, rotate: 0 },
        }}
        transition={{
          duration: duration,
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear",
          delay: delay,
          repeatDelay: 1,
        }}
        className={cn(
          "absolute left-0 top-20 m-auto h-14 w-px rounded-full bg-gradient-to-t from-indigo-500 via-purple-500 to-transparent",
          className
        )}
      />
      <AnimatePresence>
        {collision.detected && collision.coordinates && (
          <Explosion
            key={`${collision.coordinates.x}-${collision.coordinates.y}`}
            style={{
              left: `${collision.coordinates.x}px`,
              top: `${collision.coordinates.y}px`,
              transform: "translate(-50%, -50%)",
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

interface ExplosionProps {
  style?: React.CSSProperties;
}

// Fixed duration values to prevent hydration mismatch (R-005)
const PARTICLE_DURATIONS = [
  0.9, 1.0, 1.1, 0.8, 1.2, 0.95, 1.05, 0.85, 0.9, 1.0,
  1.1, 0.8, 1.2, 0.95, 1.05, 0.85, 0.9, 1.0, 1.1, 0.8,
];

// Fixed directional values for particles
const PARTICLE_DIRECTIONS: Array<{ x: number; y: number }> = [
  { x: -35, y: -30 }, { x: 20,  y: -45 }, { x: 38,  y: -20 }, { x: -10, y: -50 },
  { x: 25,  y: -35 }, { x: -40, y: -15 }, { x: 10,  y: -40 }, { x: -20, y: -25 },
  { x: 35,  y: -30 }, { x: -5,  y: -48 }, { x: 30,  y: -18 }, { x: -38, y: -22 },
  { x: 15,  y: -42 }, { x: -28, y: -32 }, { x: 40,  y: -12 }, { x: -15, y: -38 },
  { x: 22,  y: -28 }, { x: -33, y: -18 }, { x: 8,   y: -44 }, { x: -25, y: -36 },
];

function Explosion({ style }: ExplosionProps) {
  return (
    <div className="absolute z-50 h-2 w-2" style={style}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute -inset-x-10 top-0 m-auto h-2 w-10 rounded-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent blur-sm"
      />
      {PARTICLE_DIRECTIONS.map((direction, idx) => (
        <motion.span
          key={idx}
          className="absolute h-1 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500"
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ x: direction.x, y: direction.y, opacity: 0 }}
          transition={{
            duration: PARTICLE_DURATIONS[idx],
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

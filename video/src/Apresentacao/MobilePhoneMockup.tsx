import React, { Suspense } from "react";
import { staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Html } from "@react-three/drei";

// We need to pass the rotation from index.tsx. We can use a React Context or props.
// Since index.tsx currently applies rotation via CSS, we should move the rotation into WebGL!
// But for now, let's accept rotation as props.
export const MobilePhoneMockup: React.FC<{ children: React.ReactNode, rotationX?: number, rotationY?: number, rotationZ?: number, screenOpacity?: number }> = ({ children, rotationX = 0, rotationY = 0, rotationZ = 0, screenOpacity = 1 }) => {
  const frame = useCurrentFrame();
  
  // Determine if the phone is facing backward.
  // rotationY is in radians.
  const normalizedRotY = ((rotationY % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const isFacingBack = normalizedRotY > Math.PI / 2 && normalizedRotY < (3 * Math.PI) / 2;

  // Calculate animated rotation for the border
  const borderAngle = (frame * 2.5) % 360;

  return (
    <div className="relative w-[1000px] h-[1000px] flex items-center justify-center">
      <ThreeCanvas width={1000} height={1000} camera={{ position: [0, 0, 15], fov: 35 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 10]} intensity={2} />
        
        <group rotation={[rotationX, rotationY, rotationZ]}>
          <Suspense fallback={null}>
            
            {/* HTML projection matches the 3D phone model size */}
            <Html transform position={[0, 0, 0]} scale={0.35} zIndexRange={[100, 0]}>
               <div 
                 className="relative w-[360px] h-[680px] rounded-[45px] overflow-hidden" 
                 style={{ 
                   WebkitFontSmoothing: 'antialiased', 
                   backfaceVisibility: 'hidden',
                   opacity: isFacingBack ? 0 : 1,
                   pointerEvents: isFacingBack ? 'none' : 'auto'
                 }}
               >
                 {/* Animated gradient background (the moving border light) */}
                 <div 
                   className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%]"
                   style={{
                     background: `conic-gradient(from ${borderAngle}deg, transparent 75%, rgba(16, 185, 129, 0.8) 95%, rgba(16, 185, 129, 1) 100%)`,
                     opacity: screenOpacity
                   }}
                 />
                 
                 {/* Inner content container */}
                 <div className="absolute inset-[1.5px] bg-[#0a0a0a] rounded-[44px] overflow-hidden flex flex-col">
                    <div className="flex-1 w-full h-full relative" style={{ opacity: screenOpacity }}>
                       <div className="w-full bg-[#0a0a0a] border-b border-white/5 py-2 px-4 flex items-center justify-between pt-10">
                         <img src={staticFile("creator lab verde.png")} className="h-4 w-auto" alt="logo" />
                         <div className="w-6 h-6 rounded-full bg-brand-emerald/20 border border-brand-emerald/30 flex items-center justify-center">
                           <span className="text-[10px] text-brand-emerald font-bold">L</span>
                         </div>
                       </div>
                       
                       <div className="flex-1 overflow-hidden relative bg-[#0a0a0a] p-3 flex flex-col gap-3 h-full">
                         {children}
                       </div>
                    </div>
                 </div>
               </div>
            </Html>
          </Suspense>
        </group>
      </ThreeCanvas>
    </div>
  );
};

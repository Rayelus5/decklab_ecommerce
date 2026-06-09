"use client";

import React, { useRef, useState, useEffect } from "react";
import { Crown } from "lucide-react";

interface VipCard3DProps {
  level: number;
  name: string;
  color: string;
  iconImage: string;
  userName: string;
  memberSince?: Date | null;
}

export function VipCard3D({ level, name, color, iconImage, userName, memberSince }: VipCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calcular rotación (-20 a 20 grados)
    const rotateYValue = ((mouseX / width) - 0.5) * 40;
    const rotateXValue = ((mouseY / height) - 0.5) * -40;

    setRotateY(rotateYValue);
    setRotateX(rotateXValue);

    // Calcular posición del brillo
    setGlare({
      x: (mouseX / width) * 100,
      y: (mouseY / height) * 100,
      opacity: 0.3, // Brillo sutil
    });
  };

  const handleMouseLeave = () => {
    // Resetear posición suavemente
    setRotateX(0);
    setRotateY(0);
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  // Determinar si el color de fondo es oscuro o claro para ajustar textos
  const isDark = color.startsWith("#") ? 
    (parseInt(color.replace("#", ""), 16) > 0xffffff / 2 ? false : true) : true;
  
  const textColor = isDark ? "text-white" : "text-black";
  const mutedTextColor = isDark ? "text-white/60" : "text-black/60";

  return (
    <div 
      className="perspective-[1000px] w-full max-w-[400px] mx-auto aspect-[1.6/1]"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={cardRef}
        className="w-full h-full relative rounded-2xl shadow-2xl transition-transform duration-200 ease-out preserve-3d"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`, // Gradient base
          transformStyle: "preserve-3d",
        }}
      >
        {/* Efecto Glassmorphism y Glare */}
        <div 
          className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-200 overflow-hidden"
          style={{
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}), transparent 50%)`,
          }}
        >
          {/* Textura sutil o patrón */}
          <div className="w-full h-full opacity-[0.03] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        </div>

        {/* Borde sutil brillante */}
        <div className="absolute inset-0 rounded-2xl border border-white/20 pointer-events-none" />

        {/* Contenido de la Tarjeta (elevado en Z para efecto 3D) */}
        <div className="absolute inset-0 p-6 flex flex-col justify-between" style={{ transform: "translateZ(30px)" }}>
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <Crown className={textColor} size={20} />
                <span className={`text-xl font-bold uppercase tracking-widest ${textColor}`}>{name}</span>
              </div>
              <p className={`text-xs font-medium uppercase tracking-widest mt-1 ${mutedTextColor}`}>Nivel {level}</p>
            </div>
            
            {/* Icono del Tier */}
            <div className="w-12 h-12 bg-white/10 rounded-full border border-white/20 flex items-center justify-center overflow-hidden backdrop-blur-sm">
              {iconImage ? (
                <img src={iconImage} alt={name} className="w-full h-full object-cover" />
              ) : (
                <Crown className={textColor} size={24} />
              )}
            </div>
          </div>

          {/* Footer (Nombre del Usuario) */}
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className={`text-[10px] uppercase tracking-wider ${mutedTextColor} mb-1`}>Miembro VIP</span>
              <span className={`font-mono text-lg font-semibold tracking-widest ${textColor}`}>
                {userName.toUpperCase() || "CLIENTE"}
              </span>
            </div>

            {memberSince && (
              <div className="flex flex-col text-right">
                <span className={`text-[10px] uppercase tracking-wider ${mutedTextColor} mb-1`}>Desde</span>
                <span className={`font-mono text-xs font-semibold tracking-widest ${textColor}`}>
                  {new Date(memberSince).toLocaleDateString("es-ES", { month: "2-digit", year: "2-digit" })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

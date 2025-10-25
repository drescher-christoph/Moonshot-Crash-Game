"use client"

import { useEffect, useState } from "react"

interface RocketAnimationProps {
  isActive: boolean
  progress: number // 0 to 1
}

export function RocketAnimation({ isActive, progress }: RocketAnimationProps) {
  const [flames, setFlames] = useState<number[]>([])

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setFlames((prev) => [...prev.slice(-5), Math.random()])
      }, 100)
      return () => clearInterval(interval)
    }
  }, [isActive])

  const rocketY = 50 - progress * 40 // Rocket moves up as progress increases
  const rotation = Math.sin(progress * Math.PI * 4) * 5 // Slight wobble

  return (
    <div className="relative w-full h-64 overflow-hidden">
      {/* Stars background */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Rocket */}
      <div
        className="absolute left-1/2 transition-all duration-100 ease-linear"
        style={{
          top: `${rocketY}%`,
          transform: `translateX(-50%) rotate(${rotation}deg)`,
        }}
      >
        {/* Rocket body */}
        <div className="relative">
          <svg width="60" height="80" viewBox="0 0 60 80" className="drop-shadow-2xl">
            {/* Rocket body */}
            <path d="M30 0 L40 60 L30 70 L20 60 Z" fill="url(#rocketGradient)" stroke="#fbbf24" strokeWidth="2" />
            {/* Window */}
            <circle cx="30" cy="25" r="8" fill="#1e293b" stroke="#fbbf24" strokeWidth="2" />
            <circle cx="30" cy="25" r="5" fill="#0ea5e9" opacity="0.6" />
            {/* Fins */}
            <path d="M20 50 L10 70 L20 60 Z" fill="#ef4444" stroke="#dc2626" strokeWidth="1" />
            <path d="M40 50 L50 70 L40 60 Z" fill="#ef4444" stroke="#dc2626" strokeWidth="1" />

            <defs>
              <linearGradient id="rocketGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
          </svg>

          {/* Flames */}
          {isActive && (
            <div className="absolute left-1/2 -translate-x-1/2 top-[70px]">
              {flames.map((intensity, i) => (
                <div
                  key={i}
                  className="absolute left-1/2 -translate-x-1/2 animate-pulse"
                  style={{
                    bottom: `${i * 8}px`,
                    opacity: intensity * 0.8,
                  }}
                >
                  <svg width="30" height="20" viewBox="0 0 30 20">
                    <path
                      d="M15 0 Q10 10 5 20 Q15 15 15 15 Q15 15 25 20 Q20 10 15 0 Z"
                      fill={i % 2 === 0 ? "#f97316" : "#fbbf24"}
                      opacity={1 - i * 0.15}
                    />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Speed lines */}
      {isActive && progress > 0.3 && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-pulse"
              style={{
                left: 0,
                right: 0,
                top: `${20 + i * 10}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

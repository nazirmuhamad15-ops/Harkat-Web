'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export function CustomCursor() {
  const [isHovered, setIsHovered] = useState(false)
  
  // Mouse position
  const mouseX = useMotionValue(-100)
  const mouseY = useMotionValue(-100)
  
  // Smooth spring physics for lag effect
  const springConfig = { damping: 25, stiffness: 700 }
  const mainX = useSpring(mouseX, springConfig)
  const mainY = useSpring(mouseY, springConfig)
  
  // Slower spring for the outer ring
  const ringSpringConfig = { damping: 20, stiffness: 300 }
  const ringX = useSpring(mouseX, ringSpringConfig)
  const ringY = useSpring(mouseY, ringSpringConfig)

  useEffect(() => {
    const moveMouse = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Check if hovering over interactive elements
      const isClickable = target.closest('a') || 
                          target.closest('button') || 
                          target.closest('[role="button"]') ||
                          target.closest('.cursor-pointer') ||
                          target.closest('input') ||
                          target.closest('textarea') ||
                          target.closest('select')
                          
      setIsHovered(!!isClickable)
    }

    window.addEventListener('mousemove', moveMouse)
    window.addEventListener('mouseover', handleMouseOver)

    return () => {
      window.removeEventListener('mousemove', moveMouse)
      window.removeEventListener('mouseover', handleMouseOver)
    }
  }, [mouseX, mouseY])

  return (
    <>
      {/* Hide default cursor only on non-touch devices if desired, 
          but usually safer to keep or use CSS: * { cursor: none !important } 
          We won't force hide it here to avoid accessibility issues, 
          or we can add a global style if user explicitly wants it hidden.
          For "Modern Pointer", we typically hide the default arrow.
      */}
      <style jsx global>{`
        @media (match-media: hover) {
            body, a, button, input {
                cursor: none !important;
            }
        }
      `}</style>

      {/* Main Dot */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-stone-900 rounded-full z-50 pointer-events-none mix-blend-difference"
        style={{
          x: mainX,
          y: mainY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />

      {/* Ring Follower */}
      <motion.div
        className="fixed top-0 left-0 z-50 pointer-events-none border border-stone-800 rounded-full mix-blend-difference"
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: isHovered ? 40 : 20,
          height: isHovered ? 40 : 20,
          opacity: isHovered ? 0.5 : 0.8,
          borderWidth: isHovered ? '2px' : '1px',
          backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
        }}
        transition={{
            type: "spring",
            stiffness: 400,
            damping: 25
        }}
      />
    </>
  )
}

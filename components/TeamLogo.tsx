'use client'

import { useState } from 'react'
import type { Team } from '@/lib/types'

interface TeamLogoProps {
  team?: Team
  logo?: string
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
  className?: string
}

const sizeClasses = {
  sm: { container: 'w-6 h-6 text-xs', img: 'w-6 h-6', fallbackSize: 'w-6 h-6 text-xs' },
  md: { container: 'w-8 h-8 text-sm', img: 'w-8 h-8', fallbackSize: 'w-8 h-8 text-sm' },
  lg: { container: 'w-10 h-10 text-lg', img: 'w-10 h-10', fallbackSize: 'w-10 h-10 text-xs' },
  xl: { container: 'w-12 h-12 text-xl', img: 'w-12 h-12', fallbackSize: 'w-12 h-12 text-sm' },
  xxl: { container: 'w-24 h-24 text-4xl', img: 'w-24 h-24', fallbackSize: 'w-24 h-24 text-3xl' },
}

function getInitials(name: string): string {
  if (!name || name === 'TBD') return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function TeamLogo({ team, logo, name, size = 'lg', className = '' }: TeamLogoProps) {
  const [errored, setErrored] = useState(false)
  const logoUrl = team?.logo || logo || ''
  const teamName = team?.name || name || ''
  const hasValidLogo = logoUrl && logoUrl.startsWith('http') && !errored
  const sizes = sizeClasses[size]

  if (!hasValidLogo) {
    return (
      <div className={`flex items-center justify-center rounded-full bg-[#0f3460] text-white font-bold ${sizes.fallbackSize} flex-shrink-0 ${className}`}>
        {getInitials(teamName)}
      </div>
    )
  }

  return (
    <img
      src={logoUrl}
      alt={teamName}
      width={size === 'xxl' ? 96 : size === 'xl' ? 48 : size === 'lg' ? 40 : size === 'md' ? 32 : 24}
      height={size === 'xxl' ? 96 : size === 'xl' ? 48 : size === 'lg' ? 40 : size === 'md' ? 32 : 24}
      className={`object-contain rounded-full flex-shrink-0 bg-[#1a1f2e] ${sizes.img} ${className}`}
      onError={() => setErrored(true)}
    />
  )
}
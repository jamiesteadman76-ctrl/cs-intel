'use client'

import { useEffect } from 'react'

/**
 * Closes the modal on Escape and locks body scroll while open.
 * Use together with a backdrop `onClick` handler (target === currentTarget)
 * to also support click-to-close.
 */
export function useModalA11y(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen, onClose])
}

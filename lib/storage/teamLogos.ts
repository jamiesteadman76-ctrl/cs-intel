import { supabase } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export const TEAM_LOGOS_BUCKET = 'team-logos'

export const TEAM_LOGO_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

export const TEAM_LOGO_ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
] as const

export type TeamLogoUploadResult = {
  bucket: string
  path: string
  fileName: string
  publicUrl: string
}

type TeamLogoStorageClient = Pick<SupabaseClient, 'storage'>

const TEAM_LOGO_ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'])

export function sanitizeTeamLogoFileName(fileName: string): string {
  const normalized = fileName.trim().toLowerCase()
  const extensionMatch = normalized.match(/\.[a-z0-9]+$/)
  const extension = extensionMatch ? extensionMatch[0] : ''

  if (!TEAM_LOGO_ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error('Team logo must be a PNG, JPG, WEBP, GIF, or SVG image')
  }

  const stem = normalized
    .slice(0, normalized.length - extension.length)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'team-logo'

  return `${stem}${extension}`
}

export function validateTeamLogoFile(file: File): void {
  if (!file || typeof file !== 'object') {
    throw new Error('Team logo file is required')
  }

  if (file.size > TEAM_LOGO_MAX_FILE_SIZE_BYTES) {
    throw new Error('Team logo must be 5MB or smaller')
  }

  if (!TEAM_LOGO_ALLOWED_MIME_TYPES.includes(file.type as (typeof TEAM_LOGO_ALLOWED_MIME_TYPES)[number])) {
    throw new Error('Team logo must be a PNG, JPG, WEBP, GIF, or SVG image')
  }

  sanitizeTeamLogoFileName(file.name)
}

export function createTeamLogoStoragePath(fileName: string): string {
  const sanitizedFileName = sanitizeTeamLogoFileName(fileName)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const random = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 10)

  return `${timestamp}-${random}-${sanitizedFileName}`
}

export async function uploadTeamLogo(
  file: File,
  sb: TeamLogoStorageClient = supabase
): Promise<TeamLogoUploadResult> {
  validateTeamLogoFile(file)

  const path = createTeamLogoStoragePath(file.name)
  const { error: uploadError } = await sb.storage
    .from(TEAM_LOGOS_BUCKET)
    .upload(path, file, {
      cacheControl: '31536000',
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data: publicUrlData } = sb.storage.from(TEAM_LOGOS_BUCKET).getPublicUrl(path)

  if (!publicUrlData?.publicUrl) {
    throw new Error('Failed to generate public team logo URL')
  }

  return {
    bucket: TEAM_LOGOS_BUCKET,
    path,
    fileName: sanitizeTeamLogoFileName(file.name),
    publicUrl: publicUrlData.publicUrl,
  }
}

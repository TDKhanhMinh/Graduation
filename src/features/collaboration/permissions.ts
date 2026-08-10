import { z } from 'zod'

export const collaboratorRoleSchema = z.enum(['owner', 'editor', 'moderator', 'viewer'])
export const eventCapabilitySchema = z.enum([
  'manage_collaborators',
  'event_settings',
  'moderation',
  'media',
  'poster',
  'export',
  'insights',
  'director',
  'notifications',
])

export type CollaboratorRole = z.infer<typeof collaboratorRoleSchema>
export type EventCapability = z.infer<typeof eventCapabilitySchema>

const roleCapabilities: Record<CollaboratorRole, readonly EventCapability[]> = {
  owner: eventCapabilitySchema.options,
  editor: ['event_settings', 'moderation', 'media', 'poster', 'export', 'insights', 'director', 'notifications'],
  moderator: ['moderation', 'notifications'],
  viewer: ['insights', 'director'],
}

export function can(role: CollaboratorRole, capability: EventCapability) {
  return roleCapabilities[role].includes(capability)
}

export function getCapabilities(role: CollaboratorRole) {
  return roleCapabilities[role]
}

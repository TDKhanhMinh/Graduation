import { z } from 'zod'

export const collaboratorRoleSchema = z.enum(['owner', 'editor', 'moderator', 'viewer'])
export const eventCapabilitySchema = z.enum([
  'event_read',
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
  editor: ['event_read', 'event_settings', 'moderation', 'export', 'insights'],
  moderator: ['event_read', 'moderation'],
  viewer: ['event_read', 'insights'],
}

export function can(role: CollaboratorRole, capability: EventCapability) {
  return roleCapabilities[role].includes(capability)
}

export function getCapabilities(role: CollaboratorRole) {
  return roleCapabilities[role]
}

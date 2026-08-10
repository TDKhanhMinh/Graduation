import { describe, expect, it } from 'vitest'

import {
  parsePosterDraft,
  serializePosterDraft,
} from '@/features/posters/handoff'

const draft = {
  templateId: 'graduation-glow-01',
  category: 'graduation' as const,
  title: 'Lễ tốt nghiệp',
  paletteIndex: 1,
  showQr: true,
  ratio: '4:5' as const,
}

describe('poster draft handoff', () => {
  it('round-trips a bounded, versioned draft', () => {
    const serialized = serializePosterDraft(draft, new Date('2026-08-10T10:00:00.000Z'))
    expect(parsePosterDraft(serialized, new Date('2026-08-10T10:10:00.000Z'))?.title).toBe('Lễ tốt nghiệp')
  })

  it('rejects malformed, oversized and expired drafts', () => {
    expect(parsePosterDraft('{version:1,title:<script>}')).toBeNull()
    expect(parsePosterDraft(serializePosterDraft(draft, new Date('2026-08-10T10:00:00.000Z')), new Date('2026-08-10T10:31:00.000Z'))).toBeNull()
    expect(serializePosterDraft({ ...draft, title: 'x'.repeat(61) })).toBeNull()
  })
})

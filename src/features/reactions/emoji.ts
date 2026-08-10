export const ALLOWED_REACTION_EMOJIS = [
  "\u{2764}\u{FE0F}",
  "\u{1F44D}",
  "\u{1F389}",
  "\u{1F602}",
  "\u{1F525}",
  "\u{1F44F}",
] as const

export type ReactionEmoji = (typeof ALLOWED_REACTION_EMOJIS)[number]

export function isAllowedReactionEmoji(value: unknown): value is ReactionEmoji {
  return typeof value === "string" && ALLOWED_REACTION_EMOJIS.includes(value as ReactionEmoji)
}

import type { StickerAction } from "@/components/invitation/stickers/types";

export type TourStepCondition =
  | "always"
  | "has-countdown"
  | "submission-open"
  | "has-cover";

/**
 * Versioned schema contract for a Character Guided Tour step.
 * Decouples public event data from the tour presentation layer.
 */
export interface GuidedTourStep {
  id: string;
  title: string;
  content: string;

  /**
   * DOM selector or anchor for the spotlight target.
   * If null, the step does not attach to a specific element (e.g., intro or outro).
   */
  targetSelector: string | null;

  /**
   * Pre-condition evaluated before showing the step.
   * Missing target elements or failed conditions will safely skip the step.
   */
  condition: TourStepCondition;

  /** The synchronized action the mascot will perform */
  mascotAction: StickerAction;

  /** Text to display in the mascot's speech bubble */
  speech: string;

  /**
   * Placement of the tour tooltip relative to the target element.
   * "auto" is recommended for most cases to avoid screen overflow.
   */
  placement?: "top" | "bottom" | "left" | "right" | "auto";

  /**
   * Placement of the mascot relative to the target element.
   * If not provided, it defaults to placing at the opposite side or top-left.
   */
  mascotPlacement?: "top" | "bottom" | "left" | "right" | "top-left" | "auto";

  /**
   * Element used to position the mascot. Defaults to the step target.
   * Use "tour-card" when the mascot should accompany the guidance card
   * without obscuring its content.
   */
  mascotAnchor?: "target" | "tour-card";

  /** Additional distance in CSS pixels between the mascot and its anchor. */
  mascotOffset?: number;

  /**
   * Whether the user can interact with the target element while the step is active.
   * If false, the spotlight overlay will block pointer events.
   */
  allowInteraction?: boolean;
}

export interface GuidedTourConfig {
  tourId: string;
  version: string;
  mascotId?: string;
  steps: GuidedTourStep[];
}

export const TOUR_CARD_SELECTOR = "[data-guided-tour-card]" as const;

/**
 * Centralized mapping of tour targets to public event DOM selectors.
 * Note: Features like "location", "album", or "RSVP" are deferred until
 * their respective public data contracts and DOM components are implemented.
 */
export const TOUR_TARGET_MATRIX = {
  hero: "[data-tour-target='hero']",
  title: "[data-tour-target='title']",
  countdown: "[data-tour-target='countdown']",
  submitWish: "[data-tour-target='submit-wish']",
  gallery: "[data-tour-target='gallery']",
} as const;

export type TourTargetKey = keyof typeof TOUR_TARGET_MATRIX;

/**
 * Evaluates whether the tour should automatically start.
 * Skips starting if there is a deep link action, or the event is archived/closed.
 */
export function canAutoStartTour(
  status: "archived" | "upcoming" | "live" | "closed",
  deepLinkSkipIntro: boolean,
): boolean {
  if (status === "archived" || status === "closed") return false;
  if (deepLinkSkipIntro) return false;
  return true;
}

/**
 * Generates an isolated session persistence key for the tour to avoid conflicts
 * with Welcome Splash logic.
 */
export function getTourSessionKey(
  tourId: string,
  version: string = "v1",
): string {
  if (tourId.startsWith("invitation-tour:")) {
    return `${tourId}:${version}`;
  }
  return `guided-tour:${tourId}:${version}`;
}

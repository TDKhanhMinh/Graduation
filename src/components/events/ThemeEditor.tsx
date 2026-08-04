"use client"

import Image from "next/image"
import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { EventActionState } from "@/features/events/actions"

type Viewport = "desktop" | "tablet" | "mobile"

type Props = {
  action: (state: EventActionState, formData: FormData) => Promise<EventActionState>
  eventTitle: string
  eventDescription: string
  initialTheme: string
  initialCover: string | null
}

const viewportWidths: Record<Viewport, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="min-h-(--control-min-size)">
      {pending ? "Saving..." : "Save appearance"}
    </Button>
  )
}

export function ThemeEditor({
  action,
  eventTitle,
  eventDescription,
  initialTheme,
  initialCover,
}: Props) {
  const [state, formAction] = useActionState(action, {})
  const [viewport, setViewport] = useState<Viewport>("desktop")
  const [isDirty, setIsDirty] = useState(false)
  const [cover, setCover] = useState(initialCover || "")
  const [theme, setTheme] = useState(initialTheme)

  const coverIsCloudinary = /^https:\/\/res\.cloudinary\.com\//.test(cover)
  const previewTheme = theme === "editorial" ? "font-serif" : theme === "minimal" ? "tracking-tight" : ""

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.6fr)]">
      <form
        action={formAction}
        onChange={() => setIsDirty(true)}
        className="min-w-0 space-y-6 rounded-2xl border bg-card p-5"
      >
        <div>
          <p className="text-sm font-semibold">Theme settings</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Changes are owner-only and saved to the event theme fields.
          </p>
        </div>

        {state.error ? (
          <p className="rounded-lg border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger" role="alert">
            {state.error}
          </p>
        ) : null}
        {state.message ? (
          <p className="rounded-lg border border-status-success/30 bg-status-success/10 px-3 py-2 text-sm text-status-success" role="status">
            {state.message}
          </p>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="theme_key">Theme</Label>
          <select
            id="theme_key"
            name="theme_key"
            value={theme}
            onChange={(event) => setTheme(event.target.value)}
            className="min-h-(--control-min-size) rounded-lg border bg-background px-3"
          >
            <option value="graduation">Graduation</option>
            <option value="editorial">Editorial</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="cover_path">Cloudinary cover URL</Label>
          <input
            id="cover_path"
            name="cover_path"
            value={cover}
            onChange={(event) => setCover(event.target.value)}
            placeholder="https://res.cloudinary.com/..."
            className="min-h-(--control-min-size) rounded-lg border bg-background px-3 text-sm"
            aria-describedby="cover-help"
          />
          <p id="cover-help" className="text-xs leading-5 text-muted-foreground">
            Use a Cloudinary delivery URL. Supabase Storage URLs are not accepted for image or video covers.
          </p>
          {cover && !coverIsCloudinary ? (
            <p className="text-sm text-status-danger" role="alert">Cover preview unavailable until a valid Cloudinary URL is provided.</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
            {state.error ? "Save failed. Your edits remain in the form." : isDirty ? "Unsaved changes" : "All changes saved"}
          </p>
          <SubmitButton />
        </div>
      </form>

      <section className="min-w-0 rounded-2xl border bg-surface-sunken p-4" aria-labelledby="theme-preview-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold" id="theme-preview-heading">Live public preview</p>
            <p className="mt-1 text-xs text-muted-foreground">Uses the public-safe event hero/card shape. Pending/private wishes are not queried.</p>
          </div>
          <div className="flex rounded-lg border bg-background p-1" role="group" aria-label="Preview viewport">
            {(["desktop", "tablet", "mobile"] as const).map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={viewport === value ? "default" : "ghost"}
                onClick={() => setViewport(value)}
                aria-pressed={viewport === value}
              >
                {value}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border bg-background p-3">
          <div className="mx-auto min-w-0 transition-[max-width]" style={{ maxWidth: viewportWidths[viewport] }}>
            <div className={"overflow-hidden rounded-xl border bg-card shadow-sm " + previewTheme}>
              <div className="relative min-h-56 bg-primary/10 p-6">
                {coverIsCloudinary ? (
                  <Image src={cover} alt="" fill sizes="(max-width: 768px) 100vw, 60vw" className="object-cover opacity-30" />
                ) : null}
                <div className="relative z-10 max-w-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Memoria</p>
                  <h2 className="mt-4 text-3xl font-semibold">{eventTitle}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{eventDescription || "Your event description appears here."}</p>
                  <div className="mt-6 inline-flex rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground">Send a wish</div>
                </div>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <article className="rounded-xl border bg-background p-4">
                  <p className="text-sm leading-6">A safe public wish preview appears here.</p>
                  <p className="mt-3 text-xs text-muted-foreground">Approved public content only</p>
                </article>
                <article className="rounded-xl border bg-background p-4">
                  <p className="text-sm leading-6">Media is delivered only from the configured Cloudinary provider.</p>
                  <p className="mt-3 text-xs text-muted-foreground">No private or pending data</p>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

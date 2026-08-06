# Cloudinary media contract

Status: draft, based on the approved `VoIPElearning` upload preset for both submission and Media Library uploads.

This project uses Cloudinary as the binary provider for image and video assets. Supabase stores application metadata, ownership, moderation state, quota state, and test fixtures only. Supabase Storage is not the media provider.

## Shared upload preset

The currently supplied Cloudinary preset is:

| Setting | Contract value |
| --- | --- |
| Preset | `VoIPElearning` |
| Upload mode | `unsigned` |
| Overwrite | `false` |
| Use original filename | `true` |
| Unique filename | `true` |
| Use filename as display name | `true` |
| Use asset folder as public ID prefix | `true` |
| Delivery type | `upload` |
| Access control | `Public` |
| Asset folder | `submission` |

The preset is approved for both public submission uploads and Media Library uploads. It remains a public-delivery preset: it does not provide private moderation delivery or owner-only deletion. An asset uploaded with public delivery can be fetched by anyone who obtains its delivery URL.

## Event cover upload

Event cover images use the direct browser upload boundary with `resource_type: image`. The browser may send a validated JPEG, PNG, or WebP file up to 5 MiB to the configured Cloudinary upload endpoint and receives `secure_url`. The application stores only that URL in `public.events.cover_path`; the binary remains in Cloudinary.

The owner-only Server Action remains responsible for accepting the returned URL and updating the event. It must validate the Cloudinary delivery host and the existing event ownership boundary before persisting the value. No API secret is required for this flow and no Supabase Storage bucket is involved.

Cloudinary API secrets are server-only. The browser may receive the cloud name, API key, upload preset, and upload URL, but never the API secret.

## Upload boundary

The client may upload directly to Cloudinary using the `VoIPElearning` preset only after the application has validated the event submission rules, media type, file size, and quota. The application must persist the Cloudinary response together with the wish/event relation.

The canonical upload response fields are:

```ts
type CloudinaryAssetMetadata = {
  provider: "cloudinary"
  assetId: string
  publicId: string
  resourceType: "image" | "video"
  mediaType: "image" | "video" | "audio"
  deliveryType: "upload"
  secureUrl: string
  version: number
  format: string
  bytes: number
  width?: number
  height?: number
  durationMs?: number
}
```

Cloudinary represents video and audio uploads with `resource_type: video`; the application keeps `mediaType` separately so audio remains distinguishable in the product UI.

## Metadata ownership

Supabase is the source of truth for:

- `event_id`
- `wish_id`
- owner/moderator access checks
- moderation status
- public visibility eligibility
- quota accounting
- deletion and retention state

Cloudinary is the source of truth for:

- `asset_id`
- `public_id`
- `resource_type`
- `secure_url`
- `version`
- `format`
- `bytes`
- dimensions and duration

The fixed `submission` folder alone does not identify an event or wish. The event/wish relation must be stored in application metadata; if Cloudinary context/tags are used, they are supplementary and never replace the owner-safe database relation.

## Delivery policy

The shared preset has public delivery. Until a private/authenticated delivery contract is approved:

- pending, rejected, and private media must not be rendered to public users;
- public UI must only render a Cloudinary URL from an approved public projection;
- owner/moderator UI must verify event ownership and moderation authorization before returning metadata;
- the application must not claim that public Cloudinary delivery is private-by-default.

A separate signed or authenticated delivery contract is required before P4-T08 can certify private moderation previews and owner-only media delivery.

## Delete and retention contract: pending decision

The following values are not supplied yet and must be approved before implementing destructive Media Library actions:

- delete authority: event owner, moderator, system cleanup, or combination;
- delete API boundary: server route/action only;
- Cloudinary `resource_type` and delivery `type` sent to deletion;
- CDN invalidation behavior; recommended value is `invalidate: true`;
- soft-delete versus hard-delete in Supabase metadata;
- orphan cleanup delay after an upload that is never attached to a wish;
- archived-event retention period;
- quota source of truth and whether failed/orphan assets count toward quota.

Until these values are approved, the Media Library may expose unavailable/delete-disabled states but must not call Cloudinary destruction from the browser.

## Required completion inputs

To promote this draft to an implementation-ready contract, provide:

1. Cloud name and environment name (never the API secret).
2. Confirmed scope: `VoIPElearning` is approved for both submission and Media Library uploads.
3. Allowed image/video/audio formats and maximum sizes.
4. Pending and approved delivery policy.

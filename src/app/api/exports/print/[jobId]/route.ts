import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createAdminClient } from '@/lib/supabase/admin'

import { ownerExportSnapshotSchema, type OwnerExportSnapshot } from '@/features/exports/contract'
import { hashExportPrintToken } from '@/features/exports/print-token'

export const dynamic = 'force-dynamic'

const PRINT_HEADERS = {
  'Cache-Control': 'no-store, private',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
}

const jobIdSchema = z.uuid()

function escapeHtml(value: string | null | undefined): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderSnapshot(snapshot: OwnerExportSnapshot): string {
  const wishes = snapshot.wishes.map((wish) => `
    <article class="wish">
      <h2>${escapeHtml(wish.sender_name)}</h2>
      <p>${escapeHtml(wish.content)}</p>
      <time datetime="${escapeHtml(wish.created_at)}">${escapeHtml(wish.created_at)}</time>
    </article>`).join('')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="robots" content="noindex,nofollow,noarchive">
    <title>${escapeHtml(snapshot.event.title)}</title>
    <style>
      @page { size: A4; margin: 18mm; }
      :root { color-scheme: light; font-family: Arial, sans-serif; }
      body { color: #171717; margin: 0; }
      header { border-bottom: 2px solid #d4d4d4; margin-bottom: 20px; padding-bottom: 16px; }
      h1 { font-size: 28px; margin: 0 0 8px; }
      .meta { color: #525252; font-size: 12px; }
      .wish { border-bottom: 1px solid #e5e5e5; break-inside: avoid; padding: 12px 0; }
      .wish h2 { font-size: 16px; margin: 0 0 6px; }
      .wish p { white-space: pre-wrap; margin: 0 0 8px; }
      time { color: #737373; font-size: 11px; }
    </style>
  </head>
  <body>
    <header>
      <h1>${escapeHtml(snapshot.event.title)}</h1>
      <div class="meta">${escapeHtml(snapshot.event.slug)} - ${snapshot.wishes.length} wishes - snapshot ${escapeHtml(snapshot.consistency_at)}</div>
      ${snapshot.event.description ? `<p>${escapeHtml(snapshot.event.description)}</p>` : ''}
    </header>
    <main>${wishes || '<p>No approved wishes.</p>'}</main>
  </body>
</html>`
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const jobId = jobIdSchema.safeParse((await params).jobId)
  const token = new URL(request.url).searchParams.get('token')
  if (!jobId.success || !token || token.length > 512) {
    return new NextResponse('Not found', { status: 404, headers: PRINT_HEADERS })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('consume_export_print_token', {
    p_job_id: jobId.data,
    p_print_token_hash: hashExportPrintToken(token),
  })

  if (error || !data?.[0]) {
    return new NextResponse('Not found', { status: 404, headers: PRINT_HEADERS })
  }

  try {
    const snapshot = ownerExportSnapshotSchema.parse(data[0].snapshot)
    return new NextResponse(renderSnapshot(snapshot), {
      status: 200,
      headers: { ...PRINT_HEADERS, 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch {
    return new NextResponse('Export snapshot unavailable', { status: 500, headers: PRINT_HEADERS })
  }
}

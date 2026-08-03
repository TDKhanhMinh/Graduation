import { NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/dal"
import { createAdminClient } from "@/lib/supabase/admin"
import { getPrintableEventSnapshot } from "@/features/exports/dal"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { slug, idempotencyKey } = body

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 })
    }

    const snapshot = await getPrintableEventSnapshot(slug)
    if (!snapshot) {
      return NextResponse.json({ error: "Event not found or access denied" }, { status: 404 })
    }

    // Double check ownership
    if (snapshot.event.id) {
      const supabase = createAdminClient()
      const { data: evt } = await supabase.from('events').select('owner_id').eq('id', snapshot.event.id).single()
      if (evt?.owner_id !== session.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    const token = crypto.randomBytes(32).toString('hex')
    const iKey = idempotencyKey || crypto.randomUUID()

    const supabase = createAdminClient()

    // Create job (idempotent via unique constraint)
    const { data: job, error } = await supabase
      .from('export_jobs')
      .insert({
        event_id: snapshot.event.id,
        owner_id: session.userId,
        idempotency_key: iKey,
        status: 'queued',
        snapshot: JSON.parse(JSON.stringify(snapshot)),
        token: token,
      })
      .select('id, status')
      .single()

    if (error) {
      // If error is unique violation on idempotency_key, fetch the existing job
      if (error.code === '23505') { // Postgres unique_violation
        const { data: existingJob } = await supabase
          .from('export_jobs')
          .select('id, status')
          .eq('event_id', snapshot.event.id)
          .eq('idempotency_key', iKey)
          .single()
        
        if (existingJob) {
          return NextResponse.json({ jobId: existingJob.id, status: existingJob.status })
        }
      }
      console.error("Error creating export job:", error)
      return NextResponse.json({ error: "Failed to create export job" }, { status: 500 })
    }

    return NextResponse.json({ jobId: job.id, status: job.status })

  } catch (error) {
    console.error("Export API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

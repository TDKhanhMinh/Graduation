import { NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/dal"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { jobId } = await params

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: job, error } = await supabase
      .from('export_jobs')
      .select('id, owner_id, status, output_path')
      .eq('id', jobId)
      .single()

    if (error || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    if (job.owner_id !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    let downloadUrl = null

    if (job.status === 'completed' && job.output_path) {
      // Create signed URL for download
      const { data: signedData, error: signedError } = await supabase
        .storage
        .from('yearbook-exports')
        .createSignedUrl(job.output_path, 900, { // 15 minutes TTL
          download: true,
        })

      if (!signedError && signedData) {
        downloadUrl = signedData.signedUrl
      }
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      downloadUrl
    })

  } catch (error) {
    console.error("Export API GET error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

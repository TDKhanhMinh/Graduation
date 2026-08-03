import { createClient } from "@supabase/supabase-js"
import puppeteer from "puppeteer"
import dotenv from "dotenv"
import path from "path"

// Load env from Next.js root
dotenv.config({ path: path.join(__dirname, "../../.env.local") })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing Supabase credentials in .env.local")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const WORKER_ID = `worker-${Math.random().toString(36).substring(2, 9)}`
const POLL_INTERVAL = 5000 // 5 seconds

async function processJob(job: { id: string, event_id: string, token: string, owner_id: string }) {
  console.log(`[${WORKER_ID}] Processing job ${job.id} for event ${job.event_id}`)
  
  let browser
  try {
    // 1. Get slug for event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('slug')
      .eq('id', job.event_id)
      .single()
      
    if (eventError || !event) {
      throw new Error(`Event not found: ${job.event_id}`)
    }

    const printUrl = `${APP_URL}/e/${event.slug}/print?token=${job.token}`
    
    // 2. Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    })
    
    const page = await browser.newPage()
    
    // We can set extra headers if needed, or viewport
    await page.setViewport({ width: 1200, height: 800 })
    
    console.log(`[${WORKER_ID}] Navigating to ${printUrl}`)
    // Go to page and wait for network idle to ensure images load
    await page.goto(printUrl, { waitUntil: 'networkidle0', timeout: 60000 })
    
    // 3. Print to PDF
    console.log(`[${WORKER_ID}] Generating PDF...`)
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      }
    })
    
    // 4. Upload to storage
    const outputPath = `${job.owner_id}/${job.event_id}_${job.id}.pdf`
    console.log(`[${WORKER_ID}] Uploading to ${outputPath}...`)
    
    const { error: uploadError } = await supabase
      .storage
      .from('yearbook-exports')
      .upload(outputPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      })
      
    if (uploadError) {
      throw uploadError
    }
    
    // 5. Update job status
    console.log(`[${WORKER_ID}] Marking job as completed.`)
    await supabase
      .from('export_jobs')
      .update({
        status: 'completed',
        output_path: outputPath,
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id)
      
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error(`[${WORKER_ID}] Error processing job ${job.id}:`, errMsg)
    // Mark as failed
    await supabase
      .from('export_jobs')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

async function startWorker() {
  console.log(`[${WORKER_ID}] Started PDF Export Worker. Polling every ${POLL_INTERVAL}ms...`)
  
  while (true) {
    try {
      // Call RPC to claim a job safely
      const { data: claimedJobs, error } = await supabase
        .rpc('claim_export_job', { worker_name: WORKER_ID })
        
      if (error) {
        console.error(`[${WORKER_ID}] RPC Error:`, error.message)
      } else if (claimedJobs && claimedJobs.length > 0) {
        const job = claimedJobs[0]
        await processJob(job)
      }
    } catch (err) {
      console.error(`[${WORKER_ID}] Unexpected error in polling loop:`, err)
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL))
  }
}

startWorker()

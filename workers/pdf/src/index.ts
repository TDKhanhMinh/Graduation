import { PdfExportWorker } from './worker.js'

const worker = new PdfExportWorker()

process.on('SIGINT', () => worker.stop())
process.on('SIGTERM', () => worker.stop())

void worker.start().catch((error) => {
  console.error(JSON.stringify({
    event: 'pdf_worker_fatal',
    error_code: error instanceof Error ? error.name : 'UnknownError',
  }))
  process.exitCode = 1
})

import ProgressBar from 'progress'

export type AsyncBatchOptions = {
  elements: any[]
  retryAttempts: number
  logFormat?: string
  batchSize: number
  callback: any
}

// TODO: Document this
export async function asyncBatch(options: AsyncBatchOptions) {
  let {
    elements = [],
    retryAttempts = 0,
    logFormat = 'Processing [:bar] :percent :current/:total elements. ETA :eta seconds',
    batchSize,
    callback
  } = options

  if (!callback) throw new Error('[asyncBatch] A callback is required')

  console.warn(
    `[asyncBatch] Defaulting to ${batchSize} as batch size, got ${options.batchSize}`
  )

  let result: any[] = []
  let batchedCount = 0

  const bar = new ProgressBar(logFormat, { total: elements.length })

  while (elements.length > 0) {
    try {
      const batch = elements.slice(0, batchSize)
      const partialResult = await callback(batch, batchedCount, elements)

      result = result.concat(partialResult)
      batchedCount += batch.length
      elements = elements.slice(batchSize)

      if (logFormat) {
        bar.tick(batch.length)
      }
    } catch (error) {
      if (retryAttempts <= 0) throw error
      retryAttempts -= 1

      console.warn(
        `[asyncBatch] Retrying upon error ${error.message}. Attempts left ${retryAttempts}`
      )
    }
  }

  return result
}

import { defineCliConfig } from 'sanity/cli'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'q1voz8ji'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'

export default defineCliConfig({
  api: { projectId, dataset },
  deployment: {
    appId: 'kg3kvm7e1c1drysyly6cy18v',
    autoUpdates: true,
  },
})

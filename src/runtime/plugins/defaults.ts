import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import type { Settings } from 'sigma/settings'
import { setSigmaDefaults } from '../utils/global-settings'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public.sigma as { settings?: Partial<Settings> } | undefined
  setSigmaDefaults(config?.settings ?? {})
})

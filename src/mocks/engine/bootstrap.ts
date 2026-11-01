import { commit, getDb, resetDb } from '@/mocks/db/store'
import { clearAuthCookies } from '@/mocks/domain/auth'
import { findScenario } from '@/mocks/engine/scenarios'

const PARAMS = {
  scenario: 'mock_scenario',
  seed: 'mock_seed',
  latency: 'mock_latency',
  clock: 'mock_clock',
  reset: 'mock_reset',
} as const

function readInteger(raw: string | null): number | undefined {
  if (raw === null || raw.trim() === '') return undefined

  const value = Number(raw)
  return Number.isInteger(value) ? value : undefined
}

/**
 * Lets a shared link or a test pick the starting conditions. The parameters are
 * removed afterwards so they never become part of the app's own URL state.
 */
export function applyUrlOverrides(): void {
  const url = new URL(window.location.href)
  const { searchParams } = url

  if (searchParams.get(PARAMS.reset) === '1') {
    clearAuthCookies()
    resetDb()
  }

  const { runtime } = getDb()
  const scenarioId = searchParams.get(PARAMS.scenario)

  if (scenarioId !== null) {
    if (findScenario(scenarioId)) {
      runtime.scenarioId = scenarioId
      runtime.ruleUses = {}
      runtime.requestCount = 0
    } else {
      console.error(`Unknown mock scenario "${scenarioId}".`)
    }
  }

  runtime.seed = readInteger(searchParams.get(PARAMS.seed)) ?? runtime.seed
  runtime.latencyOverrideMs = readInteger(searchParams.get(PARAMS.latency)) ?? runtime.latencyOverrideMs

  const clock = searchParams.get(PARAMS.clock)
  if (clock !== null && !Number.isNaN(Date.parse(clock))) {
    runtime.clockOffsetMs = Date.parse(clock) - Date.now()
  }

  commit()

  const hadOverrides = Object.values(PARAMS).some((name) => searchParams.has(name))
  if (hadOverrides) {
    Object.values(PARAMS).forEach((name) => {
      searchParams.delete(name)
    })
    window.history.replaceState(window.history.state, '', url)
  }
}

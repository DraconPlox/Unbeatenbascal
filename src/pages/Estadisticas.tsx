import { useEffect, useMemo, useRef, useState } from 'react'
import { aredlLevelUrl, aredlUserUrl, fetchClanMemberProfile } from '../api/aredl'
import type { ListKey } from '../api/aredl'
import { ErrorState, LoadingState } from '../components/PageState'
import { useClan } from '../context/ClanContext'
import type { ClanMemberProfile, ClanMemberRecord } from '../objects'
import { MOBILE_SYMBOL, VIDEO_SYMBOL, formatRecordDate, formatStatsPoints } from '../utils/format'

type Mode = 'classic' | 'platformer'
type StatsTab = 'members' | 'hardests' | 'recent'

interface MemberRef {
  id: string
  username: string
  global_name: string | null
}

// Récord de un miembro con la referencia al usuario que lo envió.
type MemberRecord = ClanMemberRecord & { member: MemberRef }

interface MemberRecordsState {
  data: MemberRecord[] | null
  error: string | null
}

const emptyMemberRecords: MemberRecordsState = { data: null, error: null }

const memberName = (member: { global_name: string | null; username: string }) =>
  member.global_name || member.username

const levelCountLabel = (count: number) => `${count} ${count === 1 ? 'nivel' : 'niveles'}`

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="stats-card">
      <div className="stats-card-label">{label}</div>
      <div className="stats-card-value">{value}</div>
      {hint && <div className="stats-card-hint">{hint}</div>}
    </div>
  )
}

function TabMessage({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="stats-inline-state">
      <p>{text}</p>
      {onRetry && (
        <button type="button" className="page-state-button" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  )
}

export function Estadisticas() {
  const { classic, platformer, reload } = useClan()
  const [mode, setMode] = useState<Mode>('classic')
  const [tab, setTab] = useState<StatsTab>('members')
  const [memberRecords, setMemberRecords] = useState<Record<ListKey, MemberRecordsState>>({
    aredl: emptyMemberRecords,
    arepl: emptyMemberRecords,
  })
  const [memberRetry, setMemberRetry] = useState(0)
  const requestedRef = useRef<Set<ListKey>>(new Set())

  const listKey: ListKey = mode === 'classic' ? 'aredl' : 'arepl'
  const active = mode === 'classic' ? classic : platformer
  const other = mode === 'classic' ? platformer : classic
  const profile = active.data

  const members = useMemo(() => {
    const list = profile?.members_points ?? []
    return [...list].sort((a, b) => b.contributed_points - a.contributed_points)
  }, [profile])

  // Los récords individuales no vienen en el perfil del clan: hay que pedir el
  // perfil de cada miembro. Se cargan solo al abrir una pestaña que los usa y
  // se guardan por lista para no repetir peticiones.
  useEffect(() => {
    if (tab === 'members' || !profile) return
    const clanMembers = profile.members_points ?? []
    if (clanMembers.length === 0) return

    const requested = requestedRef.current
    if (requested.has(listKey)) return
    requested.add(listKey)
    let cancelled = false
    let settled = false

    Promise.allSettled(
      clanMembers.map(entry => fetchClanMemberProfile(listKey, entry.member.id)),
    ).then(results => {
      if (cancelled) return
      settled = true

      const profiles = results
        .filter(
          (result): result is PromiseFulfilledResult<ClanMemberProfile> =>
            result.status === 'fulfilled',
        )
        .map(result => result.value)

      if (profiles.length === 0) {
        setMemberRecords(prev => ({
          ...prev,
          [listKey]: {
            data: null,
            error: 'No se pudieron cargar los récords individuales de los miembros.',
          },
        }))
        return
      }

      const data = profiles.flatMap(memberProfile =>
        memberProfile.records.map(record => ({
          ...record,
          member: {
            id: memberProfile.id,
            username: memberProfile.username,
            global_name: memberProfile.global_name,
          },
        })),
      )

      setMemberRecords(prev => ({ ...prev, [listKey]: { data, error: null } }))
    })

    return () => {
      cancelled = true
      if (!settled) requested.delete(listKey)
    }
  }, [tab, profile, listKey, memberRetry])

  const retryMemberRecords = () => {
    requestedRef.current.delete(listKey)
    setMemberRecords(prev => ({ ...prev, [listKey]: emptyMemberRecords }))
    setMemberRetry(value => value + 1)
  }

  const memberCache = memberRecords[listKey]
  const memberDataLoading = !memberCache.data && !memberCache.error

  // El nivel más duro que ha pasado cada miembro (menor posición).
  const memberHardests = useMemo(() => {
    const data = memberCache.data
    if (!data) return []

    return members
      .map(entry => {
        const positioned = data.filter(
          record => record.member.id === entry.member.id && record.level.position !== null,
        )
        const hardest = positioned.reduce<MemberRecord | null>((best, record) => {
          if (!best) return record
          const bestPosition = best.level.position ?? Number.POSITIVE_INFINITY
          const position = record.level.position ?? Number.POSITIVE_INFINITY
          return position < bestPosition ? record : best
        }, null)

        return {
          member: entry.member,
          completedLevels: entry.completed_levels,
          hardest,
        }
      })
      .sort((a, b) => {
        const aPosition = a.hardest?.level.position ?? Number.POSITIVE_INFINITY
        const bPosition = b.hardest?.level.position ?? Number.POSITIVE_INFINITY
        return aPosition - bPosition
      })
  }, [memberCache.data, members])

  // Los últimos registros aceptados en la AREDL, aunque repitan nivel.
  const latestRecords = useMemo(() => {
    const data = memberCache.data
    if (!data) return []

    return [...data]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
  }, [memberCache.data])

  const totalPoints = profile?.rank?.level_points
    ?? members.reduce((sum, member) => sum + member.contributed_points, 0)
  const levelRecords = profile?.records.length ?? 0
  const totalCompletions = profile?.records.reduce((sum, record) => sum + record.completion_count, 0) ?? 0
  const mobileRecords = profile?.records.filter(record => record.mobile).length ?? 0
  const listName = mode === 'classic' ? 'AREDL' : 'AREPL'
  const otherListName = mode === 'classic' ? 'Plataforma' : 'Clásico'

  const tabs: { id: StatsTab; label: string; hint: string }[] = [
    {
      id: 'members',
      label: 'Ranking de miembros',
      hint: 'Ordenado por puntos aportados al clan',
    },
    {
      id: 'hardests',
      label: 'Top hardests',
      hint: 'El hardest que se ha pasado cada miembro',
    },
    {
      id: 'recent',
      label: 'Últimos récords',
      hint: `Los últimos 10 registros subidos a la ${listName}`,
    },
  ]
  const activeTab = tabs.find(item => item.id === tab) ?? tabs[0]

  return (
    <div className="stats-page">
      <h1 style={{ margin: '0 0 0.35rem' }}>Estadísticas</h1>
      <p className="stats-subtitle">
        Datos del clan {profile?.clan?.global_name ?? 'JEWBASCAL'}
        {profile?.clan?.tag ? ` (${profile.clan.tag})` : ''} en la {listName}.
      </p>

      <div className="stats-mode-switch" role="group" aria-label="Elegir lista">
        <button
          type="button"
          className={`stats-mode-button${mode === 'classic' ? ' is-active' : ''}`}
          onClick={() => setMode('classic')}
          aria-pressed={mode === 'classic'}
        >
          Clásico
        </button>
        <button
          type="button"
          className={`stats-mode-button${mode === 'platformer' ? ' is-active' : ''}`}
          onClick={() => setMode('platformer')}
          aria-pressed={mode === 'platformer'}
        >
          Plataforma
        </button>
      </div>

      {active.loading ? (
        <LoadingState
          title="Cargando estadísticas..."
          description={`Obteniendo los perfiles y récords del clan desde la ${listName}. Si tarda, comprueba tu conexión a Internet.`}
        />
      ) : active.error ? (
        <ErrorState
          title={`No se pudieron cargar las estadísticas de ${listName}`}
          description="Comprueba tu conexión con la AREDL e inténtalo de nuevo."
          onRetry={reload}
        />
      ) : !profile ? (
        <p className="stats-empty">No hay datos disponibles para esta lista.</p>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard
              label="Rank global"
              value={profile.rank?.rank !== null && profile.rank?.rank !== undefined ? `#${profile.rank.rank}` : 'N/A'}
              hint="Posición del clan en la lista"
            />
            <StatCard
              label="Rank extremes"
              value={profile.rank?.extremes_rank !== null && profile.rank?.extremes_rank !== undefined ? `#${profile.rank.extremes_rank}` : 'N/A'}
              hint="Posición en la lista de extremes"
            />
            <StatCard
              label="Puntos del clan"
              value={formatStatsPoints(totalPoints)}
              hint="Puntos aportados entre todos los miembros"
            />
            <StatCard
              label="Niveles"
              value={String(profile.rank?.extremes ?? profile.records.length)}
              hint="Extremes en la lista"
            />
            <StatCard
              label="Récords"
              value={String(totalCompletions)}
              hint={`${levelRecords} niveles · ${mobileRecords} en móvil`}
            />
            <StatCard
              label="Miembros"
              value={String(members.length)}
              hint="Aportan puntos al clan"
            />
          </div>

          {other.error && (
            <p className="stats-warning">
              No se pudieron cargar las estadísticas de {otherListName}. Solo se muestran los datos de {mode === 'classic' ? 'Clásico' : 'Plataforma'}.
            </p>
          )}

          <div className="stats-hub">
            <div className="stats-tabs-bar">
              <div className="stats-tabs" role="tablist" aria-label="Secciones de estadísticas">
                {tabs.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    id={`stats-tab-${item.id}`}
                    aria-selected={tab === item.id}
                    aria-controls="stats-tab-panel"
                    className={`stats-tab${tab === item.id ? ' is-active' : ''}`}
                    onClick={() => setTab(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <span className="stats-tab-hint">{activeTab.hint}</span>
            </div>

            <div
              className="stats-tab-panel"
              id="stats-tab-panel"
              role="tabpanel"
              aria-labelledby={`stats-tab-${tab}`}
            >
              {tab === 'members' && (
                members.length === 0 ? (
                  <p className="stats-empty">Ningún miembro tiene récords en esta lista.</p>
                ) : (
                  <div className="stats-table-wrap">
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th scope="col">#</th>
                          <th scope="col">Miembro</th>
                          <th scope="col" className="is-num">Niveles</th>
                          <th scope="col" className="is-num">Puntos</th>
                          <th scope="col">% del clan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((entry, index) => {
                          const share = totalPoints > 0
                            ? (entry.contributed_points / totalPoints) * 100
                            : 0

                          return (
                            <tr key={entry.member.id}>
                              <td className="stats-rank">{index + 1}</td>
                              <td>
                                <a
                                  className="stats-member stats-user-link"
                                  href={aredlUserUrl(entry.member.id)}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={`Ver el perfil de ${memberName(entry.member)} en la AREDL`}
                                >
                                  <span className="stats-member-name">{memberName(entry.member)}</span>
                                  {entry.member.global_name && (
                                    <span className="stats-member-tag">@{entry.member.username}</span>
                                  )}
                                </a>
                              </td>
                              <td className="is-num">{entry.completed_levels}</td>
                              <td className="is-num">{formatStatsPoints(entry.contributed_points)}</td>
                              <td>
                                <div className="stats-share">
                                  <div className="stats-bar" aria-hidden="true">
                                    <div
                                      className="stats-bar-fill"
                                      style={{ width: `${Math.min(Math.max(share, 0), 100)}%` }}
                                    />
                                  </div>
                                  <span className="stats-share-value">
                                    {share.toLocaleString('es-ES', {
                                      minimumFractionDigits: 1,
                                      maximumFractionDigits: 1,
                                    })}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {tab === 'hardests' && (
                memberDataLoading ? (
                  <TabMessage text="Cargando los récords individuales de los miembros..." />
                ) : memberCache.error ? (
                  <TabMessage text={memberCache.error} onRetry={retryMemberRecords} />
                ) : memberHardests.length === 0 ? (
                  <p className="stats-empty">Todavía no hay récords de miembros en esta lista.</p>
                ) : (
                  <ul className="stats-list">
                    {memberHardests.map((entry, index) => (
                      <li key={entry.member.id} className="stats-list-item">
                        <div className="stats-list-main">
                          <span className="stats-list-title">
                            <span className="stats-rank-inline">{index + 1}.</span>{' '}
                            <a
                              className="stats-user-link"
                              href={aredlUserUrl(entry.member.id)}
                              target="_blank"
                              rel="noreferrer"
                              title={`Ver el perfil de ${memberName(entry.member)} en la AREDL`}
                            >
                              {memberName(entry.member)}
                              {entry.member.global_name && (
                                <span className="stats-member-tag"> @{entry.member.username}</span>
                              )}
                            </a>
                          </span>
                          <span className="stats-list-meta">
                            {entry.hardest && entry.hardest.level.position !== null ? (
                              <>
                                Hardest:{' '}
                                <a
                                  className="stats-level-link"
                                  href={aredlLevelUrl(entry.hardest.level.level_id, listKey)}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={`Ver ${entry.hardest.level.name} en la AREDL`}
                                >
                                  <span className="stats-list-pos">#{entry.hardest.level.position}</span>{' '}
                                  {entry.hardest.level.name}
                                </a>
                              </>
                            ) : (
                              'Sin niveles posicionados'
                            )}
                          </span>
                        </div>
                        <span className="stats-hardest-count">
                          {levelCountLabel(entry.completedLevels)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )
              )}

              {tab === 'recent' && (
                memberDataLoading ? (
                  <TabMessage text="Cargando los últimos récords de los miembros..." />
                ) : memberCache.error ? (
                  <TabMessage text={memberCache.error} onRetry={retryMemberRecords} />
                ) : latestRecords.length === 0 ? (
                  <p className="stats-empty">Todavía no hay récords registrados.</p>
                ) : (
                  <ul className="stats-list">
                    {latestRecords.map(record => (
                      <li key={`${record.member.id}:${record.id}`} className="stats-list-item">
                        <div className="stats-list-main">
                          <span className="stats-list-title">
                            <a
                              className="stats-level-link"
                              href={aredlLevelUrl(record.level.level_id, listKey)}
                              target="_blank"
                              rel="noreferrer"
                              title={`Ver ${record.level.name} en la AREDL`}
                            >
                              {record.level.position !== null && (
                                <>
                                  <span className="stats-list-pos">#{record.level.position}</span>{' '}
                                </>
                              )}
                              {record.level.name}
                            </a>
                          </span>
                          <span className="stats-list-meta">
                            <a
                              className="stats-user-link"
                              href={aredlUserUrl(record.member.id)}
                              target="_blank"
                              rel="noreferrer"
                              title={`Ver el perfil de ${memberName(record.member)} en la AREDL`}
                            >
                              {memberName(record.member)}
                            </a>{' '}
                            · {formatRecordDate(record.created_at)}
                          </span>
                        </div>
                        <div className="stats-list-actions">
                          {record.mobile && (
                            <span className="demonlist-record-tag" title="Móvil" aria-label="Móvil">
                              {MOBILE_SYMBOL}
                            </span>
                          )}
                          {record.video_url && !record.hide_video && (
                            <a
                              className="demonlist-record-link"
                              href={record.video_url}
                              target="_blank"
                              rel="noreferrer"
                              title="Vídeo"
                              aria-label="Vídeo"
                            >
                              {VIDEO_SYMBOL}
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

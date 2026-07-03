import { useEffect, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

type Profile = {
  id: string
  username: string
  display_name: string
  elo: number
  matches_played: number
  wins: number
  losses: number
}

type LeaderboardPlayer = {
  id: string
  username: string
  display_name: string
  elo: number
  matches_played: number
  wins: number
  losses: number
  win_rate: number
  official: boolean
}

type Match = {
  id: string
  player_a: string
  player_b: string
  requested_by: string
  status: 'pending' | 'active' | 'completed' | 'cancelled'

  confirmation_a: string | null
  confirmation_b: string | null
  winner_id: string | null

  elo_a_before: number | null
  elo_b_before: number | null
  elo_a_after: number | null
  elo_b_after: number | null
  delta_a: number | null
  delta_b: number | null

  created_at: string
  activated_at: string | null
  completed_at: string | null
}

type MatchHistoryRow = {
  id: string
  status: 'pending' | 'active' | 'completed' | 'cancelled'

  player_a: string
  player_a_name: string
  player_b: string
  player_b_name: string

  requested_by: string
  requested_by_name: string

  confirmation_a: string | null
  confirmation_a_name: string | null
  confirmation_b: string | null
  confirmation_b_name: string | null

  winner_id: string | null
  winner_name: string | null

  opponent_id: string | null
  opponent_name: string | null

  did_i_win: boolean | null

  my_elo_before: number | null
  my_elo_after: number | null
  my_delta: number | null

  opponent_elo_before: number | null
  opponent_elo_after: number | null
  opponent_delta: number | null

  created_at: string
  activated_at: string | null
  completed_at: string | null
}

type ActiveTab = 'perfil' | 'partida' | 'historial' | 'clasificacion'

const K_FACTOR = 32

function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@pingpong.local`
}

function calculateEloDeltas(eloA: number, eloB: number, winnerIsA: boolean) {
  const expectedA = 1 / (1 + Math.pow(10, (eloB - eloA) / 400))
  const scoreA = winnerIsA ? 1 : 0

  const deltaA = Math.round(K_FACTOR * (scoreA - expectedA))
  const deltaB = -deltaA

  return { deltaA, deltaB }
}

function formatDate(dateValue: string | null) {
  if (!dateValue) {
    return 'Sin fecha'
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateValue))
}

function getStatusLabel(status: MatchHistoryRow['status']) {
  if (status === 'pending') return 'Pendiente'
  if (status === 'active') return 'Activa'
  if (status === 'completed') return 'Completada'
  if (status === 'cancelled') return 'Cancelada'
  return status
}

function App() {
  const [session, setSession] = useState<Session | null>(null)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [myProfile, setMyProfile] = useState<Profile | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([])
  const [matchHistory, setMatchHistory] = useState<MatchHistoryRow[]>([])
  const [selectedOpponentId, setSelectedOpponentId] = useState('')
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('perfil')

  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [matchLoading, setMatchLoading] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [refreshLoading, setRefreshLoading] = useState(false)

  useEffect(() => {
    async function loadSession() {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        setErrorMessage(error.message)
      }

      setSession(data.session)
      setLoading(false)
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function loadAppData(activeSession: Session) {
    setDataLoading(true)
    setErrorMessage('')

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name, elo, matches_played, wins, losses')
      .eq('id', activeSession.user.id)
      .single()

    if (profileError) {
      setErrorMessage(profileError.message)
      setDataLoading(false)
      return
    }

    const { data: leaderboardData, error: leaderboardError } = await supabase
      .from('leaderboard')
      .select('id, username, display_name, elo, matches_played, wins, losses, win_rate, official')

    if (leaderboardError) {
      setErrorMessage(leaderboardError.message)
      setDataLoading(false)
      return
    }

    const { data: historyData, error: historyError } = await supabase
      .from('my_match_history')
      .select('*')
      .order('created_at', { ascending: false })

    if (historyError) {
      setErrorMessage(historyError.message)
      setDataLoading(false)
      return
    }

    setMyProfile(profileData)
    setLeaderboard(leaderboardData ?? [])
    setMatchHistory(historyData ?? [])
    setDataLoading(false)
  }

  useEffect(() => {
    if (!session) {
      setMyProfile(null)
      setLeaderboard([])
      setCurrentMatch(null)
      setMatchHistory([])
      return
    }

    loadAppData(session)
  }, [session])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setErrorMessage('')
    setSuccessMessage('')
    setLoginLoading(true)

    const email = usernameToEmail(username)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMessage('Usuario o contraseña incorrectos.')
      setLoginLoading(false)
      return
    }

    setUsername('')
    setPassword('')
    setActiveTab('perfil')
    setLoginLoading(false)
  }

  async function handleLogout() {
    setErrorMessage('')
    setSuccessMessage('')
    await supabase.auth.signOut()
    setMyProfile(null)
    setLeaderboard([])
    setCurrentMatch(null)
    setMatchHistory([])
    setActiveTab('perfil')
  }

  async function handleStartMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedOpponentId) {
      setErrorMessage('Selecciona un rival.')
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setMatchLoading(true)

    const { data, error } = await supabase.rpc('start_match', {
      opponent_id: selectedOpponentId,
    })

    if (error) {
      setErrorMessage(error.message)
      setMatchLoading(false)
      return
    }

    const match = data as Match
    setCurrentMatch(match)

    if (match.status === 'pending') {
      setSuccessMessage('Partida creada. Esperando a que el rival también la inicie.')
    }

    if (match.status === 'active') {
      setSuccessMessage('Partida activa. Ya podéis jugar y después confirmar el ganador.')
    }

    if (session) {
      await loadAppData(session)
    }

    setSelectedOpponentId('')
    setMatchLoading(false)
  }

  async function handleConfirmWinner(winnerId: string) {
    if (!currentMatch) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setConfirmLoading(true)

    const { data, error } = await supabase.rpc('confirm_winner', {
      match_id: currentMatch.id,
      selected_winner_id: winnerId,
    })

    if (error) {
      setErrorMessage(error.message)
      setConfirmLoading(false)
      return
    }

    const updatedMatch = data as Match
    setCurrentMatch(updatedMatch)

    if (updatedMatch.status === 'completed') {
      setSuccessMessage('Partida completada. Elo actualizado correctamente.')

      if (session) {
        await loadAppData(session)
      }
    } else if (
      updatedMatch.confirmation_a &&
      updatedMatch.confirmation_b &&
      updatedMatch.confirmation_a !== updatedMatch.confirmation_b
    ) {
      setSuccessMessage('No coincidís en el ganador. Revisad el resultado y volved a confirmar.')
    } else {
      setSuccessMessage('Confirmación guardada. Esperando al otro jugador.')
    }

    setConfirmLoading(false)
  }

  async function refreshCurrentMatch() {
    if (!currentMatch) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setRefreshLoading(true)

    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', currentMatch.id)
      .single()

    if (error) {
      setErrorMessage(error.message)
      setRefreshLoading(false)
      return
    }

    const updatedMatch = data as Match
    setCurrentMatch(updatedMatch)

    if (session) {
      await loadAppData(session)
    }

    if (updatedMatch.status === 'completed') {
      setSuccessMessage('Partida completada. Datos actualizados.')
    } else {
      setSuccessMessage('Estado de la partida actualizado.')
    }

    setRefreshLoading(false)
  }

  function getPlayerById(playerId: string) {
    return leaderboard.find((item) => item.id === playerId)
  }

  function getPlayerName(playerId: string | null) {
    if (!playerId) {
      return 'Jugador desconocido'
    }

    const player = getPlayerById(playerId)
    return player?.display_name ?? 'Jugador desconocido'
  }

  function getConfirmationText(match: Match) {
    if (!match.confirmation_a && !match.confirmation_b) {
      return 'Todavía no hay confirmaciones.'
    }

    if (match.confirmation_a && !match.confirmation_b) {
      return `${getPlayerName(match.player_a)} ha confirmado que ganó ${getPlayerName(match.confirmation_a)}.`
    }

    if (!match.confirmation_a && match.confirmation_b) {
      return `${getPlayerName(match.player_b)} ha confirmado que ganó ${getPlayerName(match.confirmation_b)}.`
    }

    if (match.confirmation_a === match.confirmation_b) {
      return `Ambos han confirmado que ganó ${getPlayerName(match.confirmation_a)}.`
    }

    return `No coincidís: ${getPlayerName(match.player_a)} eligió ${getPlayerName(
      match.confirmation_a
    )} y ${getPlayerName(match.player_b)} eligió ${getPlayerName(match.confirmation_b)}.`
  }

  const officialPlayers = leaderboard.filter((player) => player.official)
  const unofficialPlayers = leaderboard.filter((player) => !player.official)
  const possibleOpponents = leaderboard.filter((player) => player.id !== myProfile?.id)

  const currentPlayerA = currentMatch ? getPlayerById(currentMatch.player_a) : null
  const currentPlayerB = currentMatch ? getPlayerById(currentMatch.player_b) : null

  const deltasIfAWins =
    currentPlayerA && currentPlayerB
      ? calculateEloDeltas(currentPlayerA.elo, currentPlayerB.elo, true)
      : null

  const deltasIfBWins =
    currentPlayerA && currentPlayerB
      ? calculateEloDeltas(currentPlayerA.elo, currentPlayerB.elo, false)
      : null

  if (loading) {
    return (
      <main style={styles.page}>
        <h1>Ping Pong Elo</h1>
        <p>Cargando...</p>
      </main>
    )
  }

  if (!session) {
    return (
      <main style={styles.pageNarrow}>
        <h1>Ping Pong Elo</h1>

        <section style={styles.card}>
          <h2>Iniciar sesión</h2>

          <form onSubmit={handleLogin} style={styles.form}>
            <label>
              Nombre de usuario
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="carlosivorra"
                autoCapitalize="none"
                autoComplete="username"
                style={styles.input}
              />
            </label>

            <label>
              Contraseña
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                style={styles.input}
              />
            </label>

            <button type="submit" disabled={loginLoading} style={styles.primaryButton}>
              {loginLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {errorMessage && <p style={styles.error}>{errorMessage}</p>}
        </section>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1>Ping Pong Elo</h1>
          <p style={styles.muted}>
            Sesión iniciada como <strong>{session.user.email}</strong>
          </p>
        </div>

        <button onClick={handleLogout} style={styles.secondaryButton}>
          Cerrar sesión
        </button>
      </header>

      {errorMessage && <p style={styles.error}>Error: {errorMessage}</p>}
      {successMessage && <p style={styles.success}>{successMessage}</p>}
      {dataLoading && <p>Cargando datos...</p>}

      <nav style={styles.tabs}>
        <button
          onClick={() => setActiveTab('perfil')}
          style={activeTab === 'perfil' ? styles.activeTab : styles.inactiveTab}
        >
          Perfil
        </button>

        <button
          onClick={() => setActiveTab('partida')}
          style={activeTab === 'partida' ? styles.activeTab : styles.inactiveTab}
        >
          Nueva partida
        </button>

        <button
          onClick={() => setActiveTab('historial')}
          style={activeTab === 'historial' ? styles.activeTab : styles.inactiveTab}
        >
          Historial
        </button>

        <button
          onClick={() => setActiveTab('clasificacion')}
          style={activeTab === 'clasificacion' ? styles.activeTab : styles.inactiveTab}
        >
          Clasificación
        </button>
      </nav>

      {activeTab === 'perfil' && myProfile && (
        <section style={styles.card}>
          <h2>Mi perfil</h2>

          <div style={styles.profileGrid}>
            <div>
              <p style={styles.label}>Jugador</p>
              <p style={styles.bigText}>{myProfile.display_name}</p>
            </div>

            <div>
              <p style={styles.label}>Elo</p>
              <p style={styles.bigText}>{myProfile.elo}</p>
            </div>

            <div>
              <p style={styles.label}>Partidas</p>
              <p style={styles.bigText}>{myProfile.matches_played}</p>
            </div>

            <div>
              <p style={styles.label}>Victorias</p>
              <p style={styles.bigText}>{myProfile.wins}</p>
            </div>

            <div>
              <p style={styles.label}>Derrotas</p>
              <p style={styles.bigText}>{myProfile.losses}</p>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'partida' && (
        <section style={styles.card}>
          <h2>Nueva partida</h2>

          <form onSubmit={handleStartMatch} style={styles.form}>
            <label>
              Selecciona rival
              <select
                value={selectedOpponentId}
                onChange={(event) => setSelectedOpponentId(event.target.value)}
                style={styles.input}
              >
                <option value="">Elige un jugador...</option>

                {possibleOpponents.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.display_name} — {player.elo} Elo
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" disabled={matchLoading} style={styles.primaryButton}>
              {matchLoading ? 'Creando partida...' : 'Iniciar partida'}
            </button>
          </form>

          {currentMatch && (
            <div style={styles.matchBox}>
              <h3>Partida actual</h3>

              <p>
                <strong>Jugador A:</strong> {getPlayerName(currentMatch.player_a)}
              </p>

              <p>
                <strong>Jugador B:</strong> {getPlayerName(currentMatch.player_b)}
              </p>

              <p>
                <strong>Estado:</strong>{' '}
                {currentMatch.status === 'pending' && 'Pendiente de que el rival también la inicie'}
                {currentMatch.status === 'active' && 'Activa'}
                {currentMatch.status === 'completed' && 'Completada'}
                {currentMatch.status === 'cancelled' && 'Cancelada'}
              </p>

              <button onClick={refreshCurrentMatch} disabled={refreshLoading} style={styles.secondaryButton}>
                {refreshLoading ? 'Actualizando...' : 'Actualizar estado'}
              </button>

              {currentMatch.status === 'pending' && (
                <p style={styles.muted}>
                  Ahora el otro jugador debe entrar en su móvil, pulsar “Nueva partida” y seleccionarte a ti.
                </p>
              )}

              {currentMatch.status === 'active' && currentPlayerA && currentPlayerB && (
                <div style={styles.confirmBox}>
                  <h3>Confirmar ganador</h3>

                  <p style={styles.muted}>
                    Estos son los puntos que ganará o perderá cada jugador según el resultado. La base de datos
                    recalcula el Elo definitivo cuando ambos confirmáis el mismo ganador.
                  </p>

                  {deltasIfAWins && (
                    <div style={styles.outcomeBox}>
                      <p>
                        Si gana <strong>{currentPlayerA.display_name}</strong>:
                      </p>

                      <p>
                        {currentPlayerA.display_name}: {deltasIfAWins.deltaA > 0 ? '+' : ''}
                        {deltasIfAWins.deltaA} puntos
                      </p>

                      <p>
                        {currentPlayerB.display_name}: {deltasIfAWins.deltaB > 0 ? '+' : ''}
                        {deltasIfAWins.deltaB} puntos
                      </p>

                      <button
                        onClick={() => handleConfirmWinner(currentPlayerA.id)}
                        disabled={confirmLoading}
                        style={styles.primaryButton}
                      >
                        Confirmar que ganó {currentPlayerA.display_name}
                      </button>
                    </div>
                  )}

                  {deltasIfBWins && (
                    <div style={styles.outcomeBox}>
                      <p>
                        Si gana <strong>{currentPlayerB.display_name}</strong>:
                      </p>

                      <p>
                        {currentPlayerA.display_name}: {deltasIfBWins.deltaA > 0 ? '+' : ''}
                        {deltasIfBWins.deltaA} puntos
                      </p>

                      <p>
                        {currentPlayerB.display_name}: {deltasIfBWins.deltaB > 0 ? '+' : ''}
                        {deltasIfBWins.deltaB} puntos
                      </p>

                      <button
                        onClick={() => handleConfirmWinner(currentPlayerB.id)}
                        disabled={confirmLoading}
                        style={styles.primaryButton}
                      >
                        Confirmar que ganó {currentPlayerB.display_name}
                      </button>
                    </div>
                  )}

                  <p style={styles.muted}>{getConfirmationText(currentMatch)}</p>
                </div>
              )}

              {currentMatch.status === 'completed' && (
                <div style={styles.completedBox}>
                  <h3>Resultado registrado</h3>

                  <p>
                    Ganador: <strong>{getPlayerName(currentMatch.winner_id)}</strong>
                  </p>

                  <p>
                    {getPlayerName(currentMatch.player_a)}: {currentMatch.elo_a_before} →{' '}
                    {currentMatch.elo_a_after} ({currentMatch.delta_a && currentMatch.delta_a > 0 ? '+' : ''}
                    {currentMatch.delta_a})
                  </p>

                  <p>
                    {getPlayerName(currentMatch.player_b)}: {currentMatch.elo_b_before} →{' '}
                    {currentMatch.elo_b_after} ({currentMatch.delta_b && currentMatch.delta_b > 0 ? '+' : ''}
                    {currentMatch.delta_b})
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {activeTab === 'historial' && (
        <section style={styles.card}>
          <h2>Historial de partidas</h2>

          {matchHistory.length === 0 ? (
            <p>Todavía no tienes partidas registradas.</p>
          ) : (
            <div style={styles.historyList}>
              {matchHistory.map((match) => (
                <div key={match.id} style={styles.historyItem}>
                  <div style={styles.historyHeader}>
                    <div>
                      <strong>vs {match.opponent_name ?? 'Rival desconocido'}</strong>

                      <p style={styles.muted}>
                        {getStatusLabel(match.status)} ·{' '}
                        {formatDate(match.completed_at ?? match.activated_at ?? match.created_at)}
                      </p>
                    </div>

                    {match.status === 'completed' && match.my_delta !== null && (
                      <div style={match.my_delta >= 0 ? styles.positiveDelta : styles.negativeDelta}>
                        {match.my_delta > 0 ? '+' : ''}
                        {match.my_delta}
                      </div>
                    )}
                  </div>

                  {match.status === 'completed' ? (
                    <>
                      <p>
                        Ganador: <strong>{match.winner_name}</strong>
                      </p>

                      <p>
                        Resultado: <strong>{match.did_i_win ? 'Victoria' : 'Derrota'}</strong>
                      </p>

                      <p>
                        Mi Elo: {match.my_elo_before} → {match.my_elo_after}
                      </p>

                      <p>
                        Elo rival: {match.opponent_elo_before} → {match.opponent_elo_after}
                      </p>
                    </>
                  ) : (
                    <>
                      {match.status === 'pending' && (
                        <p style={styles.muted}>Partida pendiente de que el rival también la inicie.</p>
                      )}

                      {match.status === 'active' && (
                        <p style={styles.muted}>
                          Partida activa. Falta confirmar el ganador o resolver las confirmaciones.
                        </p>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'clasificacion' && (
        <>
          <section style={styles.card}>
            <h2>Clasificación oficial</h2>
            <p style={styles.muted}>Solo aparecen aquí los jugadores con 3 partidas o más.</p>

            {officialPlayers.length === 0 ? (
              <p>Todavía no hay jugadores clasificados oficialmente.</p>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Jugador</th>
                      <th style={styles.th}>Elo</th>
                      <th style={styles.th}>PJ</th>
                      <th style={styles.th}>V</th>
                      <th style={styles.th}>D</th>
                      <th style={styles.th}>% victoria</th>
                    </tr>
                  </thead>
                  <tbody>
                    {officialPlayers.map((player, index) => (
                      <tr key={player.id}>
                        <td style={styles.td}>{index + 1}</td>
                        <td style={styles.td}>{player.display_name}</td>
                        <td style={styles.td}>{player.elo}</td>
                        <td style={styles.td}>{player.matches_played}</td>
                        <td style={styles.td}>{player.wins}</td>
                        <td style={styles.td}>{player.losses}</td>
                        <td style={styles.td}>{player.win_rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section style={styles.card}>
            <h2>Sin clasificar</h2>
            <p style={styles.muted}>Jugadores con menos de 3 partidas.</p>

            {unofficialPlayers.length === 0 ? (
              <p>No hay jugadores sin clasificar.</p>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Jugador</th>
                      <th style={styles.th}>Elo</th>
                      <th style={styles.th}>PJ</th>
                      <th style={styles.th}>Faltan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unofficialPlayers.map((player) => (
                      <tr key={player.id}>
                        <td style={styles.td}>{player.display_name}</td>
                        <td style={styles.td}>{player.elo}</td>
                        <td style={styles.td}>{player.matches_played}</td>
                        <td style={styles.td}>{Math.max(0, 3 - player.matches_played)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}

const styles: Record<string, CSSProperties> = {
  page: {
    padding: 16,
    fontFamily: 'system-ui, sans-serif',
    maxWidth: 900,
    margin: '0 auto',
  },
  pageNarrow: {
    padding: 24,
    fontFamily: 'system-ui, sans-serif',
    maxWidth: 420,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  tabs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
    marginBottom: 20,
    position: 'sticky',
    top: 0,
    background: '#fff',
    padding: '8px 0',
    zIndex: 10,
  },
  activeTab: {
    padding: '10px 8px',
    borderRadius: 8,
    border: '1px solid #111',
    background: '#111',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
  },
  inactiveTab: {
    padding: '10px 8px',
    borderRadius: 8,
    border: '1px solid #ccc',
    background: '#fff',
    color: '#111',
    fontWeight: 700,
    cursor: 'pointer',
  },
  card: {
    border: '1px solid #ddd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    background: '#fff',
  },
  form: {
    display: 'grid',
    gap: 12,
  },
  input: {
    display: 'block',
    width: '100%',
    padding: 10,
    marginTop: 4,
    border: '1px solid #ccc',
    borderRadius: 8,
    boxSizing: 'border-box',
  },
  primaryButton: {
    padding: '10px 14px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
  },
  secondaryButton: {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #ccc',
    cursor: 'pointer',
    background: '#fff',
  },
  profileGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 16,
  },
  label: {
    margin: 0,
    color: '#666',
    fontSize: 14,
  },
  bigText: {
    margin: '4px 0 0',
    fontSize: 24,
    fontWeight: 700,
  },
  muted: {
    color: '#666',
  },
  error: {
    color: 'crimson',
    border: '1px solid #f3b6c1',
    background: '#fff5f7',
    padding: 12,
    borderRadius: 8,
  },
  success: {
    color: '#116329',
    border: '1px solid #b7e4c7',
    background: '#f0fff4',
    padding: 12,
    borderRadius: 8,
  },
  matchBox: {
    marginTop: 16,
    padding: 12,
    border: '1px solid #ddd',
    borderRadius: 8,
    background: '#fafafa',
  },
  confirmBox: {
    marginTop: 16,
    display: 'grid',
    gap: 12,
  },
  outcomeBox: {
    border: '1px solid #ddd',
    borderRadius: 8,
    padding: 12,
    background: '#fff',
  },
  completedBox: {
    marginTop: 16,
    border: '1px solid #b7e4c7',
    borderRadius: 8,
    padding: 12,
    background: '#f0fff4',
  },
  historyList: {
    display: 'grid',
    gap: 12,
  },
  historyItem: {
    border: '1px solid #ddd',
    borderRadius: 8,
    padding: 12,
    background: '#fafafa',
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  positiveDelta: {
    fontWeight: 700,
    color: '#116329',
    fontSize: 20,
  },
  negativeDelta: {
    fontWeight: 700,
    color: 'crimson',
    fontSize: 20,
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    borderBottom: '1px solid #ddd',
    padding: 8,
  },
  td: {
    borderBottom: '1px solid #eee',
    padding: 8,
  },
}

export default App

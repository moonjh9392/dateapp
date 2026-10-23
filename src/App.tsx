import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './utils/supabase'
import { ArrowLeft, ArrowRight, Check, Clock3, Heart, LockKeyhole, LogOut, MessageCircle, Popcorn, Send, Utensils, Wifi, WifiOff } from 'lucide-react'

type Restaurant = { id: string; name: string; category: string; description: string; emoji: string; walkMinutes: number | null; featured?: boolean }
type ResponseRow = { id: string; restaurant_id: string; movie: boolean; comment: string | null; created_at: string }

const restaurants: Restaurant[] = [
  { id: 'badagot', name: '바다곶', category: '활고등어회 · 제철 모둠회', description: '신선한 활고등어회가 대표 메뉴', emoji: '🌊', walkMinutes: null, featured: true },
  { id: 'moseon', name: '모선', category: '숙성 연어 · 초밥', description: '연어덮밥과 연어 초밥 전문', emoji: '🍣', walkMinutes: 8 },
  { id: 'yukhwatan', name: '육화탄 괴정점', category: '숙성 돼지고기구이', description: '24일 숙성 삼겹살과 목살', emoji: '🥩', walkMinutes: 2 },
  { id: 'jackpasta', name: '잭파스타 & 커피', category: '뇨끼 · 파스타 · 커피', description: '파스타 먹고 커피까지 한 번에', emoji: '🍝', walkMinutes: 2 },
]
const restaurantById = new Map(restaurants.map((place) => [place.id, place]))
const homeUrl = import.meta.env.BASE_URL
const mealDurationMinutes = 90
const movieBufferMinutes = 30

function formatPlanTime(minutesAfterMidnight: number) {
  const hours = Math.floor(minutesAfterMidnight / 60) % 24
  const minutes = minutesAfterMidnight % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function ItineraryTimeline({ restaurantId, movie }: { restaurantId: string; movie: boolean | null }) {
  const place = restaurantById.get(restaurantId)
  const badagotArrival = 17 * 60 + 20
  const walk = place?.walkMinutes ?? 0
  const restaurantArrival = badagotArrival + walk
  const mealEnd = restaurantArrival + mealDurationMinutes
  const movieStart = mealEnd + movieBufferMinutes
  const steps = [
    { time: '17:00', title: '회사 출발', detail: '택시 이동' },
    { time: formatPlanTime(badagotArrival), title: '바다곶 도착', detail: '택시 약 20분' },
    ...(walk ? [{ time: formatPlanTime(restaurantArrival), title: `${place?.name} 도착`, detail: `바다곶에서 도보 약 ${walk}분` }] : []),
    { time: formatPlanTime(mealEnd), title: '식사 마무리', detail: '식사 약 90분 예상' },
  ]

  return <section className="itinerary-card" aria-label="예상 데이트 시간표">
    <div className="itinerary-heading"><span>🕰️</span><strong>예상 시간표</strong><span className="itinerary-caption">바다곶 기준</span></div>
    <ol className="itinerary-list">{steps.map((step) => <li className="itinerary-step" key={`${step.time}-${step.title}`}><time>{step.time}</time><span className="itinerary-dot"/><div><strong>{step.title}</strong><small>{step.detail}</small></div></li>)}
      <li className={`itinerary-step ${movie === false ? 'itinerary-muted' : 'itinerary-movie'}`}><time>{movie === false ? '—' : formatPlanTime(movieStart)}</time><span className="itinerary-dot"/><div><strong>{movie === false ? '영화는 이번엔 패스' : movie === true ? '영화 시작 예상' : '영화 선택 시 시작 예상'}</strong><small>{movie === false ? '식사 후 자유 일정' : `식사 후 30분 여유 · 치이카와 극장판`}</small></div></li>
    </ol>
    <p className="itinerary-note">식사와 영화 시각은 예상 일정이야. 실제 상영 시간에 맞춰 조정하면 돼.</p>
  </section>
}

export default function App() {
  const isAdmin = new URLSearchParams(window.location.search).get('admin') === '1'
  return isAdmin ? <AdminPage /> : <VotingPage />
}

function VotingPage() {
  const [restaurant, setRestaurant] = useState('badagot')
  const [movie, setMovie] = useState<boolean | null>(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (movie === null) { setError('영화 관람 여부를 골라주세요.'); return }
    if (!supabase) { setError('아직 응답함이 연결되지 않았어요. 관리자에게 설정을 부탁해 주세요.'); return }
    setBusy(true); setError('')
    const { error: submitError } = await supabase.from('date_responses').insert({ restaurant_id: restaurant, movie, comment: comment.trim() || null })
    setBusy(false)
    if (submitError) setError('응답을 보내지 못했어요. 잠시 후 다시 시도해 주세요.')
    else setSubmitted(true)
  }

  return <main className="page-shell">
    <header className="topbar"><a className="brand" href={homeUrl}><span className="brand-mark"><Heart size={17} fill="currentColor" /></span> little date plan</a><span className="top-note">둘이 함께 만드는 하루</span></header>
    <section className="hero">
      <div className="eyebrow"><span className="eyebrow-line" /> OUR NEXT DATE</div>
      <h1>이번 데이트,<br /><em>같이 골라볼까?</em></h1>
      <p>마음에 드는 코스를 골라줘.<br />네 선택으로 우리의 하루가 완성돼!</p>
      <div className="hero-stamp"><span>made<br />for two</span><Heart size={19} fill="currentColor" /></div>
      <div className="hero-doodle doodle-one">✳</div><div className="hero-doodle doodle-two">♡</div>
    </section>

    {submitted ? <><section className="success-card" role="status"><span className="success-icon"><Check size={26} /></span><div className="eyebrow">CHOICE SENT</div><h2>선택 완료!</h2><p>{restaurantById.get(restaurant)?.name}에서 밥 먹고 {movie ? '영화도 같이' : '산책하며'} 즐거운 시간 보내자 💛</p><div className="sent-summary"><span>{restaurantById.get(restaurant)?.emoji} {restaurantById.get(restaurant)?.name}</span><span>{movie ? '🎬 영화 볼래!' : '🌙 영화는 다음에'}</span></div></section><ItineraryTimeline restaurantId={restaurant} movie={movie} /></> : <form onSubmit={submit} className="form-content">
      <section className="selection-section" aria-labelledby="restaurant-title">
        <div className="section-heading"><div className="section-number">01</div><div><span className="section-kicker">FIRST, LET'S EAT</span><h2 id="restaurant-title">어디서 밥 먹을까?</h2></div><Utensils className="heading-icon" size={22} /></div>
        <div className="restaurant-grid">{restaurants.map((place) => <button type="button" key={place.id} onClick={() => setRestaurant(place.id)} className={`restaurant-card ${restaurant === place.id ? 'selected' : ''} ${place.featured ? 'featured' : ''}`} aria-pressed={restaurant === place.id}>
          <span className="restaurant-emoji">{place.emoji}</span><span className="restaurant-copy"><span className="restaurant-category">{place.category}</span><strong>{place.name}</strong><span className="restaurant-description">{place.description}</span><span className="restaurant-meta"><span className={`restaurant-rank ${place.featured ? 'first-pick' : ''}`}>{place.featured ? '우리 1픽' : '대안'}</span>{place.walkMinutes !== null && <span className="restaurant-walk">바다곶에서 도보 약 {place.walkMinutes}분</span>}</span></span><span className="radio-indicator">{restaurant === place.id && <Check size={13} strokeWidth={3} />}</span>
        </button>)}</div>
        <div className="recommend-note"><span>✦</span> 바다곶이 오늘의 1순위야. 도보 시간은 주소 기준 예상이야 💌</div>
      </section>
      <section className="selection-section movie-section" aria-labelledby="movie-title">
        <div className="section-heading"><div className="section-number">02</div><div><span className="section-kicker">AND THEN?</span><h2 id="movie-title">영화도 볼까?</h2></div><Popcorn className="heading-icon" size={22} /></div>
        <div className="movie-card"><div className="movie-art"><span>ちいかわ</span><b>THE MOVIE</b><span>✦ ୨୧ ✦</span></div><div className="movie-info"><span className="movie-label">선택 코스</span><strong>치이카와 극장판</strong><span>귀여움 충전하러 가기 🐰</span></div><ArrowRight className="movie-arrow" size={17} /></div>
        <div className="choice-row"><button type="button" className={`pill-choice ${movie === true ? 'active' : ''}`} aria-pressed={movie === true} onClick={() => setMovie(true)}>🎬 좋아, 보자!</button><button type="button" className={`pill-choice ${movie === false ? 'active' : ''}`} aria-pressed={movie === false} onClick={() => setMovie(false)}>🌿 밥 먹고 정하자</button></div>
      </section>
      <section className="selection-section comment-section"><label className="section-heading" htmlFor="comment"><div className="section-number">03</div><div><span className="section-kicker">A LITTLE NOTE</span><h2>하고 싶은 말 있어?</h2></div><MessageCircle className="heading-icon" size={21} /></label><textarea id="comment" maxLength={300} rows={3} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="시간이나 먹고 싶은 메뉴도 좋아! (선택)" /><div className="char-count">{comment.length} / 300</div></section>
      <section className="review-card"><div className="review-heading"><span className="review-spark">✦</span><strong>우리의 데이트 코스</strong><span className="review-caption">최종 확인</span></div><div className="review-line"><span>🍽️ 식사</span><strong>{restaurantById.get(restaurant)?.name}</strong></div><div className="review-line"><span>🎞️ 영화</span><strong>{movie === null ? '선택 전' : movie ? '치이카와 극장판' : '이번엔 패스'}</strong></div><ItineraryTimeline restaurantId={restaurant} movie={movie} /><div className="review-divider"/><button className="submit-button" type="submit" disabled={busy}>{busy ? '보내는 중…' : <>선택 보내기 <Send size={16} /></>}</button>{error && <p className="error-message" role="alert">{error}</p>}<p className="privacy-note"><LockKeyhole size={11} /> 선택은 우리 둘만 볼 수 있어</p></section>
    </form>}
    <footer className="page-footer"><span>made with <Heart size={11} fill="currentColor" /> for us</span><a href={`${homeUrl}?admin=1`}>관리자</a></footer>
  </main>
}

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [rows, setRows] = useState<ResponseRow[]>([])
  const [live, setLive] = useState(false)
  const [loading, setLoading] = useState(false)
  const totals = useMemo(() => ({ count: rows.length, movies: rows.filter((row) => row.movie).length }), [rows])

  useEffect(() => {
    if (!supabase) { setReady(true); return }
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => authListener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !session || session.user.app_metadata?.role !== 'admin') { setRows([]); setLive(false); return }
    let active = true
    setLoading(true)
    void supabase.from('date_responses').select('id, restaurant_id, movie, comment, created_at').order('created_at', { ascending: false }).then(({ data, error: queryError }) => {
      if (!active) return
      setLoading(false)
      if (queryError) setError('응답을 불러오지 못했어요. SQL 정책과 Supabase 로그를 확인해 주세요.')
      else { setError(''); setRows(data ?? []) }
    })
    const channel = supabase.channel('admin-date-responses').on('postgres_changes', { event: '*', schema: 'public', table: 'date_responses' }, (payload) => {
      if (payload.eventType === 'INSERT') setRows((current) => [payload.new as ResponseRow, ...current])
      if (payload.eventType === 'UPDATE') setRows((current) => current.map((row) => row.id === (payload.new as ResponseRow).id ? payload.new as ResponseRow : row))
      if (payload.eventType === 'DELETE') setRows((current) => current.filter((row) => row.id !== (payload.old as ResponseRow).id))
    }).subscribe((status) => setLive(status === 'SUBSCRIBED'))
    return () => { active = false; void supabase?.removeChannel(channel) }
  }, [session])

  async function signIn(event: FormEvent) {
    event.preventDefault(); setError('')
    if (!supabase) { setError('Supabase 환경변수가 설정되지 않았어요.'); return }
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) setError('로그인할 수 없어요. 관리자 계정 정보를 확인해 주세요.')
  }

  async function signOut() { await supabase?.auth.signOut(); setSession(null); setRows([]) }

  return <main className="admin-shell"><header className="admin-topbar"><a href={homeUrl} className="back-link"><ArrowLeft size={16} /> 데이트 페이지</a><div className="admin-brand"><span className="brand-mark"><Heart size={15} fill="currentColor" /></span> DATE DASHBOARD</div></header>
    {!ready ? <div className="admin-panel centered">확인 중…</div> : !session ? <section className="admin-panel login-panel"><div className="admin-icon"><LockKeyhole size={22} /></div><span className="section-kicker">PRIVATE SPACE</span><h1>관리자 로그인</h1><p>데이트 응답은 인증된 관리자만 확인할 수 있어요.</p><form onSubmit={signIn} className="login-form"><label>이메일<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" /></label><label>비밀번호<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호" /></label><button className="submit-button" type="submit">로그인 <ArrowRight size={16} /></button>{error && <p className="error-message" role="alert">{error}</p>}</form><a href={homeUrl} className="login-back">← 데이트 페이지로 돌아가기</a></section> : session.user.app_metadata?.role !== 'admin' ? <section className="admin-panel login-panel"><div className="admin-icon"><LockKeyhole size={22} /></div><span className="section-kicker">ACCESS REQUIRED</span><h1>관리자 권한이 없어요</h1><p>Supabase에서 이 계정에 app_metadata role=admin 권한을 설정해 주세요.</p><button className="signout-button" onClick={() => void signOut()}><LogOut size={15} /> 로그아웃</button></section> : <>
      <section className="admin-heading"><div><span className="section-kicker">A LITTLE DATE REPORT</span><h1>도착한 마음들</h1><p>파트너의 데이트 선택을 확인해 보세요.</p></div><button className="signout-button" onClick={() => void signOut()}><LogOut size={15} /> 로그아웃</button></section>
      {error && <div className="admin-error" role="alert">{error}</div>}
      {!supabase ? <div className="setup-callout">Supabase 연결 설정이 필요해요. <code>.env.local</code>을 채운 다음 다시 빌드해 주세요.</div> : <>
        <section className="stats-row"><div className="stat-card"><span>전체 응답</span><strong>{totals.count}<small>건</small></strong></div><div className="stat-card"><span>영화도 보고 싶어요</span><strong>{totals.movies}<small>건</small></strong></div><div className="connection-card">{live ? <Wifi size={17} /> : <WifiOff size={17} />}<span>{live ? '실시간 연결됨' : '연결 중…'}</span><i className={live ? 'live-dot' : ''} /></div></section>
        <section className="responses-section"><div className="responses-title"><div><span className="section-kicker">INBOX</span><h2>데이트 선택</h2></div><span className="response-count">{rows.length} RESPONSES</span></div>{loading ? <div className="empty-state">응답을 불러오는 중…</div> : rows.length === 0 ? <div className="empty-state"><span>💌</span><strong>아직 도착한 응답이 없어요</strong><p>링크를 공유하면 선택이 여기에 표시돼요.</p></div> : <div className="response-list">{rows.map((row) => <article className="response-card" key={row.id}><div className="response-top"><span className="response-place">{restaurantById.get(row.restaurant_id)?.emoji ?? '🍽️'} {restaurantById.get(row.restaurant_id)?.name ?? row.restaurant_id}</span><span className="response-time"><Clock3 size={13} />{new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(row.created_at))}</span></div><div className="response-movie">🎬 영화 {row.movie ? '관람할래요' : '이번엔 패스'}</div>{row.comment && <p className="response-comment">“{row.comment}”</p>}</article>)}</div>}</section>
      </>}
    </>}
    <footer className="page-footer admin-footer"><span>private dashboard <Heart size={11} fill="currentColor" /></span><a href={homeUrl}>메인으로</a></footer>
  </main>
}

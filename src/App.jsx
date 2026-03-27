import { useState, useEffect, useRef } from 'react'
import { loadRoom, saveRoom } from './supabase.js'

const PALETTE = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#FF6FC8','#FFA94D','#84DCC6','#E4C1F9']

const TRAITS = [
  '誠實','路不拾遺','忠誠','正直','真實','有信用','守諾言','專一','專心','可靠',
  '內心沒詭詐','誠懇','坦白','無隱藏','誠信','信實','率直','表裡一致','好真實','好raw',
  '承托','承擔','顧家','愛家','犧牲','擺上','無私','認真','負責','盡責',
  '責任感','全心全意','全力以赴','竭力','專注','堅持不放棄','忍耐','吃苦耐勞','有毅力','有韌性',
  '勤勞','穩重','成熟','EQ高','情緒穩定','沉靜','內斂','踏實','細心','細緻',
  '心思細密','謹慎','貼心','能守秘密','節制','有界線','合乎中道','不亢不卑','守規矩','有分寸',
  '守原則','守時','有要求','有層次','有條理','有節奏','擇善固執','精準','敏銳','明辨',
  '精明','聰明','聰穎','醒目','機靈','有智慧','敏捷','機警','靈巧','隨機應變',
  '顧惜','同情心','同理心','體貼','包容','重關係','助人','敞開','愛心','隨和',
  '讓人舒服','和藹','和諧','和睦','寓心','能屈能伸','有恩典','饒恕','仁愛','和平',
  '慈愛','有愛','善良','憐憫','接納','接待','安全感','不記仇','心胸廣闊','親和力',
  '體恤','安慰','愛人如己','視如己出','大方','自信','開朗','健談','活潑好動','精力旺盛',
  '瀟灑','不拘小節','衝勁','領導力','大膽','有膽識','勇於嘗試','有冒險精神','爽朗','熱情',
  '勇敢','不怕衝突','熱心','感性','火熱','有主見','突破','有組織能力','分析力','有判斷力',
  '能引導人','果斷','遠見','有理想','有抱負','有眼光','有深度','會讚美人','懂欣賞人','造就人',
  '合群','團隊精神','有溫度','對人有感覺','可愛','喜樂','幽默','風趣','魅力','搞笑',
  '有創意','會玩','創新','表演慾','好奇','樂天','藝術觸覺','有美感','有氣質','有內涵',
  '有審美眼光','端莊','優雅','有品味','懂得享受','有色彩','浪漫','氣派','自在','怡然自得',
  '通達','瀟灑自在','斯文','處之泰然','文質彬彬','懂得放鬆','隨心而發','不疾不徐','紳士','美麗',
  '青春','童真','逆齡','凍齡','不老','柔軟','快回應','受教','信服','好學',
  '清心','單純','天真爛漫','孝順','溫柔','有Heart','思想積極正面','豐富','謙卑','情義',
  '正義感','公義','公平','公正','整合','表達','主動','有信心','獨立','健康',
  '無框框','有彈性','渴慕','敬畏神','尊榮','對靈魂熱切','靈性','像耶穌','不吝嗇','忠心',
  '慷慨','願意分享','不計較','爽快','豪爽','樂於助人',
]

const MIN_TRAITS = 5
const MAX_TRAITS = 5

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateDerangement(names) {
  for (let t = 0; t < 2000; t++) {
    const s = shuffle(names)
    if (s.every((n, i) => n !== names[i])) {
      const map = {}
      names.forEach((n, i) => { map[n] = s[i] })
      return map
    }
  }
  return null
}

function generateCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase()
}

const SESSION_KEY = 'bg_session'
function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || {} } catch { return {} }
}
function saveSession(data) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)) } catch {}
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY) } catch {}
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=DM+Mono&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { background: #f5f0e8; }
  body { background: #f5f0e8; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #c8b89a; border-radius: 2px; }

  .screen { min-height: 100vh; background: #f5f0e8; padding: 2rem 1rem; display: flex; justify-content: center; }
  .inner { width: 100%; max-width: 480px; }
  .center { align-items: center; }

  .badge { display: inline-flex; align-items: center; font-family: 'DM Mono', monospace; font-size: 0.72rem; letter-spacing: 0.18em; text-transform: uppercase; color: #8c7355; padding: 4px 12px; border-radius: 999px; border: 1px solid #d6c9b3; background: #ede6d8; }
  .serif { font-family: 'DM Serif Display', serif; }
  .mono { font-family: 'DM Mono', monospace; }
  .muted { color: #8c7355; font-size: 0.85rem; }

  .card { background: #fff; border-radius: 20px; box-shadow: 0 2px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04); padding: 1.75rem; }

  .inp { width: 100%; background: #f9f6f1; border: 1.5px solid #e0d9ce; border-radius: 10px; padding: 12px 16px; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; color: #2a1f0f; outline: none; transition: border-color 0.2s; }
  .inp:focus { border-color: #8c7355; }
  .inp::placeholder { color: #bfb09e; }

  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: none; border-radius: 12px; padding: 13px 24px; font-family: 'DM Sans', sans-serif; font-size: 0.92rem; font-weight: 600; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s; }
  .btn-dark { background: #2a1f0f; color: #f5f0e8; }
  .btn-dark:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(42,31,15,0.22); }
  .btn-dark:disabled { opacity: 0.3; cursor: not-allowed; }
  .btn-outline { background: transparent; border: 1.5px solid #d6c9b3; color: #8c7355; }
  .btn-outline:hover:not(:disabled) { border-color: #8c7355; color: #2a1f0f; background: #ede6d8; }
  .btn-outline:disabled { opacity: 0.3; cursor: not-allowed; }
  .btn-full { width: 100%; }

  .progress-bar { background: #e8e0d0; border-radius: 999px; height: 5px; }
  .progress-fill { background: #2a1f0f; border-radius: 999px; height: 100%; transition: width 0.5s ease; }

  .trait-chip { padding: 7px 15px; border-radius: 999px; font-size: 0.8rem; font-family: 'DM Mono', monospace; background: #f0e9de; border: 1.5px solid #d6c9b3; color: #5a4a35; cursor: pointer; transition: all 0.15s; user-select: none; }
  .trait-chip.on { background: #2a1f0f; border-color: #2a1f0f; color: #f5f0e8; }
  .trait-chip:hover:not(.on):not(:disabled) { border-color: #8c7355; color: #2a1f0f; }
  .trait-chip:disabled { opacity: 0.4; cursor: not-allowed; }

  .tag { display: inline-flex; align-items: center; gap: 6px; background: #f0e9de; border: 1px solid #d6c9b3; color: #5a4a35; border-radius: 999px; padding: 5px 12px; font-family: 'DM Mono', monospace; font-size: 0.8rem; }
  .tag-dark { background: #2a1f0f; border-color: #2a1f0f; color: #f5f0e8; }

  .room-box { background: #2a1f0f; border-radius: 16px; padding: 1.5rem; text-align: center; }
  .room-code { font-family: 'DM Mono', monospace; font-size: 2.8rem; color: #f5f0e8; letter-spacing: 0.18em; font-weight: 700; }

  .divider { border: none; border-top: 1px solid #e8e0d0; margin: 1.25rem 0; }

  .status-pill { font-size: 0.72rem; font-family: 'DM Mono', monospace; padding: 3px 8px; border-radius: 999px; white-space: nowrap; }
  .status-done { background: #e8f5e8; color: #2d8a2d; border: 1px solid #b8deb8; }
  .status-wait { background: #f9f6f1; color: #bfb09e; border: 1px solid #e8e0d0; }

  .trait-counter { display: flex; gap: 6px; justify-content: center; margin-bottom: 1rem; }
  .trait-dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid #d6c9b3; background: #f9f6f1; transition: all 0.2s; }
  .trait-dot.filled { background: #2a1f0f; border-color: #2a1f0f; }

  .fab { position: fixed; bottom: 24px; right: 24px; z-index: 999; background: #2a1f0f; color: #f5f0e8; border: none; border-radius: 999px; padding: 12px 20px; font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 0.85rem; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.25); display: flex; align-items: center; gap: 8px; transition: transform 0.15s; }
  .fab:hover { transform: translateY(-2px); }

  @keyframes popIn { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
  @keyframes revealPop { 0% { transform: scale(0.88); opacity: 0; } 70% { transform: scale(1.04); } 100% { transform: scale(1); opacity: 1; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  .fade-up { animation: fadeUp 0.35s ease both; }
  .reveal { animation: revealPop 0.4s cubic-bezier(0.34,1.56,0.64,1); }
`

function Spinner() {
  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:120 }}>
      <div style={{ width:28, height:28, border:'3px solid #e8e0d0', borderTopColor:'#8c7355', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
    </div>
  )
}

function Home({ onMode }) {
  const [showGuide, setShowGuide] = useState(false)

  const hostSteps = [
    { icon:'1', text:'點「我是小組長」，輸入所有組員名字（含自己），建立房間' },
    { icon:'2', text:'將 5 碼房間代碼告知所有組員' },
    { icon:'3', text:'若要自己也參與，在控制台點「加入」輸入自己名字' },
    { icon:'4', text:'等所有人完成填寫，按「開始猜謎」' },
    { icon:'5', text:'逐題展示特質，帶大家猜，再揭曉答案' },
  ]

  const guestSteps = [
    { icon:'1', text:'點「我是組員」，輸入房間代碼和自己的名字' },
    { icon:'2', text:'私下查看抽到的對象（勿讓他人看見！）' },
    { icon:'3', text:'從詞庫選出剛好 5 個人格特質，送出' },
    { icon:'4', text:'等待小組長開始猜謎，看大螢幕一起猜' },
  ]

  return (
    <div className="screen">
      <div className="inner" style={{ paddingTop:'2rem' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ fontSize:'3rem', marginBottom:'0.75rem' }}>🎭</div>
          <h1 className="serif" style={{ fontSize:'2.5rem', color:'#2a1f0f', lineHeight:1.1, marginBottom:'0.5rem' }}>破冰猜謎</h1>
          <p className="muted" style={{ lineHeight:1.7, maxWidth:300, margin:'0 auto' }}>每人抽到一位夥伴，寫下 5 個特質，大家猜猜看描述的是誰</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', justifyContent:'center', marginTop:'1rem' }}>
            {['① 建立房間','② 私下抽籤','③ 填寫特質','④ 猜猜是誰'].map(s => (
              <span key={s} className="badge">{s}</span>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'1.5rem' }}>
          <button className="btn btn-dark btn-full" style={{ padding:'18px', fontSize:'1rem' }} onClick={() => onMode('host')}>
            🏠 我是小組長 / 主持人
          </button>
          <button className="btn btn-outline btn-full" style={{ padding:'18px', fontSize:'1rem' }} onClick={() => onMode('guest')}>
            👋 我是組員（加入房間）
          </button>
        </div>

        <div style={{ textAlign:'center', marginBottom:'1rem' }}>
          <button onClick={() => setShowGuide(v => !v)}
            style={{ background:'none', border:'none', color:'#8c7355', fontSize:'0.85rem',
              fontFamily:'DM Mono, monospace', cursor:'pointer', textDecoration:'underline', textUnderlineOffset:3 }}>
            {showGuide ? '▲ 收起說明' : '▼ 查看操作說明'}
          </button>
        </div>

        {showGuide && (
          <div className="fade-up" style={{ display:'flex', flexDirection:'column', gap:'12px', paddingBottom:'2rem' }}>
            <div className="card">
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'1rem' }}>
                <span style={{ fontSize:'1.1rem' }}>🏠</span>
                <p style={{ fontWeight:600, color:'#2a1f0f' }}>小組長 / 主持人</p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {hostSteps.map(({ icon, text }) => (
                  <div key={icon} style={{ display:'flex', gap:'12px', alignItems:'flex-start' }}>
                    <span style={{
                      width:22, height:22, borderRadius:'50%', background:'#2a1f0f',
                      color:'#f5f0e8', fontSize:'0.72rem', fontFamily:'DM Mono, monospace',
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1
                    }}>{icon}</span>
                    <p style={{ fontSize:'0.88rem', color:'#5a4a35', lineHeight:1.6 }}>{text}</p>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:'1rem', padding:'10px 14px', background:'#f9f6f1',
                borderRadius:10, fontSize:'0.8rem', color:'#8c7355', lineHeight:1.6 }}>
                💡 重新整理頁面不會遺失狀態，可隨時回到控制台
              </div>
            </div>

            <div className="card">
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'1rem' }}>
                <span style={{ fontSize:'1.1rem' }}>👋</span>
                <p style={{ fontWeight:600, color:'#2a1f0f' }}>組員</p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {guestSteps.map(({ icon, text }) => (
                  <div key={icon} style={{ display:'flex', gap:'12px', alignItems:'flex-start' }}>
                    <span style={{
                      width:22, height:22, borderRadius:'50%', background:'#8c7355',
                      color:'#f5f0e8', fontSize:'0.72rem', fontFamily:'DM Mono, monospace',
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1
                    }}>{icon}</span>
                    <p style={{ fontSize:'0.88rem', color:'#5a4a35', lineHeight:1.6 }}>{text}</p>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:'1rem', padding:'10px 14px', background:'#f9f6f1',
                borderRadius:10, fontSize:'0.8rem', color:'#8c7355', lineHeight:1.6 }}>
                💡 填寫完後等待小組長開始，無需一直盯著畫面
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function HostSetup({ onCreated, onBack }) {
  const [input, setInput] = useState('')
  const [names, setNames] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const ref = useRef()

  const add = () => {
    const n = input.trim()
    if (!n) return
    if (names.includes(n)) { setErr('名字已存在'); return }
    setNames(p => [...p, n]); setInput(''); setErr('')
    setTimeout(() => ref.current?.focus(), 50)
  }

  const create = async () => {
    setLoading(true)
    const code = generateCode()
    const assignment = generateDerangement(names)
    const room = { code, names, assignment, drawnSet: [], traitsMap: {}, phase: 'draw', createdAt: Date.now() }
    const ok = await saveRoom(code, room)
    setLoading(false)
    if (!ok) { setErr('建立失敗，請稍後再試'); return }
    onCreated(code, room)
  }

  return (
    <div className="screen">
      <div className="inner">
        <button className="btn btn-outline" style={{ marginBottom:'1.5rem', padding:'8px 16px', fontSize:'0.85rem' }} onClick={onBack}>← 返回</button>
        <div style={{ marginBottom:'2rem' }}>
          <span className="badge">小組長 / 主持人</span>
          <h2 className="serif" style={{ fontSize:'2rem', color:'#2a1f0f', marginTop:'0.6rem' }}>建立房間</h2>
          <p className="muted" style={{ marginTop:'0.4rem' }}>輸入所有組員的名字（包含自己）</p>
        </div>
        <div className="card">
          <div style={{ display:'flex', gap:'8px', marginBottom:'0.6rem' }}>
            <input ref={ref} className="inp" placeholder="輸入姓名…" value={input}
              onChange={e => { setInput(e.target.value); setErr('') }}
              onKeyDown={e => e.key === 'Enter' && add()} />
            <button className="btn btn-dark" style={{ whiteSpace:'nowrap', padding:'12px 18px' }} onClick={add}>新增</button>
          </div>
          {err && <p style={{ color:'#c0392b', fontSize:'0.8rem', fontFamily:'DM Mono, monospace', marginBottom:'0.6rem' }}>{err}</p>}
          {names.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:'7px', background:'#f9f6f1', borderRadius:'12px', padding:'12px', minHeight:48, maxHeight:150, overflowY:'auto', marginBottom:'1rem' }}>
              {names.map((n, i) => (
                <span key={n} className="tag" style={{ borderColor: PALETTE[i % PALETTE.length] + '88' }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:PALETTE[i % PALETTE.length], display:'block' }} />
                  {n}
                  <button onClick={() => setNames(p => p.filter(x => x !== n))}
                    style={{ background:'none', border:'none', color:'#bfb09e', cursor:'pointer', fontSize:'1rem', lineHeight:1, padding:0 }}>×</button>
                </span>
              ))}
            </div>
          )}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span className="muted mono" style={{ fontSize:'0.78rem' }}>
              {names.length < 3 ? `至少需要 3 人（目前 ${names.length}）` : `共 ${names.length} 位 ✓`}
            </span>
            <button className="btn btn-dark" disabled={names.length < 3 || loading} onClick={create}>
              {loading ? '建立中…' : '建立房間 →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function HostDashboard({ code, initialRoom, myName, hostAsGuest, onJoinAsGuest, onReveal }) {
  const [room, setRoom] = useState(initialRoom)
  const [joinName, setJoinName] = useState('')
  const [showJoin, setShowJoin] = useState(false)
  const [joinErr, setJoinErr] = useState('')

  useEffect(() => {
    const id = setInterval(async () => {
      const r = await loadRoom(code)
      if (r) setRoom(r)
    }, 3000)
    return () => clearInterval(id)
  }, [code])

  const allDone = room && room.names.every(n => room.traitsMap[n])
  const filled = room ? room.names.filter(n => room.traitsMap[n]).length : 0
  const drawn = room ? (room.drawnSet?.length || 0) : 0

  const startReveal = async () => {
    const updated = { ...room, phase: 'reveal' }
    await saveRoom(code, updated)
    onReveal(updated)
  }

  const handleJoin = () => {
    const n = joinName.trim()
    if (!n) { setJoinErr('請輸入你的名字'); return }
    if (!room.names.includes(n)) { setJoinErr(`「${n}」不在名單中`); return }
    onJoinAsGuest(n)
  }

  if (!room) return <div className="screen center"><div className="inner"><Spinner /></div></div>

  return (
    <div className="screen">
      <div className="inner">
        <div style={{ marginBottom:'1.5rem' }}>
          <span className="badge">主持人控制台</span>
          <h2 className="serif" style={{ fontSize:'1.8rem', color:'#2a1f0f', marginTop:'0.6rem' }}>房間狀態</h2>
        </div>

        <div className="room-box" style={{ marginBottom:'1.5rem' }}>
          <p style={{ color:'#c8b89a', fontSize:'0.75rem', fontFamily:'DM Mono, monospace', letterSpacing:'0.2em', marginBottom:'0.4rem' }}>ROOM CODE</p>
          <div className="room-code">{code}</div>
          <p style={{ color:'#8c7355', fontSize:'0.8rem', marginTop:'0.6rem' }}>組員打開網站，輸入此代碼加入</p>
        </div>

        {!hostAsGuest && (
          <div className="card" style={{ marginBottom:'1.5rem', background:'#fffbf5', border:'1.5px solid #e8d9b8' }}>
            {!showJoin ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <p style={{ fontWeight:600, color:'#2a1f0f', fontSize:'0.9rem' }}>你也要參與遊戲？</p>
                  <p className="muted" style={{ fontSize:'0.8rem', marginTop:'2px' }}>以組員身份抽籤並填寫特質</p>
                </div>
                <button className="btn btn-outline" style={{ whiteSpace:'nowrap', padding:'10px 16px', fontSize:'0.85rem' }}
                  onClick={() => setShowJoin(true)}>加入 →</button>
              </div>
            ) : (
              <div>
                <p style={{ fontWeight:600, color:'#2a1f0f', marginBottom:'0.75rem' }}>輸入你在名單中的名字</p>
                <div style={{ display:'flex', gap:'8px' }}>
                  <input className="inp" placeholder="你的名字…" value={joinName}
                    onChange={e => { setJoinName(e.target.value); setJoinErr('') }}
                    onKeyDown={e => e.key === 'Enter' && handleJoin()} />
                  <button className="btn btn-dark" style={{ whiteSpace:'nowrap', padding:'12px 16px' }} onClick={handleJoin}>確認</button>
                </div>
                {joinErr && <p style={{ color:'#c0392b', fontSize:'0.8rem', marginTop:'6px', fontFamily:'DM Mono, monospace' }}>{joinErr}</p>}
              </div>
            )}
          </div>
        )}

        {hostAsGuest && (
          <div className="card" style={{ marginBottom:'1.5rem', background:'#e8f5e8', border:'1.5px solid #b8deb8' }}>
            <p style={{ fontSize:'0.85rem', color:'#2d8a2d', fontWeight:600 }}>✓ 你已加入遊戲（{myName}）</p>
            <p className="muted" style={{ fontSize:'0.78rem', marginTop:'4px' }}>使用右下角按鈕切換到組員畫面</p>
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'1.5rem' }}>
          {[{ label:'已抽籤', val:drawn, total:room.names.length }, { label:'已填特質', val:filled, total:room.names.length }].map(({ label, val, total }) => (
            <div key={label} className="card" style={{ textAlign:'center' }}>
              <div style={{ fontSize:'2rem', fontWeight:700, color:'#2a1f0f', fontFamily:'DM Mono, monospace' }}>{val}<span style={{ fontSize:'1rem', color:'#bfb09e' }}>/{total}</span></div>
              <div className="muted" style={{ fontSize:'0.8rem', marginTop:'4px' }}>{label}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom:'1.5rem' }}>
          <p style={{ fontWeight:600, color:'#2a1f0f', marginBottom:'1rem' }}>組員狀態</p>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {room.names.map((n, i) => (
              <div key={n} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:PALETTE[i % PALETTE.length], flexShrink:0 }} />
                <span style={{ flex:1, fontSize:'0.9rem', color:'#2a1f0f' }}>{n}</span>
                <span className={`status-pill ${room.drawnSet?.includes(n) ? 'status-done' : 'status-wait'}`}>抽籤{room.drawnSet?.includes(n) ? '✓' : '…'}</span>
                <span className={`status-pill ${room.traitsMap?.[n] ? 'status-done' : 'status-wait'}`}>特質{room.traitsMap?.[n] ? '✓' : '…'}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-dark btn-full" disabled={!allDone} onClick={startReveal}>
          {allDone ? '開始猜謎 →' : `等待所有人填寫（${filled}/${room.names.length}）`}
        </button>
        {!allDone && <p className="muted" style={{ textAlign:'center', fontSize:'0.78rem', marginTop:'0.75rem' }}>每 3 秒自動更新</p>}
      </div>
    </div>
  )
}

function GuestJoin({ onJoined, onBack }) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const join = async () => {
    const c = code.trim().toUpperCase()
    const n = name.trim()
    if (!c || !n) { setErr('請填寫房間代碼和姓名'); return }
    setLoading(true); setErr('')
    const room = await loadRoom(c)
    if (!room) { setErr('找不到房間，請確認代碼'); setLoading(false); return }
    if (!room.names.includes(n)) { setErr(`「${n}」不在參與者名單中`); setLoading(false); return }
    setLoading(false)
    onJoined(c, n, room)
  }

  return (
    <div className="screen center">
      <div className="inner">
        <button className="btn btn-outline" style={{ marginBottom:'1.5rem', padding:'8px 16px', fontSize:'0.85rem' }} onClick={onBack}>← 返回</button>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>🎭</div>
          <h1 className="serif" style={{ fontSize:'2rem', color:'#2a1f0f' }}>加入破冰遊戲</h1>
          <p className="muted" style={{ marginTop:'0.5rem' }}>輸入小組長給你的房間代碼</p>
        </div>
        <div className="card">
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div>
              <label style={{ fontSize:'0.8rem', color:'#8c7355', fontFamily:'DM Mono, monospace', display:'block', marginBottom:'6px' }}>房間代碼</label>
              <input className="inp" placeholder="例：AB12C" value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setErr('') }}
                onKeyDown={e => e.key === 'Enter' && join()}
                style={{ textTransform:'uppercase', letterSpacing:'0.2em', fontFamily:'DM Mono, monospace', fontSize:'1.2rem' }} />
            </div>
            <div>
              <label style={{ fontSize:'0.8rem', color:'#8c7355', fontFamily:'DM Mono, monospace', display:'block', marginBottom:'6px' }}>你的姓名</label>
              <input className="inp" placeholder="輸入你的名字" value={name}
                onChange={e => { setName(e.target.value); setErr('') }}
                onKeyDown={e => e.key === 'Enter' && join()} />
            </div>
            {err && <p style={{ color:'#c0392b', fontSize:'0.82rem', fontFamily:'DM Mono, monospace' }}>{err}</p>}
            <button className="btn btn-dark btn-full" disabled={loading} onClick={join}>
              {loading ? '加入中…' : '加入 →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function GuestDraw({ code, myName, room, onDone }) {
  const target = room.assignment[myName]
  const alreadyDrawn = room.drawnSet?.includes(myName)
  const [phase, setPhase] = useState(alreadyDrawn ? 'done' : 'ready')
  const [displayed, setDisplayed] = useState('？？？')
  const spinRef = useRef()

  const start = () => {
    setPhase('spinning')
    spinRef.current = setInterval(() => {
      setDisplayed(room.names[Math.floor(Math.random() * room.names.length)])
    }, 70)
    setTimeout(async () => {
      clearInterval(spinRef.current)
      setDisplayed(target)
      setPhase('reveal')
      const latest = await loadRoom(code)
      const updated = { ...latest, drawnSet: [...(latest.drawnSet || []).filter(x => x !== myName), myName] }
      await saveRoom(code, updated)
    }, 1800 + Math.random() * 500)
  }

  const confirm = () => { setDisplayed('？？？'); onDone() }

  if (alreadyDrawn && phase !== 'reveal') {
    return (
      <div className="screen center">
        <div className="inner">
          <div className="card fade-up" style={{ textAlign:'center' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>✅</div>
            <p className="serif" style={{ fontSize:'1.5rem', color:'#2a1f0f', marginBottom:'0.5rem' }}>你已完成抽籤</p>
            <p className="muted">請繼續填寫對方的人格特質</p>
            <button className="btn btn-dark btn-full" style={{ marginTop:'1.5rem' }} onClick={onDone}>填寫特質 →</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen center">
      <div className="inner">
        <div style={{ marginBottom:'1.5rem' }}>
          <span className="badge">② 私下抽籤</span>
          <h2 className="serif" style={{ fontSize:'1.8rem', color:'#2a1f0f', marginTop:'0.6rem' }}>嗨，{myName}！</h2>
          <p className="muted" style={{ marginTop:'0.4rem' }}>確保其他人沒有偷看你的螢幕 👀</p>
        </div>
        <div className="card" style={{ textAlign:'center' }}>
          {phase === 'ready' && (
            <div className="fade-up">
              <p className="muted" style={{ marginBottom:'1.5rem' }}>點擊按鈕，看看你抽到誰</p>
              <button className="btn btn-dark btn-full" onClick={start}>🎲 開始抽籤</button>
            </div>
          )}
          {(phase === 'spinning' || phase === 'reveal') && (
            <div className="fade-up">
              <p className="muted" style={{ marginBottom:'0.75rem' }}>你抽到的人是</p>
              <div className="serif" style={{
                fontSize:'clamp(2.2rem,10vw,3.2rem)',
                color: phase === 'spinning' ? '#bfb09e' : '#2a1f0f',
                minHeight:'4rem', display:'flex', alignItems:'center', justifyContent:'center',
                transition:'color 0.3s',
                animation: phase === 'reveal' ? 'revealPop 0.45s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
              }}>{displayed}</div>
              {phase === 'reveal' && (
                <>
                  <p className="muted" style={{ margin:'1rem 0 0.5rem', fontSize:'0.82rem' }}>
                    記住這個名字！<strong style={{ color:'#2a1f0f' }}>不要讓別人看到</strong>
                  </p>
                  <button className="btn btn-dark btn-full" style={{ marginTop:'1rem' }} onClick={confirm}>已記住，關閉 ✓</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GuestTraits({ code, myName, room, onDone }) {
  const alreadyFilled = !!room.traitsMap?.[myName]
  const [selected, setSelected] = useState(alreadyFilled ? room.traitsMap[myName] : [])
  const [custom, setCustom] = useState('')
  const [saved, setSaved] = useState(alreadyFilled)
  const [saving, setSaving] = useState(false)

  const toggle = t => setSelected(p => p.includes(t) ? p.filter(x => x !== t) : p.length < MAX_TRAITS ? [...p, t] : p)
  const addCustom = () => {
    const t = custom.trim()
    if (!t || selected.includes(t) || selected.length >= MAX_TRAITS) return
    setSelected(p => [...p, t]); setCustom('')
  }

  const submit = async () => {
    if (selected.length < MIN_TRAITS) return
    setSaving(true)
    const latest = await loadRoom(code)
    const updated = { ...latest, traitsMap: { ...latest.traitsMap, [myName]: selected } }
    await saveRoom(code, updated)
    setSaving(false); setSaved(true)
  }

  if (saved) {
    return (
      <div className="screen center">
        <div className="inner">
          <div className="card fade-up" style={{ textAlign:'center' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>🎉</div>
            <p className="serif" style={{ fontSize:'1.5rem', color:'#2a1f0f', marginBottom:'0.5rem' }}>填寫完成！</p>
            <p className="muted" style={{ marginBottom:'1rem' }}>答案已送出，等待小組長開始猜謎</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'7px', justifyContent:'center', marginBottom:'1.5rem' }}>
              {selected.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
            <button className="btn btn-outline btn-full" onClick={onDone}>繼續 →</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="inner">
        <div style={{ marginBottom:'1.5rem' }}>
          <span className="badge">③ 填寫特質</span>
          <h2 className="serif" style={{ fontSize:'1.8rem', color:'#2a1f0f', marginTop:'0.6rem' }}>描述你的對象</h2>
          <p className="muted" style={{ marginTop:'0.4rem' }}>請選擇剛好 5 個特質（不會顯示你的名字）</p>
        </div>
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
            <p style={{ fontWeight:600, color:'#2a1f0f' }}>已選 {selected.length} / {MAX_TRAITS} 個</p>
            <span style={{ fontFamily:'DM Mono, monospace', fontSize:'0.8rem', color: selected.length === MAX_TRAITS ? '#2d8a2d' : '#bfb09e' }}>
              {selected.length === MAX_TRAITS ? '✓ 可以送出' : `還需 ${MAX_TRAITS - selected.length} 個`}
            </span>
          </div>
          <div className="trait-counter">
            {Array.from({ length: MAX_TRAITS }).map((_, i) => (
              <div key={i} className={`trait-dot${i < selected.length ? ' filled' : ''}`} />
            ))}
          </div>
          {selected.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:'7px', background:'#f9f6f1', borderRadius:'12px', padding:'12px', marginBottom:'1rem' }}>
              {selected.map(t => (
                <span key={t} className="tag tag-dark">
                  {t}
                  <button onClick={() => setSelected(p => p.filter(x => x !== t))}
                    style={{ background:'none', border:'none', color:'#8c7355', cursor:'pointer', fontSize:'1rem', lineHeight:1, padding:0 }}>×</button>
                </span>
              ))}
            </div>
          )}
          <p className="muted mono" style={{ fontSize:'0.75rem', marginBottom:'0.6rem' }}>快速選擇</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'7px', marginBottom:'1rem' }}>
            {TRAITS.map(t => (
              <button key={t} className={`trait-chip${selected.includes(t) ? ' on' : ''}`}
                onClick={() => toggle(t)} disabled={selected.length >= MAX_TRAITS && !selected.includes(t)}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', gap:'8px', marginBottom:'1.5rem' }}>
            <input className="inp" placeholder="自訂特質…" value={custom}
              onChange={e => setCustom(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustom()}
              disabled={selected.length >= MAX_TRAITS} />
            <button className="btn btn-outline" onClick={addCustom} disabled={!custom.trim() || selected.length >= MAX_TRAITS}>加入</button>
          </div>
          <button className="btn btn-dark btn-full" disabled={selected.length < MIN_TRAITS || saving} onClick={submit}>
            {saving ? '送出中…' : selected.length === MAX_TRAITS ? '送出答案 ✓' : `還需選 ${MIN_TRAITS - selected.length} 個`}
          </button>
        </div>
      </div>
    </div>
  )
}

function GuestWaiting({ code }) {
  const [started, setStarted] = useState(false)
  useEffect(() => {
    const id = setInterval(async () => {
      const r = await loadRoom(code)
      if (r?.phase === 'reveal') { setStarted(true); clearInterval(id) }
    }, 3000)
    return () => clearInterval(id)
  }, [code])

  return (
    <div className="screen center">
      <div className="inner">
        <div className="card" style={{ textAlign:'center' }}>
          {!started ? (
            <>
              <div style={{ width:36, height:36, border:'3px solid #e8e0d0', borderTopColor:'#8c7355', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 1rem' }} />
              <p className="serif" style={{ fontSize:'1.5rem', color:'#2a1f0f' }}>等待猜謎開始</p>
              <p className="muted" style={{ marginTop:'0.5rem' }}>小組長將在所有人填完後開始</p>
            </>
          ) : (
            <>
              <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>🎉</div>
              <p className="serif" style={{ fontSize:'1.5rem', color:'#2a1f0f' }}>猜謎已開始！</p>
              <p className="muted" style={{ marginTop:'0.5rem' }}>請看小組長的螢幕一起猜</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function HostReveal({ room, onReset }) {
  const entries = Object.entries(room.traitsMap)
  const [idx, setIdx] = useState(0)
  const [showAns, setShowAns] = useState(false)
  const [done, setDone] = useState(false)

  const cur = entries[idx]
  const target = cur ? room.assignment[cur[0]] : ''

  const next = () => {
    setShowAns(false)
    if (idx + 1 >= entries.length) { setDone(true); return }
    setIdx(i => i + 1)
  }

  if (done) {
    return (
      <div className="screen">
        <div className="inner">
          <div style={{ marginBottom:'1.5rem' }}>
            <span className="badge">全部揭曉</span>
            <h2 className="serif" style={{ fontSize:'2rem', color:'#2a1f0f', marginTop:'0.6rem' }}>完整結果 🎉</h2>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {entries.map(([filler, traits], i) => (
              <div key={filler} className="card fade-up" style={{ animationDelay:`${i * 0.05}s` }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'0.75rem', flexWrap:'wrap' }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:PALETTE[i % PALETTE.length] }} />
                  <span style={{ fontWeight:600, color:'#2a1f0f' }}>{filler}</span>
                  <span className="muted">→ 描述 →</span>
                  <span className="serif" style={{ fontSize:'1.1rem', color:PALETTE[i % PALETTE.length] }}>{room.assignment[filler]}</span>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {traits.map(t => <span key={t} className="tag">{t}</span>)}
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-outline btn-full" style={{ marginTop:'1.5rem' }} onClick={onReset}>重新開始 ↺</button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen center">
      <div className="inner">
        <div style={{ marginBottom:'1.5rem' }}>
          <span className="badge">④ 猜謎時間</span>
          <h2 className="serif" style={{ fontSize:'1.8rem', color:'#2a1f0f', marginTop:'0.6rem' }}>這是在描述誰？</h2>
          <div style={{ marginTop:'0.75rem' }}>
            <div className="progress-bar"><div className="progress-fill" style={{ width:`${((idx + 1) / entries.length) * 100}%` }} /></div>
            <p className="muted mono" style={{ fontSize:'0.75rem', marginTop:'4px' }}>第 {idx + 1} 題 / 共 {entries.length} 題</p>
          </div>
        </div>
        <div className="card" style={{ textAlign:'center', marginBottom:'1rem' }}>
          <p className="muted" style={{ marginBottom:'1rem' }}>有人這樣描述他的夥伴：</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', justifyContent:'center', marginBottom:'1.5rem' }}>
            {cur[1].map((t, i) => (
              <span key={t} style={{
                display:'inline-block',
                background: PALETTE[i % PALETTE.length] + '22',
                border:`2px solid ${PALETTE[i % PALETTE.length]}66`,
                color:'#2a1f0f', borderRadius:'999px', padding:'8px 18px',
                fontFamily:'DM Serif Display, serif', fontSize:'1.05rem',
                animation:`popIn 0.3s ${i * 0.07}s both cubic-bezier(0.34,1.56,0.64,1)`,
              }}>{t}</span>
            ))}
          </div>
          {!showAns ? (
            <button className="btn btn-dark btn-full" onClick={() => setShowAns(true)}>🎭 揭曉答案</button>
          ) : (
            <div className="reveal">
              <p className="muted" style={{ fontSize:'0.82rem', marginBottom:'0.3rem' }}>答案是</p>
              <p className="serif" style={{ fontSize:'clamp(2rem,8vw,2.8rem)', color:'#2a1f0f', marginBottom:'0.3rem' }}>{target}</p>
              <p className="muted mono" style={{ fontSize:'0.75rem', marginBottom:'1.5rem' }}>（填寫者將在最後揭曉）</p>
              <button className="btn btn-dark btn-full" onClick={next}>
                {idx + 1 >= entries.length ? '查看完整結果 →' : '下一題 →'}
              </button>
            </div>
          )}
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', justifyContent:'center', opacity:0.6 }}>
          {room.names.map(n => (
            <span key={n} style={{ padding:'4px 12px', borderRadius:'999px', fontSize:'0.75rem', fontFamily:'DM Mono, monospace', background:'#fff', border:'1px solid #e0d9ce', color:'#8c7355' }}>{n}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const saved = loadSession()
  const [mode, setMode] = useState(saved.mode || null)
  const [roomCode, setRoomCode] = useState(saved.roomCode || null)
  const [myName, setMyName] = useState(saved.myName || null)
  const [room, setRoom] = useState(null)
  const [hostStep, setHostStep] = useState(saved.hostStep || 'setup')
  const [guestStep, setGuestStep] = useState(saved.guestStep || 'draw')
  const [hostAsGuest, setHostAsGuest] = useState(saved.hostAsGuest || false)
  const [showingGuestView, setShowingGuestView] = useState(false)
  const [loading, setLoading] = useState(!!saved.roomCode)

  useEffect(() => {
    if (!saved.roomCode) return
    loadRoom(saved.roomCode).then(r => {
      if (r) setRoom(r)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!mode) { clearSession(); return }
    saveSession({ mode, roomCode, myName, hostStep, guestStep, hostAsGuest })
  }, [mode, roomCode, myName, hostStep, guestStep, hostAsGuest])

  const reset = () => {
    clearSession()
    setMode(null); setRoomCode(null); setMyName(null); setRoom(null)
    setHostStep('setup'); setGuestStep('draw')
    setHostAsGuest(false); setShowingGuestView(false)
  }

  const isHostInGuestView = mode === 'host' && hostAsGuest && showingGuestView

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div className="screen center"><div className="inner"><Spinner /></div></div>
    </>
  )

  return (
    <>
      <style>{CSS}</style>

      {mode === 'host' && hostAsGuest && hostStep !== 'setup' && hostStep !== 'reveal' && (
        <button className="fab" onClick={() => setShowingGuestView(v => !v)}>
          {showingGuestView ? '🖥️ 切換到控制台' : '👤 切換到組員畫面'}
        </button>
      )}

      {!mode && <Home onMode={m => setMode(m)} />}

      {mode === 'host' && !isHostInGuestView && hostStep === 'setup' && (
        <HostSetup onBack={reset} onCreated={(c, r) => { setRoomCode(c); setRoom(r); setHostStep('dashboard') }} />
      )}
      {mode === 'host' && !isHostInGuestView && hostStep === 'dashboard' && (
        <HostDashboard
          code={roomCode} initialRoom={room} myName={myName} hostAsGuest={hostAsGuest}
          onJoinAsGuest={name => { setMyName(name); setHostAsGuest(true); setGuestStep('draw'); setShowingGuestView(true) }}
          onReveal={r => { setRoom(r); setHostStep('reveal') }}
        />
      )}
      {mode === 'host' && !isHostInGuestView && hostStep === 'reveal' && (
        <HostReveal room={room} onReset={reset} />
      )}

      {isHostInGuestView && guestStep === 'draw' && room && (
        <GuestDraw code={roomCode} myName={myName} room={room} onDone={() => setGuestStep('traits')} />
      )}
      {isHostInGuestView && guestStep === 'traits' && room && (
        <GuestTraits code={roomCode} myName={myName} room={room} onDone={() => { setGuestStep('done'); setShowingGuestView(false) }} />
      )}
      {isHostInGuestView && guestStep === 'done' && (
        <div className="screen center">
          <div className="inner">
            <div className="card fade-up" style={{ textAlign:'center' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>✅</div>
              <p className="serif" style={{ fontSize:'1.5rem', color:'#2a1f0f', marginBottom:'0.5rem' }}>填寫完成！</p>
              <p className="muted" style={{ marginBottom:'1.5rem' }}>切換回控制台繼續主持遊戲</p>
              <button className="btn btn-dark btn-full" onClick={() => setShowingGuestView(false)}>🖥️ 回到控制台</button>
            </div>
          </div>
        </div>
      )}

      {mode === 'guest' && !roomCode && (
        <GuestJoin onBack={reset} onJoined={(c, n, r) => { setRoomCode(c); setMyName(n); setRoom(r) }} />
      )}
      {mode === 'guest' && roomCode && guestStep === 'draw' && room && (
        <GuestDraw code={roomCode} myName={myName} room={room} onDone={() => setGuestStep('traits')} />
      )}
      {mode === 'guest' && roomCode && guestStep === 'traits' && room && (
        <GuestTraits code={roomCode} myName={myName} room={room} onDone={() => setGuestStep('wait')} />
      )}
      {mode === 'guest' && roomCode && (guestStep === 'wait' || guestStep === 'done') && (
        <GuestWaiting code={roomCode} />
      )}
    </>
  )
}

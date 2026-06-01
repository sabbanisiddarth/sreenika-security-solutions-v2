import React, { useEffect, useRef, useState, useCallback } from 'react'
import { 
  Shield, 
  Camera, 
  Fingerprint, 
  Home, 
  Phone, 
  Flame, 
  Wrench, 
  ChevronRight, 
  Activity, 
  Instagram, 
  MessageSquare 
} from 'lucide-react'
import './App.css'

const TOTAL_FRAMES = 240
const FRAME_STEP = 4
const BATCH_SIZE = 40

const partnerBrands = [
  { name: 'Dahua', logo: '/Dahua.png' },
  { name: 'Hikvision', logo: '/Hikvision.png' },
  { name: 'CP Plus', logo: '/CP Plus.png' },
  { name: 'Bosch', logo: '/BOSCH.png' },
  { name: 'Samsung', logo: '/Samsung.jpg' },
  { name: 'D-Link', logo: '/D-Link.png' },
  { name: 'Godrej', logo: '/Goorej.png' },
  { name: 'Zebronics', logo: '/Zebronics.png' },
  { name: 'Vintron', logo: '/Vintron.png' },
  { name: 'Syntel', logo: '/Syntel.png' },
  { name: 'Syrotech', logo: '/Syrotech.avif' },
]

const stats = [
  { value: '8+', label: 'Years Expertise' },
  { value: '2', label: 'Branch Locations' },
  { value: '99.9%', label: 'Active Uptime' },
]

const sssServices = [
  {
    icon: Camera,
    title: 'CCTV Camera Installation',
    desc: 'Residential & commercial surveillance systems with HD/4K cameras, NVR setups, and secure remote mobile monitoring.',
    tag: 'SERV // 01'
  },
  {
    icon: Fingerprint,
    title: 'Biometric Attendance Systems',
    desc: 'Advanced biometric hardware solutions for accurate attendance tracking, smart access logs, and workforce management.',
    tag: 'SERV // 02'
  },
  {
    icon: Shield,
    title: 'Access Control Systems',
    desc: 'Secure entry management utilizing smart cards, encrypted PIN codes, and localized biometric clearance systems.',
    tag: 'SERV // 03'
  },
  {
    icon: Home,
    title: 'Home Security Systems',
    desc: 'Complete residential fortification featuring smart locks, active intrusion sensors, localized alarms, and remote integration.',
    tag: 'SERV // 04'
  },
  {
    icon: Phone,
    title: 'Video Door Phones',
    desc: 'High-definition video intercom arrays tailored for gated communities, apartments, and corporate entrances.',
    tag: 'SERV // 05'
  },
  {
    icon: Flame,
    title: 'Fire Alarm Systems',
    desc: 'Fully compliant active fire detection, featuring networked smoke triggers, thermal sensors, and instant distress alerts.',
    tag: 'SERV // 06'
  },
  {
    icon: Wrench,
    title: 'Annual Maintenance Contracts (AMC)',
    desc: 'Comprehensive, proactive maintenance structures ensuring continuous hardware uptime, priority support, and regular health audits.',
    tag: 'SERV // 07'
  }
]

export default function App() {
  const canvasRef = useRef(null)
  const imagesRef = useRef(new Array(TOTAL_FRAMES).fill(null))
  const loadedCountRef = useRef(0)
  const lastDrawnIndexRef = useRef(-1)
  const rafRef = useRef(null)

  const [loadProgress, setLoadProgress] = useState(0)
  const [preloaderVisible, setPreloaderVisible] = useState(true)
  const [preloaderFading, setPreloaderFading] = useState(false)
  const [isReady, setIsReady] = useState(false)

  // Scroll phase tracking
  const [activeSection, setActiveSection] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [hoveredValue, setHoveredValue] = useState(null)

  // ── Helper: draw a single img onto the canvas (cover-fit) ──
  const drawImageCovered = useCallback((img) => {
    const canvas = canvasRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')
    const cw = canvas.width
    const ch = canvas.height
    const iw = img.naturalWidth || img.width
    const ih = img.naturalHeight || img.height
    if (!iw || !ih) return

    // Clear the canvas to completely prevent double frame layering glitches
    ctx.clearRect(0, 0, cw, ch)

    // Enable premium high-quality image smoothing for canvas scaling
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    const cRatio = cw / ch
    const iRatio = iw / ih
    let sx, sy, sw, sh

    if (cRatio > iRatio) {
      sw = iw
      sh = iw / cRatio
      sx = 0
      sy = (ih - sh) / 2
    } else {
      sh = ih
      sw = ih * cRatio
      sx = (iw - sw) / 2
      sy = 0
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch)
  }, [])

  // ── Helper: Find the nearest loaded frame index to guarantee continuous display ──
  const getNearestLoadedFrame = useCallback((index) => {
    if (imagesRef.current[index]) return index

    // Search outwards from target frame index
    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const left = index - offset
      const right = index + offset

      if (left >= 0 && imagesRef.current[left]) return left
      if (right < TOTAL_FRAMES && imagesRef.current[right]) return right
    }
    return -1
  }, [])

  // ── Draw frame at index, falling back to nearest loaded frame if not ready ──
  const drawFrame = useCallback((index, forceRedraw = false) => {
    const clampedIndex = Math.max(0, Math.min(index, TOTAL_FRAMES - 1))
    
    const targetIndex = getNearestLoadedFrame(clampedIndex)
    if (targetIndex < 0) return // No frames loaded at all yet

    // Performance Guard: Skip redundant draw calls if the active frame index hasn't changed
    if (!forceRedraw && targetIndex === lastDrawnIndexRef.current) return

    const img = imagesRef.current[targetIndex]

    if (img) {
      drawImageCovered(img)
      lastDrawnIndexRef.current = targetIndex
    }
  }, [drawImageCovered, getNearestLoadedFrame])

  // ── Canvas resize handler with Native High-DPI support ──
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
    if (lastDrawnIndexRef.current >= 0) {
      drawFrame(lastDrawnIndexRef.current, true)
    }
  }, [drawFrame])

  // ── Step 1: Mount canvas with native high-DPI resolution & studio gray fill ──
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr

    // Fill with studio gray — visible behind preloader, never shows as black
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#4a4e54'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

  // ── Step 2: Progressive Two-Phase Frame Preloading ──
  useEffect(() => {
    let cancelled = false

    // Partition frames: Even indices are Phase 1 (Critical), Odd indices are Phase 2 (Background)
    const criticalIndices = []
    const backgroundIndices = []

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      if (i % 2 === 0) {
        criticalIndices.push(i)
      } else {
        backgroundIndices.push(i)
      }
    }

    const CRITICAL_COUNT = criticalIndices.length
    let criticalLoaded = 0

    let criticalBatchIndex = 0
    const CRITICAL_BATCH_SIZE = 20

    // Load Phase 1 (Critical frames) batch-by-batch
    const loadCriticalBatch = () => {
      if (cancelled) return

      const batchEnd = Math.min(criticalBatchIndex + CRITICAL_BATCH_SIZE, CRITICAL_COUNT)
      let batchDone = 0
      const batchTotal = batchEnd - criticalBatchIndex

      if (batchTotal <= 0) {
        // Phase 1 finished! Fade out preloader and initiate background Phase 2
        if (!cancelled) {
          drawFrame(0)
          setPreloaderFading(true)
          setTimeout(() => {
            if (cancelled) return
            setPreloaderVisible(false)
            setIsReady(true)
            loadBackgroundFrames()
          }, 700)
        }
        return
      }

      for (let i = criticalBatchIndex; i < batchEnd; i++) {
        const idx = criticalIndices[i]
        const img = new Image()
        img.src = `/frames/frame_${String(idx * FRAME_STEP).padStart(4, '0')}.webp`

        img.onload = () => {
          if (cancelled) return
          imagesRef.current[idx] = img
          criticalLoaded += 1

          // Draw frame 0 immediately once it's loaded
          if (idx === 0 && lastDrawnIndexRef.current < 0) {
            drawFrame(0)
          }

          const progress = Math.min(100, Math.floor((criticalLoaded / CRITICAL_COUNT) * 100))
          setLoadProgress(progress)

          batchDone++
          if (batchDone === batchTotal) {
            criticalBatchIndex += CRITICAL_BATCH_SIZE
            setTimeout(loadCriticalBatch, 4)
          }
        }

        img.onerror = () => {
          if (cancelled) return
          criticalLoaded += 1
          batchDone++
          if (batchDone === batchTotal) {
            criticalBatchIndex += CRITICAL_BATCH_SIZE
            setTimeout(loadCriticalBatch, 4)
          }
        }
      }
    }

    // Load Phase 2 (High-Fidelity frames) silently in the background
    const loadBackgroundFrames = () => {
      if (cancelled) return

      let backgroundBatchIndex = 0
      const BACKGROUND_BATCH_SIZE = 10

      const loadNextBackgroundBatch = () => {
        if (cancelled) return

        const batchEnd = Math.min(backgroundBatchIndex + BACKGROUND_BATCH_SIZE, backgroundIndices.length)
        let batchDone = 0
        const batchTotal = batchEnd - backgroundBatchIndex

        if (batchTotal <= 0) return

        for (let i = backgroundBatchIndex; i < batchEnd; i++) {
          const idx = backgroundIndices[i]
          const img = new Image()
          img.src = `/frames/frame_${String(idx * FRAME_STEP).padStart(4, '0')}.webp`

          img.onload = () => {
            if (cancelled) return
            imagesRef.current[idx] = img
            batchDone++
            if (batchDone === batchTotal) {
              backgroundBatchIndex += BACKGROUND_BATCH_SIZE
              setTimeout(loadNextBackgroundBatch, 50) // Non-blocking delay to keep UI buttery-smooth
            }
          }

          img.onerror = () => {
            if (cancelled) return
            batchDone++
            if (batchDone === batchTotal) {
              backgroundBatchIndex += BACKGROUND_BATCH_SIZE
              setTimeout(loadNextBackgroundBatch, 50)
            }
          }
        }
      }

      loadNextBackgroundBatch()
    }

    // Start critical preloading phase
    loadCriticalBatch()

    return () => {
      cancelled = true
    }
  }, [drawFrame])

  // ── Step 3: Scroll → frame scrubbing (rAF-throttled, no-flicker) ──
  useEffect(() => {
    if (!isReady) return

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)

      rafRef.current = requestAnimationFrame(() => {
        const scrollTop = window.scrollY
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight
        if (maxScroll <= 0) return

        const fraction = Math.min(Math.max(scrollTop / maxScroll, 0), 1)
        const frameIndex = Math.floor(fraction * (TOTAL_FRAMES - 1))
        drawFrame(frameIndex)

        const progressPercent = fraction * 100
        setScrollProgress(progressPercent)

        // Set active section based on scroll progress percentage (6 total phases)
        let activeSec = 0
        if (progressPercent < 15) {
          activeSec = 0
        } else if (progressPercent < 35) {
          activeSec = 1
        } else if (progressPercent < 55) {
          activeSec = 2
        } else if (progressPercent < 72) {
          activeSec = 3
        } else if (progressPercent < 88) {
          activeSec = 4
        } else {
          activeSec = 5
        }
        setActiveSection(activeSec)
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    // Fire once initially to draw correctly if there's initial scroll
    onScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isReady, drawFrame])

  return (
    <div className="app-container">

      {/* ── Preloader Overlay ── */}
      {preloaderVisible && (
        <div className={`preloader-overlay ${preloaderFading ? 'fading' : ''}`}>
          <div className="preloader-content">
            <img 
              src="/Sreenika Security Solutions LOGO.png" 
              alt="Sreenika Security Solutions Logo" 
              className="preloader-logo" 
            />
            <div className="loader-percentage-text">{loadProgress}%</div>
            <div className="loader-progress-bar-container">
              <div 
                className="loader-progress-bar-fill" 
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── The 3D Scroll Canvas ── */}
      <canvas ref={canvasRef} className="scroll-canvas" />

      {/* ── Subtle dynamic cinematic film grain ── */}
      <div className="grain-overlay" />

      {/* ── Premium Editorial Vignette Overlay ── */}
      <div className="vignette-overlay" />

      {/* HUD Overlay removed per user request */}

      {/* ── Scrollable Content Sections ── */}
      <div className="scroll-content">
        {/* Section 0: Hero */}
        <section className={`scroll-section section-hero ${activeSection === 0 ? 'active' : ''}`}>
          <div className="container hero-container">
            <div className="hero-left">
              <img
                src="/Sreenika Security Solutions LOGO.png"
                alt="Sreenika Security Solutions"
                className="hero-logo"
              />
              <h1 className="hero-title">
                SREENIKA <span className="text-accent">SECURITY</span> SOLUTIONS
              </h1>
              <div className="hero-divider" />
              <p className="hero-desc">
                Empowering residential nodes, transit corridors, and corporate environments with premium, 
                end-to-end security architectures. Built on trust, maintained with absolute integrity since 2017.
              </p>
              <div className="hero-actions">
                <a href="#matrix-pillars" className="btn-liquid-glass btn-liquid-glass-primary">
                  <Shield size={14} /> Our Services
                </a>
                <a href="#control-console" className="btn-liquid-glass">
                  Performance Grid <ChevronRight size={14} />
                </a>
              </div>
            </div>
            
            <div className="hero-right">
              <div className="liquid-glass-card branch-panel">
                <div className="panel-header">
                  <span className="label-caps">OUR REGIONAL BRANCHES</span>
                </div>
                <div className="branch-row">
                  <span className="branch-name">Mancherial Common Hub</span>
                  <span className="branch-status"><span className="status-pip status-pip--active" /> Active</span>
                </div>
                <div className="branch-row">
                  <span className="branch-name">JNTU, Hyderabad Node</span>
                  <span className="branch-status"><span className="status-pip status-pip--active" /> Active</span>
                </div>
                <div className="branch-divider" />
                <p className="branch-ticker">
                  PROUDLY SERVING TELANGANA & ANDHRA PRADESH WITH SECURE AND DEPENDABLE REGIONAL TEAMS.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Services */}
        <section id="matrix-pillars" className={`scroll-section section-services ${activeSection === 1 ? 'active' : ''}`}>
          <div className="container">
            <div className="section-head">
              <span className="label-caps text-accent">TACTICAL CORE PORTFOLIO</span>
              <h2>Specialized Security Services</h2>
              <p>We install, configure, and maintain seven professional-grade security structures designed for absolute safety.</p>
            </div>
            
            <div className="services-grid">
              {sssServices.map((service, index) => {
                const Icon = service.icon
                return (
                  <div key={index} className="liquid-glass-card service-card">
                    <div className="service-header">
                      <span className="service-tag">{service.tag}</span>
                      <span className="service-status">// ACTIVE</span>
                    </div>
                    <div className="service-icon-wrapper">
                      <Icon size={24} />
                    </div>
                    <h3 className="service-title">{service.title}</h3>
                    <p className="service-desc">{service.desc}</p>
                    <div className="service-footer">
                      <span className="status-pip status-pip--active" />
                      <span className="service-net-tag">SECURE_NET</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Section 2: About Us */}
        <section className={`scroll-section section-about ${activeSection === 2 ? 'active' : ''}`}>
          <div className="container">
            <div className="about-layout">
              <div className="about-left">
                <span className="label-caps text-accent">ABOUT SREENIKA</span>
                <h2>Dependable Security,<br />Innovative Solutions</h2>
                <div className="about-divider" />
                <p>
                  Founded in 2017, Sreenika Security Solutions has spent over 8 years building a reputation 
                  for trust, quality, and reliability across Telangana and Andhra Pradesh. We serve both 
                  public institutions—highways, government offices, municipalities, and schools—and private 
                  enterprises including corporate offices, residential properties, and commercial businesses.
                </p>
                <p>
                  Our mission is to provide dependable, innovative, and affordable security solutions that protect 
                  people, properties, and businesses with the latest technology. With branch offices in Mancherial 
                  and JNTU, Hyderabad, we ensure rapid response and personalized service across every district.
                </p>
              </div>
              
              <div className="about-right">
                <div className="liquid-glass-card why-card">
                  <div className="why-header">
                    <span className="label-caps">Why Choose SSS</span>
                  </div>
                  <ul className="why-list">
                    <li>
                      <Shield size={16} className="text-accent" />
                      <span><strong>8 Years</strong> proven track record in govt & private sectors</span>
                    </li>
                    <li>
                      <Wrench size={16} className="text-accent" />
                      <span><strong>Certified Team</strong> of experienced professionals</span>
                    </li>
                    <li>
                      <Shield size={16} className="text-accent" />
                      <span><strong>2-Year Warranty</strong> with emergency support</span>
                    </li>
                    <li>
                      <Wrench size={16} className="text-accent" />
                      <span><strong>Quick Installation</strong> and timely maintenance</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Section 3: Founder */}
        <section className={`scroll-section section-founder ${activeSection === 3 ? 'active' : ''}`}>
          <div className="container">
            <div className="founder-layout">
              <div className="liquid-glass-card founder-card">
                <div className="founder-image-wrapper">
                  <img 
                    src="/founder.png" 
                    alt="Ranadheer Nagula" 
                    className="founder-img" 
                  />
                  <div className="founder-image-overlay" />
                </div>
                <div className="founder-info">
                  <span className="label-caps text-accent">// FOUNDER</span>
                  <h2 className="founder-name">Ranadheer Nagula</h2>
                  <div className="founder-divider" />
                  <span className="founder-status-tag">SREENIKA LEADERSHIP</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Performance Console / Stats */}
        <section id="control-console" className={`scroll-section section-stats ${activeSection === 4 ? 'active' : ''}`}>
          <div className="container">
            <div className="liquid-glass-card console-card">
              <div className="console-header">
                <div className="console-title">
                  <Activity className="text-accent blinking-pip" size={16} />
                  <span>SSS CORPORATE PERFORMANCE GRID</span>
                </div>
              </div>
              <div className="console-body">
                <div className="stats-grid">
                  {stats.map((stat, idx) => (
                    <div 
                      key={idx} 
                      className={`liquid-glass-card stat-panel ${hoveredValue === idx ? 'highlighted' : ''}`}
                      onMouseEnter={() => setHoveredValue(idx)}
                      onMouseLeave={() => setHoveredValue(null)}
                    >
                      <span className="stat-num">{stat.value}</span>
                      <span className="stat-label">{stat.label}</span>
                      <div className="stat-decorations">
                        <span /><span /><span /><span />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Partners, CTA & Footer */}
        <section className={`scroll-section section-partners-cta-footer ${activeSection === 5 ? 'active' : ''}`}>
          <div className="container">
            <div className="partners-block">
              <span className="label-caps text-accent">COOPERATIVE ECOSYSTEMS</span>
              <h2>State-Grade Hardware Partners</h2>
              <p>Our security structures are deployed in integration with world-class hardware technology leaders.</p>
              
              <div className="brands-slider">
                <div className="brands-slider-track">
                  {[...partnerBrands, ...partnerBrands].map((brand, i) => (
                    <div key={i} className="brand-slide-item">
                      <img src={brand.logo} alt={brand.name} className="brand-logo-img" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="cta-block">
              <span className="label-caps text-accent">READY TO FORTIFY?</span>
              <h2>Connect With Us Today</h2>
              <p>
                Consult our dedicated local design teams directly through WhatsApp or explore our premium updates on Instagram.
                Secure your space with platinum-grade protection.
              </p>
              
              <div className="cta-buttons">
                <a 
                  href="https://wa.me/917780177002?text=Hi%20I%20am%20interested%20in%20your%20services" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-liquid-glass btn-liquid-glass-primary btn-cta"
                >
                  <MessageSquare size={16} /> WhatsApp Direct Chassis
                </a>
                <a 
                  href="https://insta.openinapp.co/mgg8v" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-liquid-glass btn-cta"
                >
                  <Instagram size={16} /> Instagram Network Portal
                </a>
              </div>
            </div>

            <footer className="footer-block">
              <div className="footer-inner">
                <div className="footer-left">
                  <img src="/Sreenika Security Solutions LOGO.png" alt="SSS Logo" className="footer-logo-img" />
                  <p>Protecting commercial nodes, gated perimeters, and critical infrastructures across Telangana & Andhra Pradesh since 2017.</p>
                </div>
              </div>
              <div className="footer-bottom">
                <span>© {new Date().getFullYear()} SREENIKA SECURITY SOLUTIONS. PLATINUM SECURITY COMPLIANT //</span>
              </div>
            </footer>
          </div>
        </section>
      </div>

    </div>
  )
}


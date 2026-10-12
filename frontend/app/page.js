'use client';

import { useState } from 'react';
import PublicNav from '@/components/PublicNav';
import Link from 'next/link';
import { 
  CheckSquare, 
  TrendingUp, 
  Brain, 
  ShieldAlert, 
  Layers, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Sliders,
  DollarSign,
  Users,
  Clock,
  ChevronRight
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('kanban');

  return (
    <div style={{ background: 'var(--bg-app)', minHeight: '100vh', overflowX: 'hidden' }}>
      <PublicNav />
      
      {/* Notion Hero Section */}
      <section style={{
        padding: '130px 1.5rem 60px',
        maxWidth: '1040px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        {/* Subtle pill badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.3rem 0.75rem',
          background: 'var(--bg-surface)',
          color: 'var(--text-main)',
          borderRadius: '999px',
          fontSize: '0.8rem',
          fontWeight: 500,
          marginBottom: '2rem',
          border: '1px solid var(--border)'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }}></span>
          <span>New in Beacon 2.0: Real-time runway forecasting</span>
          <ChevronRight size={12} color="var(--text-muted)" />
        </div>
        
        {/* Editorial Notion Title */}
        <h1 style={{
          fontSize: 'clamp(2.75rem, 6.5vw, 4.75rem)',
          fontWeight: 800,
          lineHeight: '1.08',
          letterSpacing: '-0.035em',
          margin: '0 auto 1.5rem',
          maxWidth: '880px',
          color: 'var(--text-main)'
        }}>
          The all-in-one workspace for startup execution.
        </h1>
        
        {/* Human Sub-Headline */}
        <p style={{
          fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
          color: 'var(--text-muted)',
          maxWidth: '680px',
          margin: '0 auto 2.5rem',
          lineHeight: '1.55',
          fontWeight: 400
        }}>
          Write, plan, and organize — across live financials, task boards, runway models, and executive intelligence.
        </p>
        
        {/* Notion Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
          <Link href="/signup" className="btn-primary" style={{
            textDecoration: 'none',
            padding: '0.65rem 1.4rem',
            fontSize: '0.95rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <span>Get Beacon free</span>
            <ArrowRight size={15} />
          </Link>
          <Link href="/about" className="btn-secondary" style={{
            textDecoration: 'none',
            padding: '0.65rem 1.4rem',
            fontSize: '0.95rem',
            fontWeight: 500
          }}>
            Explore manifesto
          </Link>
        </div>

        {/* Interactive Notion Workspace Demo Showcase */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
          overflow: 'hidden',
          textAlign: 'left'
        }}>
          {/* Top Window Chrome */}
          <div style={{
            padding: '0.75rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', opacity: 0.8 }}></div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', opacity: 0.8 }}></div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', opacity: 0.8 }}></div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 500 }}>
                Acme Workspace • Executive View
              </span>
            </div>
            
            {/* Notion Database View Tabs */}
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button 
                onClick={() => setActiveTab('kanban')}
                style={{
                  background: activeTab === 'kanban' ? 'var(--bg-card)' : 'transparent',
                  border: activeTab === 'kanban' ? '1px solid var(--border)' : '1px solid transparent',
                  padding: '0.25rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: activeTab === 'kanban' ? 600 : 500,
                  color: activeTab === 'kanban' ? 'var(--text-main)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                Board Tasks
              </button>
              <button 
                onClick={() => setActiveTab('runway')}
                style={{
                  background: activeTab === 'runway' ? 'var(--bg-card)' : 'transparent',
                  border: activeTab === 'runway' ? '1px solid var(--border)' : '1px solid transparent',
                  padding: '0.25rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: activeTab === 'runway' ? 600 : 500,
                  color: activeTab === 'runway' ? 'var(--text-main)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                Runway Lab
              </button>
              <button 
                onClick={() => setActiveTab('decisions')}
                style={{
                  background: activeTab === 'decisions' ? 'var(--bg-card)' : 'transparent',
                  border: activeTab === 'decisions' ? '1px solid var(--border)' : '1px solid transparent',
                  padding: '0.25rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: activeTab === 'decisions' ? 600 : 500,
                  color: activeTab === 'decisions' ? 'var(--text-main)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                Decisions Log
              </button>
            </div>
          </div>

          {/* Page Canvas */}
          <div style={{ padding: '1.75rem 2rem' }}>
            {/* Page Header */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.8rem' }}>⚡</span>
                <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>Acme Corp Series A Command Deck</h2>
              </div>
              
              {/* Notion Page Properties List */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', padding: '0.85rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.84rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.74rem' }}>Liquid Runway</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>18.4 Months</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.74rem' }}>Monthly Burn</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>$45,000 / mo</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.74rem' }}>Cash in Bank</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>$220,000</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.74rem' }}>Execution Velocity</span>
                  <span className="badge-priority normal">Optimal (94%)</span>
                </div>
              </div>
            </div>

            {/* Dynamic View Mockup */}
            {activeTab === 'kanban' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {/* Column 1: To Do */}
                <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ background: 'var(--tag-gray-bg)', color: 'var(--tag-gray-text)', padding: '0.15rem 0.5rem', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 600 }}>To Do</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>2</span>
                  </div>
                  <div className="task-item-card">
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.35rem' }}>Finalize Stripe billing webhooks</div>
                    <span className="badge-priority high">High</span>
                  </div>
                  <div className="task-item-card">
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.35rem' }}>Draft Q3 investor board memo</div>
                    <span className="badge-priority normal">Normal</span>
                  </div>
                </div>

                {/* Column 2: In Progress */}
                <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ background: 'var(--tag-blue-bg)', color: 'var(--tag-blue-text)', padding: '0.15rem 0.5rem', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 600 }}>In Progress</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>1</span>
                  </div>
                  <div className="task-item-card">
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.35rem' }}>Audit AWS database read replica lag</div>
                    <span className="badge-priority urgent">Urgent</span>
                  </div>
                </div>

                {/* Column 3: Done */}
                <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ background: 'var(--tag-green-bg)', color: 'var(--tag-green-text)', padding: '0.15rem 0.5rem', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 600 }}>Done</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>2</span>
                  </div>
                  <div className="task-item-card">
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.35rem' }}>Hire Senior Founding Engineer</div>
                    <span className="badge-priority normal">Complete</span>
                  </div>
                  <div className="task-item-card">
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.35rem' }}>Close $250k Angel Safe note</div>
                    <span className="badge-priority normal">Complete</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'runway' && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Runway Forecast Projection</span>
                  <span className="badge-priority normal">Horizon: Dec 2027</span>
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  18.4 <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>months liquid</span>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                  Based on current $45k burn rate with $220k liquid capital pool. Zero-cash point scheduled for Q4 next year.
                </p>
              </div>
            )}

            {activeTab === 'decisions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div className="task-item-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Pivot pricing from per-seat to usage-based</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidence: 85% • Evaluated Outcome: Success</div>
                  </div>
                  <span className="badge-priority normal">Evaluated</span>
                </div>
                <div className="task-item-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Migrate production stack to Next.js Turbopack</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidence: 90% • Evaluated Outcome: Success</div>
                  </div>
                  <span className="badge-priority normal">Evaluated</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Social Proof Logos */}
      <section style={{
        padding: '30px 1.5rem 60px',
        maxWidth: '1000px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <p style={{
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600,
          marginBottom: '1.5rem'
        }}>
          Trusted by technical founders building the future
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '3rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          opacity: 0.6,
          fontSize: '1rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--text-main)'
        }}>
          <span>Linear</span>
          <span>Figma</span>
          <span>Vercel</span>
          <span>Ramp</span>
          <span>Cursor</span>
          <span>Stripe</span>
        </div>
      </section>

      {/* Bento Grid (Notion Feature Modular Blocks) */}
      <section id="features" style={{
        padding: '60px 1.5rem 90px',
        maxWidth: '1040px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 0.5rem' }}>
            Everything you need. Zero coordination noise.
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', margin: 0 }}>
            Four integrated pillars built specifically for high-velocity startup teams.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* Card 1 */}
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--tag-blue-bg)', color: 'var(--tag-blue-text)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <CheckSquare size={20} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Kanban & Task Engine</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.55', margin: 0 }}>
              Optimistic updates with background WebSocket sync. Threaded task discussions, priority filters, and zero lag.
            </p>
          </div>

          {/* Card 2 */}
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--tag-yellow-bg)', color: 'var(--tag-yellow-text)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Sliders size={20} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Runway Scenario Lab</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.55', margin: 0 }}>
              Dynamic financial modeling. Test hiring sprees, capital injections, and burn cuts with instant zero-cash forecasting.
            </p>
          </div>

          {/* Card 3 */}
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--tag-green-bg)', color: 'var(--tag-green-text)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Brain size={20} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Executive Co-Pilot</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.55', margin: 0 }}>
              An advisor wired into live startup telemetry. Generates morning briefs, identifies bottlenecks, and analyzes risk.
            </p>
          </div>

          {/* Card 4 */}
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--tag-gray-bg)', color: 'var(--tag-gray-text)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <ShieldAlert size={20} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Decision Governance</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.55', margin: 0 }}>
              Permanent governance ledger tracking outcomes, confidence metrics, and post-mortem learning loops.
            </p>
          </div>
        </div>
      </section>

      {/* Notion Callout Quote Section */}
      <section style={{
        padding: '0 1.5rem 80px',
        maxWidth: '860px',
        margin: '0 auto'
      }}>
        <div className="notion-callout" style={{ padding: '1.75rem 2rem', alignItems: 'center' }}>
          <span style={{ fontSize: '2rem' }}>💬</span>
          <div>
            <p style={{ fontSize: '1.05rem', fontStyle: 'italic', margin: '0 0 0.5rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
              "Beacon gave our leadership team clarity. We collapsed four separate tools — Jira, Pitch, spreadsheets, and Slack update threads — into a single source of truth."
            </p>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              — Sarah Chen, Co-Founder & CTO @ Nexus Systems
            </span>
          </div>
        </div>
      </section>

      {/* Notion Final CTA */}
      <section style={{
        padding: '80px 1.5rem',
        textAlign: 'center',
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border)'
      }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 1rem', letterSpacing: '-0.03em' }}>
          Build your company without the chaos.
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', margin: '0 auto 2rem', maxWidth: '500px' }}>
          Get started in seconds. No complex setups or credit card required.
        </p>
        <Link href="/signup" className="btn-primary" style={{
          textDecoration: 'none',
          padding: '0.75rem 2rem',
          fontSize: '0.95rem',
          fontWeight: 500
        }}>
          Get Beacon free →
        </Link>
      </section>

      {/* Notion Footer */}
      <footer style={{
        padding: '2.5rem 1.5rem',
        borderTop: '1px solid var(--border)',
        color: 'var(--text-muted)',
        fontSize: '0.82rem',
        textAlign: 'center',
        background: 'var(--bg-app)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem' }}>
          <Link href="/about" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Manifesto</Link>
          <Link href="/contact" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Contact</Link>
          <Link href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</Link>
          <Link href="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</Link>
        </div>
        <div>© 2026 Beacon OS Inc. All rights reserved.</div>
      </footer>
    </div>
  );
}

import PublicNav from '@/components/PublicNav';
import Link from 'next/link';
import { Zap, Bot, TrendingUp, Shield, Target, Users } from 'lucide-react';

export default function Home() {
  return (
    <div style={{ background: 'var(--bg-app)', minHeight: '100vh', overflowX: 'hidden' }}>
      <PublicNav />
      
      {/* Hero Section */}
      <section style={{
        padding: '200px 2rem 100px',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.6rem 1.25rem',
          background: 'rgba(99, 102, 241, 0.05)',
          color: 'var(--accent)',
          borderRadius: '50px',
          fontSize: '0.8rem',
          fontWeight: '700',
          marginBottom: '3rem',
          border: '1px solid rgba(99, 102, 241, 0.15)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)' }}></span>
          Engineered for the 1%
        </div>
        
        <h1 style={{
          fontSize: 'clamp(3rem, 12vw, 6rem)',
          fontWeight: '900',
          lineHeight: '0.95',
          marginBottom: '2rem',
          letterSpacing: '-0.05em'
        }}>
          BUILD THE <br />
          <span style={{ 
            background: 'linear-gradient(to right, var(--accent), var(--accent-funky))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 10px 20px rgba(99, 102, 241, 0.2))'
          }}>IMPOSSIBLE.</span>
        </h1>
        
        <p style={{
          fontSize: '1.25rem',
          color: 'var(--text-muted)',
          maxWidth: '600px',
          margin: '0 auto 4rem',
          lineHeight: '1.5',
          fontWeight: '500'
        }}>
          Beacon is the high-fidelity OS for elite founders. 
          Collapse your stack. Move with speed. Win.
        </p>
        
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
          <Link href="/signup" className="btn-primary" style={{
            textDecoration: 'none',
            padding: '1.2rem 2.5rem',
            fontSize: '1.1rem'
          }}>
            Deploy Workspace
          </Link>
          <Link href="/about" style={{
            textDecoration: 'none',
            padding: '1.2rem 2.5rem',
            fontSize: '1.1rem',
            color: 'var(--text-main)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '50px',
            fontWeight: '700'
          }}>
            Vision
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{
        padding: '100px 2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
          <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.04em' }}>THE ECOSYSTEM.</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>Everything you need to scale, collapsed into one high-fidelity view.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '2rem'
        }}>
          {/* Feature 1 */}
          <div className="glass-card" style={{ padding: '3rem' }}>
            <div style={{ background: 'var(--accent)', width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '2rem', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)' }}>
              <Zap size={24} />
            </div>
            <h3 style={{ fontSize: '1.75rem', marginBottom: '1.25rem', fontWeight: 800 }}>High-Fidelity Tasking</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', fontSize: '1.05rem' }}>
              Forget basic lists. Our task engine features integrated discussion threads, status-glow tracking, and glassmorphic card density designed for maximum visibility.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-card" style={{ padding: '3rem', background: 'rgba(99, 102, 241, 0.04)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
            <div style={{ background: 'var(--accent-funky)', width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '2rem', boxShadow: '0 10px 20px rgba(236, 72, 153, 0.3)' }}>
              <Bot size={24} />
            </div>
            <h3 style={{ fontSize: '1.75rem', marginBottom: '1.25rem', fontWeight: 800 }}>Live AI Context</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', fontSize: '1.05rem' }}>
              Your AI Co-founder isn't a chatbot. It's a synthetic partner plugged into your live financials, team roster, and task backlog to provide actionable morning briefs.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-card" style={{ padding: '3rem' }}>
            <div style={{ background: 'var(--success)', width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '2rem', boxShadow: '0 10px 20px rgba(34, 197, 94, 0.3)' }}>
              <TrendingUp size={24} />
            </div>
            <h3 style={{ fontSize: '1.75rem', marginBottom: '1.25rem', fontWeight: 800 }}>Unified Channels</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', fontSize: '1.05rem' }}>
              We've grouped your startup's core into Navigation, Channels, and Startup OS. Move seamlessly between engineering, financials, and team management in one click.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="glass-card" style={{ padding: '3rem' }}>
            <div style={{ background: 'var(--accent)', width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '2rem' }}>
              <Shield size={24} />
            </div>
            <h3 style={{ fontSize: '1.75rem', marginBottom: '1.25rem', fontWeight: 800 }}>Foundational Security</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', fontSize: '1.05rem' }}>
              Built on a Cyber-Foundry architecture, Beacon ensures your startup's internal data is encrypted and isolated, providing enterprise-grade peace of mind.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="glass-card" style={{ padding: '3rem' }}>
            <div style={{ background: 'var(--accent-funky)', width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '2rem' }}>
              <Target size={24} />
            </div>
            <h3 style={{ fontSize: '1.75rem', marginBottom: '1.25rem', fontWeight: 800 }}>Execution Velocity</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', fontSize: '1.05rem' }}>
              Track your team's real-time velocity. See exactly where the bottlenecks are and get AI-driven suggestions to clear the path for your next launch.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="glass-card" style={{ padding: '3rem' }}>
            <div style={{ background: 'var(--success)', width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '2rem' }}>
              <Users size={24} />
            </div>
            <h3 style={{ fontSize: '1.75rem', marginBottom: '1.25rem', fontWeight: 800 }}>Adaptive Onboarding</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', fontSize: '1.05rem' }}>
              Automate the grunt work. From hiring docs to task provisioning, our OS handles the lifecycle of every team member so you can stay focused on the vision.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '150px 2rem',
        textAlign: 'center',
        background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.1) 0%, transparent 70%)'
      }}>
        <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '2rem' }}>STOP JUGGLING.<br />START BUILDING.</h2>
        <Link href="/signup" className="btn-primary" style={{
          textDecoration: 'none',
          padding: '1.2rem 4rem',
          fontSize: '1.2rem'
        }}>
          Get Early Access Now
        </Link>
      </section>

      <footer style={{
        padding: '4rem 2rem',
        borderTop: '1px solid var(--border)',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        textAlign: 'center',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.1em'
      }}>
        © 2024 BEACON OS. THE FUTURE IS MINIMAL.
      </footer>
    </div>
  );
}

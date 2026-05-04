import PublicNav from '@/components/PublicNav';
import { Rocket, Shield, Zap, Target, Users, CheckCircle } from 'lucide-react';

export default function About() {
  return (
    <div style={{ background: 'var(--bg-app)', minHeight: '100vh', overflowX: 'hidden' }}>
      <PublicNav />
      
      {/* Hero Narrative */}
      <section style={{
        padding: '200px 2rem 100px',
        maxWidth: '1000px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div className="animate-fade">
          <h1 style={{ 
            fontSize: 'clamp(3rem, 10vw, 5rem)', 
            fontWeight: '900', 
            marginBottom: '2rem',
            letterSpacing: '-0.05em',
            lineHeight: 0.95
          }}>
            THE <br />
            <span style={{ 
              background: 'linear-gradient(to right, var(--accent), var(--accent-funky))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>MANIFESTO.</span>
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            lineHeight: '1.6', 
            color: 'var(--text-muted)', 
            maxWidth: '700px', 
            margin: '0 auto 4rem',
            fontWeight: '500'
          }}>
            Startups don't die because of bad ideas. They die because of <strong>coordination chaos</strong>. 
            We built Beacon to kill the noise and give founders their focus back.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          textAlign: 'left'
        }}>
          <div className="glass-card animate-fade" style={{ animationDelay: '0.1s' }}>
            <div style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}><Rocket size={32} /></div>
            <h3 style={{ marginBottom: '1rem', fontWeight: 800 }}>Velocity First</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>We believe speed is the only competitive advantage. Beacon is engineered to remove every millisecond of friction from your workflow.</p>
          </div>
          <div className="glass-card animate-fade" style={{ animationDelay: '0.2s' }}>
            <div style={{ color: 'var(--accent-funky)', marginBottom: '1.5rem' }}><Shield size={32} /></div>
            <h3 style={{ marginBottom: '1rem', fontWeight: 800 }}>Truth Centralization</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>No more "Where is that document?" Your capital, tasks, and knowledge live in a single, unshakeable source of truth.</p>
          </div>
          <div className="glass-card animate-fade" style={{ animationDelay: '0.3s' }}>
            <div style={{ color: 'var(--success)', marginBottom: '1.5rem' }}><Zap size={32} /></div>
            <h3 style={{ marginBottom: '1rem', fontWeight: 800 }}>AI Synergy</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>AI shouldn't just generate text; it should understand your company. Beacon's AI partner is plugged directly into your live metrics.</p>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section style={{
        padding: '100px 2rem',
        background: 'rgba(255, 255, 255, 0.02)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '2rem' }}>The Central Nervous System</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.8 }}>
            <p>
              Beacon was built as the "Main Character" of your workspace. Most tools are passive repositories of data. Beacon is active. It watches your burn, tracks your task velocity, and alerts you before you hit a wall.
            </p>
            <p>
              We integrated everything—Chat, Tasks, HR, and Finance—because context switching is the silent killer of innovation. When you discuss a task in Beacon, you're doing it in the same place your runway is calculated.
            </p>
          </div>
          
          <div style={{ marginTop: '4rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <CheckCircle color="var(--success)" size={24} />
              <span style={{ fontWeight: 600 }}>Zero Context Switching</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <CheckCircle color="var(--success)" size={24} />
              <span style={{ fontWeight: 600 }}>Predictive Burn Analysis</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <CheckCircle color="var(--success)" size={24} />
              <span style={{ fontWeight: 600 }}>Instant Team Provisioning</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <CheckCircle color="var(--success)" size={24} />
              <span style={{ fontWeight: 600 }}>Encrypted Knowledge Base</span>
            </div>
          </div>
        </div>
      </section>

      {/* Team / Mission */}
      <section style={{ padding: '100px 2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: '3rem' }}>Our North Star</h2>
        <div style={{ 
          fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', 
          fontWeight: 800, 
          maxWidth: '800px', 
          margin: '0 auto',
          lineHeight: 1.3
        }}>
          "TO GIVE FOUNDERS BACK THEIR TIME BY PUTTING ORGANIZATIONAL MEMORY ON AUTOPILOT."
        </div>
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
        © 2024 BEACON OS. THE MISSION IS CLEAR.
      </footer>
    </div>
  );
}

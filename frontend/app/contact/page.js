import PublicNav from '@/components/PublicNav';
import { Mail, MessageCircle, MessageSquare, Globe, ArrowRight } from 'lucide-react';

export default function Contact() {
  return (
    <div style={{ background: 'var(--bg-app)', minHeight: '100vh', overflowX: 'hidden' }}>
      <PublicNav />
      
      <section style={{
        padding: '200px 2rem 100px',
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '4rem',
        alignItems: 'start'
      }}>
        {/* Left Side: Info */}
        <div className="animate-fade">
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 6vw, 4rem)', 
            fontWeight: '900', 
            marginBottom: '1.5rem',
            letterSpacing: '-0.04em',
            lineHeight: 0.9
          }}>
            LET'S <br />
            <span style={{ 
              background: 'linear-gradient(to right, var(--accent), var(--accent-funky))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>SYNC UP.</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '3rem', lineHeight: 1.6, maxWidth: '400px' }}>
            Whether you're scaling to Series A or just starting your journey, we're here to help you move faster.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <Mail size={20} color="var(--accent)" />
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email us</div>
                <a href="mailto:hello@trybeacon.com" style={{ color: 'white', textDecoration: 'none', fontWeight: 600 }}>hello@trybeacon.com</a>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <MessageCircle size={20} color="var(--accent)" />
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Social</div>
                <a href="#" style={{ color: 'white', textDecoration: 'none', fontWeight: 600 }}>@BeaconOS</a>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <Globe size={20} color="var(--accent)" />
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>HQ</div>
                <div style={{ color: 'white', fontWeight: 600 }}>San Francisco, CA</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="glass-card animate-fade" style={{ animationDelay: '0.2s' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', fontWeight: 800 }}>Send a message</h2>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" placeholder="John Founder" />
            </div>
            <div className="form-group">
              <label>Work Email</label>
              <input type="email" placeholder="john@startup.com" />
            </div>
            <div className="form-group">
              <label>Startup Vision</label>
              <textarea 
                style={{ 
                  width: '100%', 
                  background: 'rgba(0, 0, 0, 0.3)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '16px', 
                  padding: '1rem', 
                  color: 'white', 
                  minHeight: '120px',
                  outline: 'none',
                  fontSize: '1rem'
                }} 
                placeholder="Tell us what you're building..."
              ></textarea>
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '1.2rem', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              Submit Inquiry <ArrowRight size={18} />
            </button>
          </form>
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
        © 2024 BEACON OS. READY FOR TAKEOFF.
      </footer>
    </div>
  );
}

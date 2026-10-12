import PublicNav from '@/components/PublicNav';
import { Mail, MessageCircle, MessageSquare, Globe, ArrowRight } from 'lucide-react';

export default function Contact() {
  return (
    <div style={{ background: 'var(--bg-app)', minHeight: '100vh', overflowX: 'hidden' }}>
      <PublicNav />
      
      <section style={{
        padding: '100px 2rem 60px',
        maxWidth: '1080px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '3.5rem',
        alignItems: 'start'
      }}>
        {/* Left Side: Info */}
        <div className="animate-fade">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            <span>✉️</span>
            <span>Get In Touch</span>
          </div>
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 6vw, 3.75rem)', 
            fontWeight: 800, 
            marginBottom: '1.25rem',
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            color: 'var(--text-main)'
          }}>
            We'd love to hear <br />
            from your team.
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', marginBottom: '2.5rem', lineHeight: 1.6, maxWidth: '440px' }}>
            Whether you are scaling rapidly or just architecting your pre-seed setup, we are here to support your execution.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ background: 'var(--bg-surface)', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <Mail size={18} color="var(--text-main)" />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</div>
                <a href="mailto:hello@trybeacon.com" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>hello@trybeacon.com</a>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ background: 'var(--bg-surface)', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <MessageCircle size={18} color="var(--text-main)" />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Social</div>
                <a href="#" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>@BeaconWorkspace</a>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ background: 'var(--bg-surface)', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <Globe size={18} color="var(--text-main)" />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>HQ</div>
                <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem' }}>San Francisco, CA</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="card animate-fade" style={{ animationDelay: '0.2s', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '1.5rem', fontWeight: 800 }}>Send a message</h2>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" placeholder="Jane Founder" />
            </div>
            <div className="form-group">
              <label>Work Email</label>
              <input type="email" placeholder="jane@company.com" />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea 
                style={{ 
                  width: '100%', 
                  background: 'var(--bg-app)', 
                  border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius-sm)', 
                  padding: '0.85rem', 
                  color: 'var(--text-main)', 
                  minHeight: '120px',
                  outline: 'none',
                  fontSize: '0.95rem'
                }} 
                placeholder="Tell us what you're building..."
              ></textarea>
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '0.85rem', fontSize: '0.95rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
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

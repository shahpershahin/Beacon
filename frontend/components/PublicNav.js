"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function PublicNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <nav style={{
      position: 'fixed',
      top: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(1200px, 90%)',
      height: '70px',
      background: 'var(--bg-card)',
      backdropFilter: 'var(--glass)',
      border: '1px solid var(--border)',
      borderRadius: '50px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      zIndex: 1000,
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
    }}>
      <Link href="/" style={{
        fontSize: '1.25rem',
        fontWeight: '900',
        color: 'var(--text-main)',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        letterSpacing: '-0.03em'
      }}>
        <div style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>⚡</div>
        BEACON
      </Link>

      {/* Desktop Links */}
      <div style={{ display: 'none', gap: '2.5rem', alignItems: 'center', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }} className="desktop-nav">
        <Link href="/#features" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Features</Link>
        <Link href="/about" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>About</Link>
        <Link href="/contact" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</Link>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center' }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}
        <Link href="/login" style={{ display: 'none', color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600' }} className="desktop-nav">Sign In</Link>
        <Link href="/signup" className="btn-primary" style={{ textDecoration: 'none', padding: '0.75rem 1.5rem', fontSize: '0.85rem' }}>Join the waitlist</Link>
        <button onClick={() => setIsOpen(!isOpen)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'none' }} className="mobile-toggle">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
}

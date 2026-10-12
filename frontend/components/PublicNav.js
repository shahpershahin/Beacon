"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Sun, Moon, ArrowRight } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function PublicNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '56px',
      background: 'var(--bg-app)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      zIndex: 1000,
      backdropFilter: 'blur(10px)'
    }}>
      {/* Notion Sticker Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link href="/" style={{
          fontSize: '1.05rem',
          fontWeight: 700,
          color: 'var(--text-main)',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          letterSpacing: '-0.02em'
        }}>
          <div style={{
            width: '26px',
            height: '26px',
            background: 'var(--text-main)',
            color: 'var(--bg-app)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem',
            fontWeight: 800
          }}>
            B
          </div>
          <span>Beacon</span>
        </Link>

        {/* Desktop Links */}
        <div style={{ display: 'none', gap: '1.5rem', alignItems: 'center' }} className="desktop-nav">
          <Link href="/#features" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.86rem', fontWeight: 500, transition: 'color 0.15s ease' }}>Product</Link>
          <Link href="/#solutions" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.86rem', fontWeight: 500, transition: 'color 0.15s ease' }}>Solutions</Link>
          <Link href="/about" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.86rem', fontWeight: 500, transition: 'color 0.15s ease' }}>Manifesto</Link>
          <Link href="/contact" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.86rem', fontWeight: 500, transition: 'color 0.15s ease' }}>Contact</Link>
        </div>
      </div>

      {/* Right Action Stack */}
      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.35rem', display: 'flex', alignItems: 'center', borderRadius: '4px' }}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        )}
        <Link href="/login" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.86rem', fontWeight: 500, padding: '0.35rem 0.6rem' }} className="desktop-nav">
          Log in
        </Link>
        <Link href="/signup" className="btn-primary" style={{ textDecoration: 'none', padding: '0.4rem 0.85rem', fontSize: '0.84rem', fontWeight: 500 }}>
          Get Beacon free
        </Link>
        <button onClick={() => setIsOpen(!isOpen)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'none', padding: '0.25rem' }} className="mobile-toggle">
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '56px',
          left: 0,
          right: 0,
          background: 'var(--bg-app)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.25rem',
          gap: '1rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}>
          <Link href="/#features" onClick={() => setIsOpen(false)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500 }}>Product</Link>
          <Link href="/about" onClick={() => setIsOpen(false)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500 }}>Manifesto</Link>
          <Link href="/contact" onClick={() => setIsOpen(false)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500 }}>Contact</Link>
          <Link href="/login" onClick={() => setIsOpen(false)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500 }}>Log in</Link>
        </div>
      )}
    </nav>
  );
}

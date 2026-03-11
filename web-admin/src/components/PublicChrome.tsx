import { useState } from "react";
import { Link } from "react-router-dom";

const TELEGRAM_COMMUNITY_URL = "https://t.me/+og5pFf-HLqllMmVl";

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="public-strip">
      <div className="public-strip-inner">
        <Link className="public-strip-logo" to="/">
          BloodPoint
        </Link>
        <button
          type="button"
          className="public-menu-toggle"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          মেনু
        </button>
        <nav className={`public-strip-links${mobileMenuOpen ? " open" : ""}`}>
          <a
            href={TELEGRAM_COMMUNITY_URL}
            target="_blank"
            rel="noreferrer"
          >
            কমিউনিটি
          </a>
          <Link to="/blogs">ব্লগ</Link>
          <Link to="/stories">স্টোরি</Link>
          <Link to="/submit-content">সাবমিট</Link>
          <Link to="/admin">এডমিন</Link>
          <Link to="/privacy-policy">প্রাইভেসি</Link>
          <Link to="/terms">শর্তাবলী</Link>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="landing-footer">
      <div>BloodPoint &copy; {year}</div>
      <div className="landing-footer-links">
        <Link to="/privacy-policy">প্রাইভেসি</Link>
        <Link to="/terms">শর্তাবলী</Link>
        <a href="https://github.com/imShakil/bloodbank" target="_blank" rel="noreferrer">গিটহাব</a>
      </div>
    </footer>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <section className="footer">
      <div className="main-container">
        <div className="footer-content">
          <div className="footer-top">
            <div className="footer-top-left">
              <div className="heading---h3 footer-slogan">Surface what matters, <span className="italic">automate the rest.</span></div>
              <div className="group">
                <div className="text---badge">monthly Newsletter</div>
                <div className="form-block w-form">
                  <form id="footer-subscribe-form" name="footer-subscribe-form" className="subscribe-form">
                    <input className="form-input light w-input" maxLength={256} name="Subscriber-Email" placeholder="Email" type="email" required />
                    <input type="submit" className="button light w-button" value="Subscribe" />
                  </form>
                  <div className="form-success w-form-done">
                    <div>Thank you! Your submission has been received!</div>
                  </div>
                  <div className="form-error w-form-fail">
                    <div>Oops! Something went wrong while submitting the form.</div>
                  </div>
                </div>
                <div className="text---muted">We won't share your data with third parties. Ever.</div>
              </div>
            </div>
            <div className="footer-menus">
              <div className="footer-menu">
                <div className="text---badge">pages</div>
                <div className="links">
                  <Link to="/" className="footer-link">Overview</Link>
                  <Link to="/home-3" className="footer-link">Founder Sprint</Link>
                  <Link to="/home-2" className="footer-link">US Track</Link>
                  <Link to="/features-1" className="footer-link">Features 1</Link>
                  <Link to="/features-2" className="footer-link">Features 2</Link>
                  <Link to="/features-3" className="footer-link">Features 3</Link>
                  <Link to="/pricing" className="footer-link">Pricing</Link>
                  <Link to="/customers" className="footer-link">Customers</Link>
                </div>
              </div>
              <div className="footer-menu">
                <div className="text---badge">more pages</div>
                <div className="links">
                  <Link to="/about-1" className="footer-link">About 1</Link>
                  <Link to="/about-2" className="footer-link">About 2</Link>
                  <Link to="/about-3" className="footer-link">About 3</Link>
                  <Link to="/request-demo" className="footer-link">Request Demo</Link>
                  <Link to="/blog" className="footer-link">Blog</Link>
                  <Link to="/contact" className="footer-link">Contact</Link>
                  <Link to="/legal" className="footer-link">Legal</Link>
                </div>
              </div>
              <div className="footer-menu">
                <div className="text---badge">social</div>
                <div className="links">
                  <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer" className="footer-link">Linkedin</a>
                  <a href="https://bsky.social/" target="_blank" rel="noopener noreferrer" className="footer-link">Bluesky</a>
                  <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" className="footer-link">Instagram</a>
                  <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className="footer-link">X (Twitter)</a>
                </div>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <Link to="/" className="footer-logo-link w-inline-block">
              <img src="/images/logo-prospect-light.svg" alt="Prospect logo" className="footer-logo-image" />
            </Link>
            <div className="footer-copyright-row">
              <div className="copyright-wrap">
                <div className="text---small"><span className="text---muted">Copyright</span>
                  <a href="#" className="footer-copyright-link">Medium Rare</a>
                </div>
                <div className="text---small"><span className="text---muted">powered by</span>
                  <a href="https://webflow.com/" target="_blank" rel="noopener noreferrer" className="footer-copyright-link">Webflow</a>
                </div>
              </div>
              <div className="footer-bottom-links">
                <Link to="/style-guide" className="footer-link text---small">Style Guide</Link>
                <Link to="/changelog" className="footer-link text---small">Changelog</Link>
                <Link to="/licenses" className="footer-link text---small">Licenses</Link>
              </div>
            </div>
          </div>
          <div className="text---small disclaimer-text">This text is a legal disclaimer designed for the footer of a website. Begin with a statement acknowledging the company's registration status.</div>
        </div>
      </div>
    </section>
  );
};

export default Footer;

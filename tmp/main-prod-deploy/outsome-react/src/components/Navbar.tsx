import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatedButton } from './AnimatedButton';
import { AnimatedArrowLink } from './AnimatedArrowLink';

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    console.log("Toggle search modal");
  };

  const handleDropdownEnter = (id: string) => {
    setActiveDropdown(id);
  };

  const handleDropdownLeave = () => {
    setActiveDropdown(null);
  };

  const getLinkClass = (path: string, baseClass: string) => {
    return location.pathname === path ? `${baseClass} w--current` : baseClass;
  };

  const getAriaCurrent = (path: string) => {
    return location.pathname === path ? "page" : undefined;
  };

  return (
    <div 
      data-animation="default" 
      data-collapse="medium" 
      data-duration="400" 
      data-easing="ease" 
      data-easing2="ease" 
      role="banner" 
      className="navbar w-nav"
    >
      <div className="main-container navbar-container">
        <div className="navbar-row">
          <Link 
            to="/" 
            aria-current={getAriaCurrent('/')} 
            className={getLinkClass('/', 'nav-logo-link w-inline-block')}
          >
            <img src="/images/Outsome-Full_Black.svg" alt="" width="115" className="nav-logo" />
          </Link>
          <div className="navigation-wrap">
            <nav 
              role="navigation" 
              className={`navbar-menu w-nav-menu ${isMobileMenuOpen ? 'w--open' : ''}`}
            >
              <div className="nav-links">
                <Link 
                  to="/" 
                  aria-current={getAriaCurrent('/')} 
                  className={getLinkClass('/', 'nav-link')}
                >
                  Home
                </Link>
                
                <div 
                  data-hover="true" 
                  data-delay="150" 
                  className={`nav-dropdown show-screen w-dropdown ${activeDropdown === 'programs' ? 'w--open' : ''}`}
                  onMouseEnter={() => handleDropdownEnter('programs')}
                  onMouseLeave={handleDropdownLeave}
                >
                  <div className={`dropdown-toggle w-dropdown-toggle ${activeDropdown === 'programs' ? 'w--open' : ''}`}>
                    <div>Programs</div>
                  </div>
                  <nav className={`dropdown-wrap wide w-dropdown-list ${activeDropdown === 'programs' ? 'w--open' : ''}`}>
                    <div className="dropdown-content-wide">
                      <div className="main-container dropdown-container">
                        <div className="dropdown-columns">
                          <div className="dropdown-column">
                            <div id="w-node-b6d603d1-fcc8-3e06-a78d-00aa8fc28c35-6d7bf580" className="text---badge dropdown-title">Tracks</div>
                            <Link to="/" aria-current={getAriaCurrent('/')} className={getLinkClass('/', 'dropdown-item w-inline-block')}>
                              <div className="text---bold">Overview</div>
                              <div className="dropdown-item-text">Check out our program details.</div>
                            </Link>
                            <Link to="/home-3" className="dropdown-item w-inline-block">
                              <div className="text---bold">Founder Sprint</div>
                              <div className="dropdown-item-text">Build the foundation that actually holds in 4 weeks here in Seoul.</div>
                            </Link>
                            <Link to="/home-2" className="dropdown-item w-inline-block">
                              <div className="text---bold">US Track</div>
                              <div className="dropdown-item-text">Enter the US market under real pressure. On-the-ground immersion in SF. </div>
                            </Link>
                          </div>
                          <div className="dropdown-column">
                            <div className="text---badge dropdown-title">Features</div>
                            <Link to="/features-1" className="dropdown-item w-inline-block">
                              <div className="text---bold">Program Design</div>
                              <div className="dropdown-item-text">Modules, hands-on assignments, and weekly execution checkpoints.</div>
                            </Link>
                            <Link to="/features-2" className="dropdown-item w-inline-block">
                              <div className="text---bold">Use Cases</div>
                              <div className="dropdown-item-text">Explore which types of founders excel here.</div>
                            </Link>
                            <Link to="/features-3" className="dropdown-item w-inline-block">
                              <div className="text---bold">Ecosystem</div>
                              <div className="dropdown-item-text">Check our global network of VCs, YC founders, and FAANG operators.</div>
                            </Link>
                          </div>
                          <div className="dropdown-column">
                            <div className="text---badge dropdown-title">About</div>
                            <Link to="/about-1" className="dropdown-item w-inline-block">
                              <div className="text---bold">Our Company</div>
                              <div className="dropdown-item-text">Introduce your team and mission.</div>
                            </Link>
                            <Link to="/about-2" className="dropdown-item w-inline-block">
                              <div className="text---bold">Culture &amp; Careers</div>
                              <div className="dropdown-item-text">Attract top talent and list open positions.</div>
                            </Link>
                            <Link to="/about-3" className="dropdown-item w-inline-block">
                              <div className="text---bold">Our Technology</div>
                              <div className="dropdown-item-text">Build trust and showcase your approach.</div>
                            </Link>
                          </div>
                          <div className="dropdown-cta-wrap"><img src="/images/photo-art-09.webp" alt="" className="dropdown-cta-bg" />
                            <div className="glass-surface dropdown-cta-content">
                              <div className="text---badge">prospect</div>
                              <div className="heading---h4"><span className="italic">Ultra</span> Premium Webflow Template</div>
                              <AnimatedButton to="#">Buy it now</AnimatedButton>
                              <AnimatedArrowLink to="#">Browse more templates</AnimatedArrowLink>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </nav>
                </div>

                <div 
                  data-hover="true" 
                  data-delay="200" 
                  className={`nav-dropdown w-dropdown ${activeDropdown === 'more' ? 'w--open' : ''}`}
                  onMouseEnter={() => handleDropdownEnter('more')}
                  onMouseLeave={handleDropdownLeave}
                >
                  <div className={`dropdown-toggle w-dropdown-toggle ${activeDropdown === 'more' ? 'w--open' : ''}`}>
                    <div>More Pages</div>
                  </div>
                  <nav className={`dropdown-wrap w-dropdown-list ${activeDropdown === 'more' ? 'w--open' : ''}`}>
                    <div className="dropdown-content">
                      <div className="dropdown-menus">
                        <div className="links">
                          <Link to="/pricing" className="dropdown-link">Pricing</Link>
                          <Link to="/customers" className="dropdown-link">Customers</Link>
                          <Link to="#" className="dropdown-link">Customer Story</Link>
                          <Link to="/blog" className="dropdown-link">Blog</Link>
                          <Link to="#" className="dropdown-link">Blog Article</Link>
                        </div>
                        <div className="links">
                          <Link to="#" className="dropdown-link">Job Opening</Link>
                          <Link to="/request-demo" className="dropdown-link">Request Demo</Link>
                          <Link to="/contact" className="dropdown-link">Contact</Link>
                          <Link to="/legal" className="dropdown-link">Legal</Link>
                        </div>
                      </div>
                      <div className="dropdown-cta-horizontal"><img src="/images/photo-square-06.webp" alt="" className="dropdown-cta-image" />
                        <div className="dropdown-cta-text">
                          <div className="text---badge">prospect</div>
                          <div className="text---lead text---bold">Ultra Premium Webflow Template.</div>
                          <AnimatedArrowLink to="#">Buy now</AnimatedArrowLink>
                        </div>
                      </div>
                    </div>
                  </nav>
                </div>

                <div 
                  data-hover="true" 
                  data-delay="200" 
                  className={`nav-dropdown w-dropdown ${activeDropdown === 'resources' ? 'w--open' : ''}`}
                  onMouseEnter={() => handleDropdownEnter('resources')}
                  onMouseLeave={handleDropdownLeave}
                >
                  <div className={`dropdown-toggle w-dropdown-toggle ${activeDropdown === 'resources' ? 'w--open' : ''}`}>
                    <div>Resources</div>
                  </div>
                  <nav className={`dropdown-wrap w-dropdown-list ${activeDropdown === 'resources' ? 'w--open' : ''}`}>
                    <div className="dropdown-content narrow">
                      <div className="links">
                        <Link to="/style-guide" className="dropdown-link">Style Guide</Link>
                        <Link to="/changelog" className="dropdown-link">Changelog</Link>
                        <Link to="/licenses" className="dropdown-link">Licenses</Link>
                        <Link to="#" className="dropdown-link">More Templates</Link>
                      </div>
                    </div>
                  </nav>
                </div>

                <form action="/search" className="navbar-menu-search w-form">
                  <input className="form-input w-input" maxLength={256} name="query" placeholder="Search..." type="search" required />
                  <input type="submit" className="hide w-button" value="Search" />
                </form>

                <div className="nav-button-mobile">
                  <AnimatedButton to="#">Buy Template</AnimatedButton>
                </div>
              </div>
            </nav>
          </div>
          <div className="navbar-right-contents">
            <div className="trigger-search" onClick={toggleSearch}>
              <img src="/images/icon-interface-search.svg" alt="Search icon" className="search-icon" />
              <div>Search</div>
            </div>
            <div className="nav-buttons-wrapper">
              <AnimatedButton to="#" variant="light-2" size="small">Templates</AnimatedButton>
              <AnimatedButton to="#">Buy Template</AnimatedButton>
            </div>
            <div className={`menu-button w-nav-button ${isMobileMenuOpen ? 'w--open' : ''}`} onClick={toggleMobileMenu}>
              <div className="menu-button-icon-wrapper">
                <img src="/images/icon-interface-menu.svg" alt="Menu icon" className="menu-button-icon" />
                <img src="/images/icon-interface-cross.svg" alt="Cross icon" className="menu-button-icon" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;

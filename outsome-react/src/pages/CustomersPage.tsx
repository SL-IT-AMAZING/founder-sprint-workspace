import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { AnimatedButton } from '../components/AnimatedButton';

export default function CustomersPage() {
  return (
    <>
      <Navbar />
      <section className="section padding-bottom-small">
        <div className="main-container">
          <div className="vertical-section centered">
            <div data-w-id="a663b164-a23a-faff-efff-623416a1cae0" className="group title centered">
              <div className="text---badge">customer stories</div>
              <h1 className="hero-heading">How Prospect helps teams move <span className="italic">faster.</span></h1>
              <div className="text---lead subheading">Hear from companies who've transformed their finance workflows—from closing books faster to forecasting.</div>
            </div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="main-container">
          <div className="w-dyn-list">
            <div role="list" className="customer-list w-dyn-items">
              <div role="listitem" className="w-dyn-item">
                <div data-w-id="518ed0e3-8b45-4998-59e2-031e78c72191" className="customer-item">
                  <Link to="#" className="customer-item-link w-inline-block">
                    <img src="https://d3e54v103j8qbb.cloudfront.net/plugins/Basic/assets/placeholder.60f9b1840c.svg" alt="" className="customer-item-image w-dyn-bind-empty" />
                  </Link>
                  <div className="customer-item-content">
                    <div className="customer-item-title-content">
                      <Link to="#" className="w-inline-block">
                        <div className="heading---h3 w-dyn-bind-empty"></div>
                      </Link>
                      <div className="group customer-title-group">
                        <div className="text---lead text---bold w-dyn-bind-empty"></div>
                        <AnimatedButton to="#">
                          Read their story
                        </AnimatedButton>
                      </div>
                    </div>
                    <div className="customer-item-quote-wrap">
                      <img src="https://d3e54v103j8qbb.cloudfront.net/plugins/Basic/assets/placeholder.60f9b1840c.svg" alt="" className="customer-title-avatar w-dyn-bind-empty" />
                      <div className="customer-title-quote-wrap">
                        <div className="w-dyn-bind-empty"></div>
                        <div>
                          <div className="text---bold w-dyn-bind-empty"></div>
                          <div className="w-dyn-bind-empty"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-dyn-empty">
              <div>No items found.</div>
            </div>
          </div>
        </div>
      </section>
      <section className="section padding-bottom-large">
        <div className="main-container">
          <div data-w-id="e74035ef-b85e-d078-66fe-0a07283c55a0" className="group title centered">
            <h1 className="hero-heading">Built for <span className="italic">Fast-Moving</span> Businesses.</h1>
            <div className="text---lead subheading-narrow">Prospect surfaces what matters, automates the rest, and keeps you moving with intention.</div>
            <div className="buttons">
              <AnimatedButton to="/home-3">
                  Get started now
                </AnimatedButton>
              <AnimatedButton to="/features-3" variant="light-2">
                  Explore more
                </AnimatedButton>
            </div>
            <div className="reviews-with-avatars">
              <div className="avatars">
                <img src="/images/avatar-02.webp" alt="" className="avatar-group-item" />
                <img src="/images/avatar-03.webp" alt="" className="avatar-group-item" />
                <img src="/images/avatar-08.webp" alt="" className="avatar-group-item" />
                <img src="/images/avatar-04.webp" alt="" className="avatar-group-item" />
              </div>
              <div className="review-text">
                <img src="/images/icon-interface-star.svg" alt="Star icon" />
                <div className="text---badge">Rated 4.97/5 from 500+ reviews</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
      <div className="search-modal-wrap">
        <div className="search-modal-screen"></div>
        <div className="search-modal-content">
          <form action="/search" className="search-modal-form w-form">
            <input className="form-input w-input" maxLength={256} name="query" placeholder="Search…" type="search" id="search" required />
            <input type="submit" className="button search-modal-button w-button" value="Search" />
          </form>
        </div>
      </div>
      <div className="dropdown-screen"></div>
    </>
  );
}

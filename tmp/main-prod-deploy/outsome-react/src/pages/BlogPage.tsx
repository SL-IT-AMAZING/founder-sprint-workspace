import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { AnimatedArrowLink } from '../components/AnimatedArrowLink';

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <section className="section padding-bottom-small">
        <div className="main-container">
          <div className="vertical-section centered">
            <div className="group title centered">
              <h1 className="hero-heading">News <span className="italic">and</span> Insight from our expert team.</h1>
              <div className="text---lead subheading-narrow">Explore practical insights, strategies, and ideas for modern finance teams.</div>
            </div>
            <div className="group hero-subscribe">
              <div className="text---badge">subscribe to our newsletter</div>
              <div className="form-block w-form">
                <form id="wf-form-Hero-Subscribe-Form" name="wf-form-Hero-Subscribe-Form" data-name="Hero Subscribe Form" method="get" className="subscribe-form wide" data-wf-page-id="691b2d7c12f67ca15b75a15e" data-wf-element-id="a282de5b-f2bf-ed8d-871c-b242b8c92e11">
                  <input className="form-input w-input" maxLength={256} name="Hero-Subscriber-Email" data-name="Hero Subscriber Email" placeholder="Email" type="email" id="Hero-Subscriber-Email" required />
                  <input type="submit" data-wait="Please wait..." className="button w-button" value="Subscribe" />
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
        </div>
      </section>
      <section className="section padding-bottom-large">
        <div className="main-container">
          <div data-w-id="fdf70fc3-1e3f-4a61-4bdf-9620e7f0405d" className="w-dyn-list">
            <div role="list" className="blog-grid w-dyn-items">
              <div role="listitem" className="w-dyn-item">
                <div className="blog-post-item">
                  <Link to="#" className="blog-post-image-wrap w-inline-block">
                    <img src="https://d3e54v103j8qbb.cloudfront.net/plugins/Basic/assets/placeholder.60f9b1840c.svg" alt="" className="hover-image w-dyn-bind-empty" />
                    <div className="badges bottom-right">
                      <div className="badge">
                        <div className="text---badge w-dyn-bind-empty"></div>
                      </div>
                      <div className="badge">
                        <div className="text---badge w-dyn-bind-empty"></div>
                      </div>
                    </div>
                  </Link>
                  <div className="blog-post-item-body">
                    <Link to="#" className="w-inline-block">
                      <div className="text---lead text---bold w-dyn-bind-empty"></div>
                    </Link>
                    <div className="w-dyn-bind-empty"></div>
                    <AnimatedArrowLink to="#">
                      Read article
                    </AnimatedArrowLink>
                  </div>
                </div>
              </div>
            </div>
            <div className="empty-state w-dyn-empty">
              <div>No items found.</div>
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

import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { AnimatedButton } from '../components/AnimatedButton';
import { AnimatedArrowLinkExternal } from '../components/AnimatedArrowLink';

const FeaturesPage3: React.FC = () => {
  return (
    <>
      <Navbar />
      <section data-w-id="b9262a1a-f1c8-74c6-e05e-5fe049c99aed" className="section padding-bottom-small">
        <div className="main-container">
          <div className="vertical-section centered">
            <div data-w-id="b9262a1a-f1c8-74c6-e05e-5fe049c99af0" className="group title centered">
              <div className="text---badge">Integrations</div>
              <h1 className="hero-heading">Prospect fits <span className="italic">seamlessly</span> into your workflow.</h1>
              <div className="text---lead subheading-narrow">Connect to your existing stack—no friction, no duplication and no headaches.</div>
            </div>
          </div>
        </div>
      </section>
      <section className="section padding-bottom-large">
        <div className="main-container">
          <div data-w-id="6fe62d64-9926-e510-4251-d629636a77a0" className="directory-layout">
            <div id="w-node-d5d6c33f-4dae-2aa7-77bb-cabea7105896-5b75a164" className="integration-sidebar">
              <div className="sidebar-section">
                <div className="text---bold">Browse by Category</div>
                <div className="w-dyn-list">
                  <div role="list" className="badges stack w-dyn-items">
                    <div role="listitem" className="w-dyn-item">
                      <a href="#" className="badge no-shadow w-inline-block">
                        <div className="text---badge w-dyn-bind-empty"></div>
                      </a>
                    </div>
                  </div>
                  <div className="w-dyn-empty">
                    <div>No items found.</div>
                  </div>
                </div>
              </div>
              <div className="sidebar-cta">
                <div className="text---bold">Are we missing an integration?</div>
                <div>If you want to see a specific product integration, let us know, we're all ears!</div>
                <AnimatedButton to="/contact" size="small">Contact us</AnimatedButton>
              </div>
            </div>
            <div className="w-dyn-list">
              <div role="list" className="integrations-grid w-dyn-items">
                <div role="listitem" className="w-dyn-item">
                  <div className="integration">
                    <a href="#" className="w-inline-block"><img src="https://d3e54v103j8qbb.cloudfront.net/plugins/Basic/assets/placeholder.60f9b1840c.svg" alt="" className="w-dyn-bind-empty" /></a>
                    <div className="integration-text">
                      <a href="#" className="text---lead text---bold w-dyn-bind-empty"></a>
                      <div className="w-dyn-bind-empty"></div>
                      <AnimatedArrowLinkExternal href="#">See Integration</AnimatedArrowLinkExternal>
                    </div>
                    <div className="w-dyn-list">
                      <div role="list" className="badges stack w-dyn-items">
                        <div role="listitem" className="w-dyn-item">
                          <a href="#" className="badge no-shadow w-inline-block">
                            <div className="text---badge w-dyn-bind-empty"></div>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="empty-state w-dyn-empty">
                <div>No items found.</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default FeaturesPage3;

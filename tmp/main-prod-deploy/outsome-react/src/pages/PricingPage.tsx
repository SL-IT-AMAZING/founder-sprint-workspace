import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { AnimatedButton } from '../components/AnimatedButton';

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <section className="section padding-bottom-small">
        <div className="main-container">
          <div className="group title">
            <div className="reviews-with-avatars">
              <div className="avatars"><img src="/images/avatar-02.webp" alt="" className="avatar-group-item" /><img src="/images/avatar-03.webp" alt="" className="avatar-group-item" /><img src="/images/avatar-08.webp" alt="" className="avatar-group-item" /><img src="/images/avatar-04.webp" alt="" className="avatar-group-item" /></div>
              <div className="review-text"><img src="/images/icon-interface-star.svg" alt="Star icon" />
                <div className="text---badge">Rated 4.97/5 from 500+ reviews</div>
              </div>
            </div>
            <h1 className="hero-heading">Plans that scale for businesses at <span className="italic">every</span> stage.</h1>
            <div className="text---lead subheading-narrow">From startups to enterprise, Prospect has flexible pricing to fit every stage of growth.</div>
          </div>
        </div>
      </section>
      <section className="section padding-top-small">
        <div className="main-container">
          <div className="pricing-table-2">
            <div id="w-node-_6c23c61e-f618-ea82-c25d-792a4c7ac817-5b75a16c" className="pricing-table-1">
              <div className="pricing-table-top">
                <div className="heading---h4">Free</div>
                <div>Explore the essentials, try core features, and get a feel for how Prospect fits your workflow.</div>
                <div className="price-wrap">
                  <div className="heading---h1">$0</div>
                  <div>/ month</div>
                </div>
              </div>
              <AnimatedButton to="/request-demo">
                Start with Free
              </AnimatedButton>
              <div className="pricing-list-wrap">
                <div className="text---bold">Core Features:</div>
                <ul role="list">
                  <li className="list-item">
                    <div>2 integrations</div>
                  </li>
                  <li className="list-item">
                    <div>Unlimited users</div>
                  </li>
                </ul>
              </div>
              <div className="pricing-list-wrap">
                <div className="text---bold">Platform Access:</div>
                <ul role="list">
                  <li className="list-item">
                    <div>Basic dashboards</div>
                  </li>
                  <li className="list-item">
                    <div>Community support</div>
                  </li>
                </ul>
              </div>
            </div>
            <div id="w-node-_7482f4d8-9ae6-5a85-025a-9385f9a53b7f-5b75a16c" className="pricing-table-1">
              <div className="pricing-table-top">
                <div className="heading---h4">Basic</div>
                <div>Streamline your day-to-day operations with integrations and basic automation features.</div>
                <div className="price-wrap">
                  <div className="heading---h1">$19</div>
                  <div>/ month</div>
                </div>
              </div>
              <AnimatedButton to="/request-demo">
                Get Basic
              </AnimatedButton>
              <div className="pricing-list-wrap">
                <div className="text---bold">Core Features:</div>
                <ul role="list">
                  <li className="list-item">
                    <div>Unlimited users</div>
                  </li>
                  <li className="list-item">
                    <div>5 integrations</div>
                  </li>
                  <li className="list-item">
                    <div>Real-time sync</div>
                  </li>
                </ul>
              </div>
              <div className="pricing-list-wrap">
                <div className="text---bold">Platform Access:</div>
                <ul role="list">
                  <li className="list-item">
                    <div>Standard dashboards</div>
                  </li>
                  <li className="list-item">
                    <div>Email support</div>
                  </li>
                  <li className="list-item">
                    <div>API access</div>
                  </li>
                </ul>
              </div>
            </div>
            <div id="w-node-fa1ff19e-7108-be7d-ec2b-5601a08788df-5b75a16c" className="pricing-table-1">
              <div className="pricing-table-top">
                <div className="heading---h4">Pro</div>
                <div>Scale confidently with more power, deeper insights, and advanced customization.</div>
                <div className="price-wrap">
                  <div className="heading---h1">$39</div>
                  <div>/ month</div>
                </div>
              </div>
              <AnimatedButton to="/request-demo">
                Get Pro
              </AnimatedButton>
              <div className="pricing-list-wrap">
                <div className="text---bold">Core Features:</div>
                <ul role="list">
                  <li className="list-item">
                    <div>Unlimited users</div>
                  </li>
                  <li className="list-item">
                    <div>15 integrations</div>
                  </li>
                  <li className="list-item">
                    <div>Scheduled automation</div>
                  </li>
                </ul>
              </div>
              <div className="pricing-list-wrap">
                <div className="text---bold">Platform Access:</div>
                <ul role="list">
                  <li className="list-item">
                    <div>Advanced dashboards</div>
                  </li>
                  <li className="list-item">
                    <div>Priority support</div>
                  </li>
                  <li className="list-item">
                    <div>API + Webhooks</div>
                  </li>
                  <li className="list-item">
                    <div>Audit logs</div>
                  </li>
                </ul>
              </div>
            </div>
            <div id="w-node-_2b27cf18-ba3e-a74b-3bb5-9f1ab3ff3f84-5b75a16c" className="pricing-table-1 bg-dark">
              <div className="pricing-table-top">
                <div className="heading---h4">Enhanced</div>
                <div>Unlock everything Prospect offers—custom rules, rich analytics, and total control.</div>
                <div className="price-wrap">
                  <div className="heading---h1">$79</div>
                  <div>/ month</div>
                </div>
              </div>
              <AnimatedButton to="/request-demo" variant="light">
                Get Enhanced
              </AnimatedButton>
              <div className="pricing-list-wrap">
                <div className="text---bold">Core Features:</div>
                <ul role="list">
                  <li className="list-item">
                    <div>Unlimited users</div>
                  </li>
                  <li className="list-item">
                    <div>AI-assisted workflows</div>
                  </li>
                  <li className="list-item">
                    <div>Unlimited integrations</div>
                  </li>
                  <li className="list-item">
                    <div>Custom rules engine</div>
                  </li>
                </ul>
              </div>
              <div className="pricing-list-wrap">
                <div className="text---bold">Platform Access:</div>
                <ul role="list">
                  <li className="list-item">
                    <div>Full analytics suite</div>
                  </li>
                  <li className="list-item">
                    <div>Dedicated support</div>
                  </li>
                  <li className="list-item">
                    <div>Sandbox environments</div>
                  </li>
                  <li className="list-item">
                    <div>SSO &amp; permissions</div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="main-container">
          <div className="w-dyn-list">
            <div role="list" className="customer-list w-dyn-items">
              <div role="listitem" className="w-dyn-item">
                <div className="customer-item">
                  <a href="#" className="customer-item-link w-inline-block"><img src="https://d3e54v103j8qbb.cloudfront.net/plugins/Basic/assets/placeholder.60f9b1840c.svg" alt="" className="customer-item-image w-dyn-bind-empty" /></a>
                  <div className="customer-item-content">
                    <div className="customer-item-title-content">
                      <a href="#" className="w-inline-block">
                        <div className="heading---h3 w-dyn-bind-empty"></div>
                      </a>
                      <div className="group customer-title-group">
                        <div className="text---lead text---bold w-dyn-bind-empty"></div>
                        <AnimatedButton to="#">
                          Read their story
                        </AnimatedButton>
                      </div>
                    </div>
                    <div className="customer-item-quote-wrap"><img src="https://d3e54v103j8qbb.cloudfront.net/plugins/Basic/assets/placeholder.60f9b1840c.svg" alt="" className="customer-title-avatar w-dyn-bind-empty" />
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
      <section className="section">
        <div className="main-container">
          <div className="grid-sidebar-layout">
            <div className="group">
              <div className="text---badge">frequently asked questions</div>
              <div className="heading---h2 sidebar-heading">We're here to answer your questions.</div>
            </div>
            <div id="w-node-_043df0e7-4e49-e441-5db3-b0410ac484de-0ac484d6" className="faq-section">
              <div className="text---lead faq-heading">Clear answers, no fluff. We've designed Prospect to feel intuitive from day one—but here's where we answer the most common questions with clarity and care.</div>
              <div className="accordion">
                <div className="accordion-item">
                  <div className="accordion-title">
                    <div className="text---bold accordion-heading">Can I use Prospect with my current tools?</div><img src="/images/icon-interface-chevron-down.svg" alt="Chevron down icon" className="accordion-icon" />
                  </div>
                  <div className="accordion-content-wrap">
                    <div className="accordion-content">
                      <div className="accordion-text">
                        <div>Yes—Prospect is built to integrate seamlessly with the platforms you already rely on. From data sync to workflow triggers, we support popular tools out of the box and offer API access for everything else.<br /><br />Whether you're using Slack, Notion, Google Workspace, or something more specialized, Prospect fits into your stack without disrupting it. We believe software should meet you where you are—not the other way around.</div>
                        <AnimatedButton to="/contact" variant="light-2" size="small">
                          Contact us
                        </AnimatedButton>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="accordion-item">
                  <div className="accordion-title">
                    <div className="text---bold accordion-heading">How long does setup take?</div><img src="/images/icon-interface-chevron-down.svg" alt="Chevron down icon" className="accordion-icon" />
                  </div>
                  <div className="accordion-content-wrap">
                    <div className="accordion-content">
                      <div className="accordion-text">
                        <div>Most teams are set up in under an hour. We've designed Prospect to be intuitive from the start—no need for lengthy onboarding sessions or technical hand-holding. Just connect your data sources, set your preferences, and your workflows are ready to go. Our team is always on hand if you want help, but most users don't need it.</div>
                        <AnimatedButton to="/contact" variant="light-2" size="small">
                          Contact us
                        </AnimatedButton>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="accordion-item">
                  <div className="accordion-title">
                    <div className="text---bold accordion-heading">What happens if I outgrow the Free plan?</div><img src="/images/icon-interface-chevron-down.svg" alt="Chevron down icon" className="accordion-icon" />
                  </div>
                  <div className="accordion-content-wrap">
                    <div className="accordion-content">
                      <div className="accordion-text">
                        <div>The Free plan is designed to get you started, but when your needs grow, Prospect scales with you. Upgrading is seamless—no data loss, no reconfiguration. You'll instantly unlock more automation, more integrations, and advanced features to help your team stay ahead. We'll even guide you through the transition to make sure nothing gets missed.</div>
                        <AnimatedButton to="/contact" variant="light-2" size="small">
                          Contact us
                        </AnimatedButton>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="accordion-item">
                  <div className="accordion-title">
                    <div className="text---bold accordion-heading">Is my data secure with Prospect?</div><img src="/images/icon-interface-chevron-down.svg" alt="Chevron down icon" className="accordion-icon" />
                  </div>
                  <div className="accordion-content-wrap">
                    <div className="accordion-content">
                      <div className="accordion-text">
                        <div>Security is a non-negotiable. Prospect uses end-to-end encryption in transit and at rest, along with advanced identity management features like SSO, 2FA, and granular role permissions. We also run regular audits and work with trusted infrastructure providers to safeguard every layer of your data. You own your data, and it's never used or shared without your consent.</div>
                        <AnimatedButton to="/contact" variant="light-2" size="small">
                          Contact us
                        </AnimatedButton>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="accordion-item">
                  <div className="accordion-title">
                    <div className="text---bold accordion-heading">Are our company secrets protected with Prospect?</div><img src="/images/icon-interface-chevron-down.svg" alt="Chevron down icon" className="accordion-icon" />
                  </div>
                  <div className="accordion-content-wrap">
                    <div className="accordion-content">
                      <div className="accordion-text">
                        <div>Yes—confidentiality is central to everything we build. Whether it's financial reports, internal notes, or sensitive forecasting data, it stays strictly yours. We don't access or analyze your information unless explicitly requested for support. Our platform is used by companies with strict compliance needs, and we meet or exceed industry security standards.</div>
                        <AnimatedButton to="/contact" variant="light-2" size="small">
                          Contact us
                        </AnimatedButton>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="accordion-item">
                  <div className="accordion-title">
                    <div className="text---bold accordion-heading">Does Prospect support teams in different time zones?</div><img src="/images/icon-interface-chevron-down.svg" alt="Chevron down icon" className="accordion-icon" />
                  </div>
                  <div className="accordion-content-wrap">
                    <div className="accordion-content">
                      <div className="accordion-text">
                        <div>Absolutely. Prospect is built for global teams with asynchronous schedules. From workflow notifications that adjust to local time, to real-time collaboration that doesn't require everyone to be online at once, we make working across time zones feel natural. You can set time-aware triggers, assign reviewers by region, and keep your processes running smoothly around the clock.</div>
                        <AnimatedButton to="/contact" variant="light-2" size="small">
                          Contact us
                        </AnimatedButton>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="accordion-item">
                  <div className="accordion-title">
                    <div className="text---bold accordion-heading">Can I cancel or change plans anytime?</div><img src="/images/icon-interface-chevron-down.svg" alt="Chevron down icon" className="accordion-icon" />
                  </div>
                  <div className="accordion-content-wrap">
                    <div className="accordion-content">
                      <div className="accordion-text">
                        <div>Yes—your plan is always in your control. Downgrade, upgrade, or cancel without needing to contact support or jump through hoops. Your settings and data are preserved, so if you return later, you can pick up right where you left off. We believe in earning your trust, not locking you in.</div>
                        <AnimatedButton to="/contact" variant="light-2" size="small">
                          Contact us
                        </AnimatedButton>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="section padding-bottom-large">
        <div className="main-container">
          <div className="group title centered">
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
              <div className="avatars"><img src="/images/avatar-02.webp" alt="" className="avatar-group-item" /><img src="/images/avatar-03.webp" alt="" className="avatar-group-item" /><img src="/images/avatar-08.webp" alt="" className="avatar-group-item" /><img src="/images/avatar-04.webp" alt="" className="avatar-group-item" /></div>
              <div className="review-text"><img src="/images/icon-interface-star.svg" alt="Star icon" />
                <div className="text---badge">Rated 4.97/5 from 500+ reviews</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

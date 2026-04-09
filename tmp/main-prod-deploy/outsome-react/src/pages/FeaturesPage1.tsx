import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { AnimatedButton } from '../components/AnimatedButton';

const FeaturesPage1: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Tab 3');

  return (
    <>
      <Navbar />
      <section className="section features-intro">
        <div className="main-container">
          <div className="vertical-section centered">
            <div data-w-id="33e3494d-3da8-9c19-003a-12b139647689" className="group title centered">
              <div className="review-text with-avatars">
                <div className="avatars tight"><img src="/images/avatar-02.webp" alt="" className="avatar-group-item tight" /><img src="/images/avatar-03.webp" alt="" className="avatar-group-item tight" /><img src="/images/avatar-08.webp" alt="" className="avatar-group-item tight" /><img src="/images/avatar-04.webp" alt="" className="avatar-group-item tight" /></div>
                <div className="star-badge-text"><img src="/images/icon-interface-star.svg" alt="Star icon" />
                  <div className="text---badge">Rated 4.97/5 from 500+ reviews</div>
                </div>
              </div>
              <h1 className="hero-heading">For teams who need clarity <span className="italic">and</span> momentum.</h1>
              <div className="text---lead subheading-narrow">Prospect balances depth with simplicity, so your team moves faster from day one.</div>
              <AnimatedButton to="/pricing">Get started now</AnimatedButton>
            </div>
          </div>
        </div>
      </section>
      <div>
        <section data-w-id="92848f02-d049-396e-d25e-6dab8cfaff4a" className="features-navigator">
          <div className="main-container">
            <div className="features-navigator-links">
              <a href="#access-control" className="feature-navigator-link w-inline-block"><img src="/images/icon-decorative-hierarchy.svg" alt="" className="feature-navigator-icon" />
                <div>Access Control</div>
              </a>
              <a href="#spending-insights" className="feature-navigator-link w-inline-block"><img src="/images/icon-decorative-money-transfer.svg" alt="" className="feature-navigator-icon" />
                <div>Spending Insights</div>
              </a>
              <a href="#revenue-tracking" className="feature-navigator-link w-inline-block"><img src="/images/icon-decorative-goal.svg" alt="" className="feature-navigator-icon" />
                <div>Revenue Tracking</div>
              </a>
              <a href="#workflow-approvals" className="feature-navigator-link w-inline-block"><img src="/images/icon-decorative-briefcase.svg" alt="" className="feature-navigator-icon" />
                <div>Workflow Approvals</div>
              </a>
            </div>
          </div>
        </section>
        <section id="access-control" className="section feature-section first">
          <div className="main-container">
            <div className="grid feature-item-grid">
              <div id="w-node-_773a9c3f-7302-3b70-d4eb-59a0b322cdff-5b75a160" data-w-id="773a9c3f-7302-3b70-d4eb-59a0b322cdff" className="widget-section landscape-orientation"><img src="/images/photo-art-04.webp" loading="lazy" sizes="(max-width: 1232px) 100vw, 1232px" srcSet="/images/photo-art-04-p-500.webp 500w, /images/photo-art-04-p-800.webp 800w, /images/photo-art-04-p-1080.webp 1080w, /images/photo-art-04.webp 1232w" alt="" className="widget-section-bg" />
                <div className="wide-widget-wrap">
                  <div className="widget users">
                    <div className="widget-user-row">
                      <div className="widget-checkbox">
                        <div className="widget-checkbox-minus"></div>
                      </div>
                      <div className="text---bold">Name</div>
                      <div className="text---bold">Amount</div>
                      <div className="text---bold">Date</div>
                    </div>
                    <div className="widget-user-row">
                      <div className="widget-checkbox"><img src="/images/widget-icon-checkbox-check.svg" alt="" /></div>
                      <div className="widget-user"><img src="/images/avatar-03.webp" alt="" className="widget-user-avatar" />
                        <div className="text---bold">Lana Hall</div>
                      </div>
                      <div>$84,000</div>
                      <div className="text---muted">10th June 2025</div>
                    </div>
                    <div className="widget-user-row">
                      <div className="widget-checkbox"><img src="/images/widget-icon-checkbox-check.svg" alt="" /></div>
                      <div className="widget-user"><img src="/images/avatar-04.webp" alt="" className="widget-user-avatar" />
                        <div className="text---bold">Francesca Swift</div>
                      </div>
                      <div>$12,506</div>
                      <div className="text---muted">8th June 2025</div>
                    </div>
                    <div className="widget-user-row">
                      <div className="widget-checkbox"><img src="/images/widget-icon-checkbox-check.svg" alt="" /></div>
                      <div className="widget-user"><img src="/images/avatar-08.webp" alt="" className="widget-user-avatar" />
                        <div className="text---bold">Jacob Rowland</div>
                      </div>
                      <div>$6,630</div>
                      <div className="text---muted">13th May 2025</div>
                    </div>
                    <div className="widget-user-row">
                      <div className="widget-checkbox"><img src="/images/widget-icon-checkbox-check.svg" alt="" /></div>
                      <div className="widget-user"><img src="/images/avatar-05.webp" alt="" className="widget-user-avatar" />
                        <div className="text---bold">Sophia Martinez</div>
                      </div>
                      <div>$8,250</div>
                      <div className="text---muted">15th June 2025</div>
                    </div>
                    <div className="widget-user-row last">
                      <div className="widget-checkbox"><img src="/images/widget-icon-checkbox-check.svg" alt="" /></div>
                      <div className="widget-user"><img src="/images/avatar-01.webp" alt="" className="widget-user-avatar" />
                        <div className="text---bold">Liam Johnson</div>
                      </div>
                      <div>$7,400</div>
                      <div className="text---muted">22nd July 2025</div>
                    </div>
                  </div>
                </div>
              </div>
              <div data-w-id="677f1242-ee06-417d-d6fd-5575a3172149" className="group feature-text">
                <div className="group">
                  <div className="heading---h3">Access Control</div>
                  <div className="text---lead">Give the right people the right visibility—without the back-and-forth. Prospect makes permission management effortless, with granular roles, smart defaults, and real-time updates.</div>
                </div>
                <div className="group">
                  <div className="text---badge">including:</div>
                  <ul role="list">
                    <li>
                      <div>Role-based access with customizable permissions</div>
                    </li>
                    <li>
                      <div>Instant updates across teams and devices</div>
                    </li>
                    <li>
                      <div>Admin controls without the complexity</div>
                    </li>
                    <li>
                      <div>Secure sharing for internal and external collaborators</div>
                    </li>
                  </ul>
                  <AnimatedButton to="/features-2">Start now</AnimatedButton>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="spending-insights" className="section feature-section">
          <div className="main-container">
            <div className="grid feature-item-grid">
              <div id="w-node-f2d84ace-732d-1926-d5eb-6f7beb05158a-5b75a160" data-w-id="f2d84ace-732d-1926-d5eb-6f7beb05158a" className="widget-section landscape-orientation"><img src="/images/photo-square-02.webp" loading="lazy" sizes="(max-width: 1024px) 100vw, 1024px" srcSet="/images/photo-square-02-p-500.webp 500w, /images/photo-square-02-p-800.webp 800w, /images/photo-square-02.webp 1024w" alt="" className="widget-section-bg" />
                <div className="widget balance-summary">
                  <div className="group">
                    <div>Balance Summary</div>
                    <div className="balance-summary-title">
                      <div className="heading---h2">$84,000</div>
                      <div className="text---small balance-summary-title-label">available of $100,000</div>
                    </div>
                  </div>
                  <div className="balance-summary-wrap">
                    <div className="balance-summary-labels">
                      <div className="balance-summary-label">
                        <div className="balance-summary-label-top">
                          <div className="balance-blip"></div>
                          <div>Spent</div>
                        </div>
                        <div>74%</div>
                      </div>
                      <div className="balance-summary-label">
                        <div className="balance-summary-label-top">
                          <div className="balance-blip blip-2"></div>
                          <div>Available</div>
                        </div>
                        <div>8%</div>
                      </div>
                      <div className="balance-summary-label">
                        <div className="balance-summary-label-top">
                          <div className="balance-blip blip-3"></div>
                          <div>Unallocated</div>
                        </div>
                        <div>18%</div>
                      </div>
                    </div>
                    <div className="balance-graph-wrap">
                      <div className="graph-line"></div>
                      <div className="graph-line line-2"></div>
                      <div className="graph-line line-3"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div data-w-id="f2d84ace-732d-1926-d5eb-6f7beb0515ce" className="group feature-text">
                <div className="group">
                  <div className="heading---h3">Spending Insights</div>
                  <div className="text---lead">Get a live view of how your budget is allocated, spent, and available—without digging through spreadsheets. Prospect gives you instant visibility into your businesses finances.</div>
                </div>
                <div className="group">
                  <div className="text---badge">including:</div>
                  <ul role="list">
                    <li>
                      <div>Real-time spend tracking across teams or projects</div>
                    </li>
                    <li>
                      <div>Visual breakdowns of allocated vs. unallocated funds</div>
                    </li>
                    <li>
                      <div>Budget alerts to keep everything on course</div>
                    </li>
                    <li>
                      <div>Export-ready summaries for easy reporting</div>
                    </li>
                  </ul>
                  <AnimatedButton to="#">Start now</AnimatedButton>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="section features-breakup">
          <div className="main-container">
            <div className="metric-breakout">
              <div className="metric-row">
                <div className="metric-item-horizontal">
                  <div className="heading---h1">58%</div>
                  <div>Reduction <br />in reporting time.</div>
                </div>
                <div className="metric-item-horizontal">
                  <div className="heading---h1">$7,000</div>
                  <div>Savings <br />per month (approx)</div>
                </div>
                <div className="metric-item-horizontal">
                  <div className="heading---h1">31</div>
                  <div>Increase <br />in billing hours</div>
                </div>
              </div>
              <div className="metric-customer-wrap"><img src="/images/Vector-1.svg" alt="" />
                <div className="small-quote-item"><img src="/images/photo-headshot-04.webp" alt="" sizes="(max-width: 928px) 100vw, 928px" srcSet="/images/photo-headshot-04-p-500.webp 500w, /images/photo-headshot-04-p-800.webp 800w, /images/photo-headshot-04.webp 928w" className="small-quote-avatar" />
                  <div>"We've replaced three other tools with Prospect."</div>
                </div>
                <AnimatedButton to="/customers" size="small">Meet our Customers</AnimatedButton>
              </div>
            </div>
          </div>
        </section>
        <section id="revenue-tracking" className="section feature-section">
          <div className="main-container">
            <div className="grid feature-item-grid">
              <div id="w-node-_0bf4c931-c8e4-20cb-50c0-0a62fd4fd923-5b75a160" data-w-id="0bf4c931-c8e4-20cb-50c0-0a62fd4fd923" className="widget-section landscape-orientation"><img src="/images/photo-art-05.webp" loading="lazy" sizes="(max-width: 1536px) 100vw, 1536px" srcSet="/images/photo-art-05-p-500.webp 500w, /images/photo-art-05-p-800.webp 800w, /images/photo-art-05-p-1080.webp 1080w, /images/photo-art-05.webp 1536w" alt="" className="widget-section-bg" />
                <div className="widget">
                  <div>Revenue Summary</div>
                  <div className="heading---h2">$80,000</div>
                  <div className="widget-line"></div>
                  <div className="widget-graph-wrap">
                    <div className="widget-graph-item">
                      <div className="widget-bar-graph"></div>
                      <div className="text---small">April</div>
                    </div>
                    <div className="widget-graph-item">
                      <div className="widget-bar-graph height-2"></div>
                      <div className="text---small">May</div>
                    </div>
                    <div className="widget-graph-item">
                      <div className="widget-bar-graph height-3"></div>
                      <div className="text---small">June</div>
                    </div>
                    <div className="widget-graph-item">
                      <div className="widget-bar-graph height-4"></div>
                      <div className="text---small">July</div>
                    </div>
                  </div>
                </div>
              </div>
              <div data-w-id="0bf4c931-c8e4-20cb-50c0-0a62fd4fd949" className="group feature-text">
                <div className="group">
                  <div className="heading---h3">Revenue Tracking</div>
                  <div className="text---lead">See the full picture without the spreadsheet sprawl. Prospect brings revenue data into one clean, unified view—so you can track performance, spot patterns, and make smarter moves.</div>
                </div>
                <div className="group">
                  <div className="text---badge">including:</div>
                  <ul role="list">
                    <li>
                      <div>Live revenue dashboards with zero manual updates</div>
                    </li>
                    <li>
                      <div>Month-over-month and year-to-date visibility</div>
                    </li>
                    <li>
                      <div>Easy exports for reporting and forecasting</div>
                    </li>
                    <li>
                      <div>Works seamlessly with your existing systems</div>
                    </li>
                  </ul>
                  <AnimatedButton to="#">Start now</AnimatedButton>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="workflow-approvals" className="section feature-section last">
          <div className="main-container">
            <div className="grid feature-item-grid">
              <div id="w-node-_782daf98-7328-d98e-2cc7-fb23eefc0e0f-5b75a160" data-w-id="782daf98-7328-d98e-2cc7-fb23eefc0e0f" className="widget-section landscape-orientation"><img src="/images/photo-landscape-03.webp" loading="lazy" sizes="(max-width: 1536px) 100vw, 1536px" srcSet="/images/photo-landscape-03-p-500.webp 500w, /images/photo-landscape-03-p-800.webp 800w, /images/photo-landscape-03-p-1080.webp 1080w, /images/photo-landscape-03.webp 1536w" alt="" className="widget-section-bg" />
                <div className="widget-flow">
                  <div className="widget action"><img src="/images/icon-decorative-favorites-shield.svg" alt="" className="widget-action-icon" />
                    <div>Document secured</div>
                  </div>
                  <div className="widget-flow-line"></div>
                  <div className="widget action"><img src="/images/icon-decorative-open-envelope.svg" alt="" className="widget-action-icon" />
                    <div>Sent for approval</div>
                  </div>
                  <div className="widget-flow-line"></div>
                  <div className="widget action"><img src="/images/icon-decorative-goal.svg" alt="" className="widget-action-icon" />
                    <div>Payment approved</div>
                  </div>
                </div>
              </div>
              <div data-w-id="782daf98-7328-d98e-2cc7-fb23eefc0e28" className="group feature-text">
                <div className="group">
                  <div className="heading---h3">Workflow Approvals</div>
                  <div className="text---lead">Prospect streamlines document approvals, payments, and permissions into a single, secure flow—so nothing gets lost in Slack threads or buried in inboxes.</div>
                </div>
                <div className="group">
                  <div className="text---badge">including:</div>
                  <ul role="list">
                    <li>
                      <div>One-click approvals for payments, contracts, and requests</div>
                    </li>
                    <li>
                      <div>Full audit trails for transparency and compliance</div>
                    </li>
                    <li>
                      <div>Secure document sharing with real-time status updates</div>
                    </li>
                    <li>
                      <div>Custom workflows for different teams or access levels</div>
                    </li>
                  </ul>
                  <AnimatedButton to="#">Start now</AnimatedButton>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <section className="section padding-top-large">
        <div className="main-container">
          <div className="vertical-section centered">
            <div data-w-id="2eef886a-2359-1733-d876-a32aaaace3f6" className="group centered">
              <div className="text---badge">common questions</div>
              <div className="heading---h2 hero-heading">We're here to answer your questions.</div>
              <div className="text---lead subheading-narrow">Prospect evolves with you, learning your patterns and pushing what's next into now.</div>
            </div>
            <div className="faq-tab-wrap">
              <div data-current="Tab 3" data-easing="ease" data-duration-in="300" data-duration-out="100" className="w-tabs">
                <div className="tab-bar w-tab-menu">
                  <button 
                    data-w-tab="Tab 1" 
                    className={`tab-bar-item w-inline-block w-tab-link ${activeTab === 'Tab 1' ? 'w--current' : ''}`}
                    onClick={() => setActiveTab('Tab 1')}
                  >
                    <div>Product Features</div>
                  </button>
                  <button 
                    data-w-tab="Tab 2" 
                    className={`tab-bar-item w-inline-block w-tab-link ${activeTab === 'Tab 2' ? 'w--current' : ''}`}
                    onClick={() => setActiveTab('Tab 2')}
                  >
                    <div>Getting Started</div>
                  </button>
                  <button 
                    data-w-tab="Tab 3" 
                    className={`tab-bar-item w-inline-block w-tab-link ${activeTab === 'Tab 3' ? 'w--current' : ''}`}
                    onClick={() => setActiveTab('Tab 3')}
                  >
                    <div>Support &amp; Billing</div>
                  </button>
                </div>
                <div className="w-tab-content">
                  <div data-w-tab="Tab 1" className={`w-tab-pane ${activeTab === 'Tab 1' ? 'w--tab-active' : ''}`}>
                    <div className="accordion">
                      <div className="accordion-item">
                        <div className="accordion-title">
                          <div className="text---bold accordion-heading">Can I use Prospect with my current tools?</div><img src="/images/icon-interface-chevron-down.svg" alt="Chevron down icon" className="accordion-icon" />
                        </div>
                        <div className="accordion-content-wrap">
                          <div className="accordion-content">
                            <div className="accordion-text">
                              <div>Yes—Prospect is built to integrate seamlessly with the platforms you already rely on. From data sync to workflow triggers, we support popular tools out of the box and offer API access for everything else.<br /><br />Whether you're using Slack, Notion, Google Workspace, or something more specialized, Prospect fits into your stack without disrupting it. We believe software should meet you where you are—not the other way around.</div>
                              <AnimatedButton to="/contact" variant="light-2" size="small">Contact us</AnimatedButton>
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
                              <AnimatedButton to="/contact" variant="light-2" size="small">Contact us</AnimatedButton>
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
                              <AnimatedButton to="/contact" variant="light-2" size="small">Contact us</AnimatedButton>
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
                              <AnimatedButton to="/contact" variant="light-2" size="small">Contact us</AnimatedButton>
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
                              <AnimatedButton to="/contact" variant="light-2" size="small">Contact us</AnimatedButton>
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
                              <AnimatedButton to="/contact" variant="light-2" size="small">Contact us</AnimatedButton>
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
                              <AnimatedButton to="/contact" variant="light-2" size="small">Contact us</AnimatedButton>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div data-w-tab="Tab 2" className={`w-tab-pane ${activeTab === 'Tab 2' ? 'w--tab-active' : ''}`}>
                    <div className="accordion">
                      <div className="accordion-item">
                        <div className="accordion-title">
                          <div className="text---bold accordion-heading">Is my data secure with Prospect?</div><img src="/images/icon-interface-chevron-down.svg" alt="Chevron down icon" className="accordion-icon" />
                        </div>
                        <div className="accordion-content-wrap">
                          <div className="accordion-content">
                            <div className="accordion-text">
                              <div>Security is a non-negotiable. Prospect uses end-to-end encryption in transit and at rest, along with advanced identity management features like SSO, 2FA, and granular role permissions. We also run regular audits and work with trusted infrastructure providers to safeguard every layer of your data. You own your data, and it's never used or shared without your consent.</div>
                              <AnimatedButton to="/contact" variant="light-2" size="small">Contact us</AnimatedButton>
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
                              <AnimatedButton to="/contact" variant="light-2" size="small">Contact us</AnimatedButton>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="accordion-item">
                        <div className="accordion-title">
                          <div className="text---bold accordion-heading">Can I use Prospect with my current tools?</div><img src="/images/icon-interface-chevron-down.svg" alt="Chevron down icon" className="accordion-icon" />
                        </div>
                        <div className="accordion-content-wrap">
                          <div className="accordion-content">
                            <div className="accordion-text">
                              <div>Yes—Prospect is built to integrate seamlessly with the platforms you already rely on. From data sync to workflow triggers, we support popular tools out of the box and offer API access for everything else.<br /><br />Whether you're using Slack, Notion, Google Workspace, or something more specialized, Prospect fits into your stack without disrupting it. We believe software should meet you where you are—not the other way around.</div>
                              <AnimatedButton to="/contact" variant="light-2" size="small">Contact us</AnimatedButton>
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
                              <AnimatedButton to="/contact" variant="light-2" size="small">Contact us</AnimatedButton>
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
                              <AnimatedButton to="/contact" variant="light-2" size="small">Contact us</AnimatedButton>
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
                              <AnimatedButton to="/contact" variant="light-2" size="small">Contact us</AnimatedButton>
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
                              <AnimatedButton to="/contact" variant="light-2" size="small">Contact us</AnimatedButton>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div data-w-tab="Tab 3" className={`w-tab-pane ${activeTab === 'Tab 3' ? 'w--tab-active' : ''}`}>
                    <div className="accordion">
                      <div className="accordion-item">
                        <div className="accordion-title">
                          <div className="text---bold accordion-heading">Does Prospect support teams in different time zones?</div><img src="/images/icon-interface-chevron-down.svg" alt="Chevron down icon" className="accordion-icon" />
                        </div>
                        <div className="accordion-content-wrap">
                          <div className="accordion-content">
                            <div className="accordion-text">
                              <div>Absolutely. Prospect is built for global teams with asynchronous schedules. From workflow notifications that adjust to local time, to real-time collaboration that doesn't require everyone to be online at once, we make working across time zones feel natural. You can set time-aware triggers, assign reviewers by region, and keep your processes running smoothly around the clock.</div>
                              <AnimatedButton to="/contact" variant="light-2" size="small">Contact us</AnimatedButton>
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
                              <AnimatedButton to="/contact" variant="light-2" size="small">Contact us</AnimatedButton>
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
                              <AnimatedButton to="/contact" variant="light-2" size="small">Contact us</AnimatedButton>
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
                              <AnimatedButton to="/contact" variant="light-2" size="small">Contact us</AnimatedButton>
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
                              <AnimatedButton to="/contact" variant="light-2" size="small">Contact us</AnimatedButton>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="accordion-item">
                        <div className="accordion-title">
                          <div className="text---bold accordion-heading">Can I use Prospect with my current tools?</div><img src="/images/icon-interface-chevron-down.svg" alt="Chevron down icon" className="accordion-icon" />
                        </div>
                        <div className="accordion-content-wrap">
                          <div className="accordion-content">
                            <div className="accordion-text">
                              <div>Yes—Prospect is built to integrate seamlessly with the platforms you already rely on. From data sync to workflow triggers, we support popular tools out of the box and offer API access for everything else.<br /><br />Whether you're using Slack, Notion, Google Workspace, or something more specialized, Prospect fits into your stack without disrupting it. We believe software should meet you where you are—not the other way around.</div>
                              <AnimatedButton to="/contact" variant="light-2" size="small">Contact us</AnimatedButton>
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
                              <AnimatedButton to="/contact" variant="light-2" size="small">Contact us</AnimatedButton>
                            </div>
                          </div>
                        </div>
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
          <div className="customer-spotlight-section"><img src="/images/photo-landscape-hero-03.webp" alt="" sizes="(max-width: 2400px) 100vw, 2400px" srcSet="/images/photo-landscape-hero-03-p-500.webp 500w, /images/photo-landscape-hero-03-p-800.webp 800w, /images/photo-landscape-hero-03-p-1080.webp 1080w, /images/photo-landscape-hero-03-p-1600.webp 1600w, /images/photo-landscape-hero-03-p-2000.webp 2000w, /images/photo-landscape-hero-03.webp 2400w" className="customer-spotlight-image landscape" />
            <div className="customer-spotlight-content no-padding">
              <div className="heading---h3">"We now rely on Prospect for <span className="italic">all</span> our software needs."</div>
              <div>
                <div className="text---bold">Jason Rothman</div>
                <div>Head of Operations, Continuum</div>
              </div>
              <AnimatedButton to="/customers">Meet our Customers</AnimatedButton>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default FeaturesPage1;

import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <section className="section padding-bottom-large">
        <div className="main-container">
          <div className="vertical-section centered">
            <div className="group title centered">
              <div className="text---badge">contact us</div>
              <h1>From the UK <span className="italic">to the world.</span></h1>
              <div className="text---lead subheading">Prospect works across London and Amsterdam, with teams focused on product, design, and growth. We're globally minded, locally grounded, and built for clarity at every scale.</div>
            </div>
            <div className="contact-locations-grid">
              <div className="contact-location"><img src="/images/photo-landscape-07.webp" alt="" sizes="(max-width: 1536px) 100vw, 1536px" srcSet="/images/photo-landscape-07-p-500.webp 500w, /images/photo-landscape-07-p-800.webp 800w, /images/photo-landscape-07-p-1080.webp 1080w, /images/photo-landscape-07.webp 1536w" className="contact-photo" />
                <div>
                  <div className="text---lead text---bold">London</div>
                  <div className="text---lead">Prospect HQ</div>
                </div>
                <div>14 Hanbury Street <br />Spitalfields, London E1 6QR</div>
                <div className="contact-methods">
                  <a href="#">hellohq@website.com</a>
                  <a href="#">+48 39278 538</a>
                </div>
              </div>
              <div className="contact-location"><img src="/images/photo-landscape-08.webp" alt="" sizes="(max-width: 1536px) 100vw, 1536px" srcSet="/images/photo-landscape-08-p-500.webp 500w, /images/photo-landscape-08-p-800.webp 800w, /images/photo-landscape-08-p-1080.webp 1080w, /images/photo-landscape-08.webp 1536w" className="contact-photo" />
                <div>
                  <div className="text---lead text---bold">Amsterdam</div>
                  <div className="text---lead">Prospect Europe</div>
                </div>
                <div>Singel 542 <br />1017 AZ Amsterdam</div>
                <div className="contact-methods">
                  <a href="#">helloeu@website.com</a>
                  <a href="#">+93 4837 0239</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="section bg-light-2 padding-bottom-large">
        <div className="main-container">
          <div className="grid-sidebar-layout contact-layout">
            <div id="w-node-c20c4882-cb17-7ffc-6372-1558d522f172-5b75a159" className="group grid-section-content contact-layout">
              <div className="group sidebar-group">
                <div className="heading---h2">Get in touch with us.</div>
                <div className="text---lead">Whether you're curious about features, pricing, or what Prospect could unlock for your team, we're here to help. Tell us what you're working on—we'll take it from there.</div>
              </div>
              <div className="sidebar-contacts">
                <div className="contact-person"><img src="/images/photo-team-03.webp" alt="" sizes="(max-width: 928px) 100vw, 928px" srcSet="/images/photo-team-03-p-500.webp 500w, /images/photo-team-03-p-800.webp 800w, /images/photo-team-03.webp 928w" className="contact-person-image" />
                  <div className="group">
                    <div>
                      <div className="text---lead text---bold">Anika Wells</div>
                      <div className="text---lead">Head of Customers Sucess</div>
                    </div>
                    <div className="contact-methods">
                      <a href="#">anika@website.com</a>
                      <a href="#">+48 39278 538</a>
                    </div>
                  </div>
                </div>
                <div className="contact-person"><img src="/images/photo-team-05.webp" alt="" sizes="(max-width: 928px) 100vw, 928px" srcSet="/images/photo-team-05-p-500.webp 500w, /images/photo-team-05-p-800.webp 800w, /images/photo-team-05.webp 928w" className="contact-person-image" />
                  <div className="group">
                    <div>
                      <div className="text---lead text---bold">Mark Hammond</div>
                      <div className="text---lead">Head of Sales</div>
                    </div>
                    <div className="contact-methods">
                      <a href="#">mark@website.com</a>
                      <a href="#">+48 39278 538</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div id="w-node-c20c4882-cb17-7ffc-6372-1558d522f184-5b75a159" className="contact-section">
              <div className="text---lead faq-heading">Got a question? Looking for a tailored demo? Fill out the form and we'll be in touch shortly—usually within one business day.</div>
              <div className="form-block w-form">
                <form id="wf-form-Contact-Form" name="wf-form-Contact-Form" data-name="Contact Form" method="get" className="form">
                  <div className="input-pair"><input className="form-input w-input" maxLength={256} name="Contact-Name" data-name="Contact Name" placeholder="Name" type="text" id="Contact-Name" required /><input className="form-input w-node-c20c4882-cb17-7ffc-6372-1558d522f18b-5b75a159 w-input" maxLength={256} name="Contact-Email" data-name="Contact Email" placeholder="Email" type="email" id="Contact-Email" required /></div><input className="form-input w-input" maxLength={256} name="Contact-Phone" data-name="Contact Phone" placeholder="Phone" type="tel" id="Contact-Phone" /><textarea required placeholder="Message" maxLength={5000} id="Contact-Message" name="Contact-Message" data-name="Contact Message" className="form-input textarea w-input"></textarea><label className="w-checkbox checkbox-field">
                    <div className="w-checkbox-input w-checkbox-input--inputType-custom checkbox"></div><input type="checkbox" id="Checkbox" name="Checkbox" data-name="Checkbox" /><span className="checkbox-label w-form-label">I have read and agree to the <Link to="/legal" className="inline-link">Terms &amp; Conditions</Link></span>
                  </label><input type="submit" data-wait="Please wait..." className="button form-button w-button" value="Send Form" />
                  <div className="text---small">We never share your data with third parties.</div>
                </form>
                <div className="form-success w-form-done">
                  <div>Thank you! Your submission has been received!</div>
                </div>
                <div className="form-error w-form-fail">
                  <div>Oops! Something went wrong while submitting the form.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function RequestDemoPage() {
  return (
    <>
      <Navbar />
      <section className="section">
        <div className="main-container">
          <div className="request-demo-grid">
            <div className="request-demo-left">
              <div className="group title centered">
                <div className="emblem-wrap"><img src="/images/photo-art-04.webp" srcSet="/images/photo-art-04-p-500.webp 500w, /images/photo-art-04-p-800.webp 800w, /images/photo-art-04-p-1080.webp 1080w, /images/photo-art-04.webp 1232w" sizes="100vw" alt="" className="outer-emblem-bg" /><img src="/images/photo-art-04.webp" srcSet="/images/photo-art-04-p-500.webp 500w, /images/photo-art-04-p-800.webp 800w, /images/photo-art-04-p-1080.webp 1080w, /images/photo-art-04.webp 1232w" sizes="100vw" alt="" className="outer-emblem-bg-2" />
                  <div className="emblem"><img src="/images/photo-art-04.webp" srcSet="/images/photo-art-04-p-500.webp 500w, /images/photo-art-04-p-800.webp 800w, /images/photo-art-04-p-1080.webp 1080w, /images/photo-art-04.webp 1232w" sizes="100vw" alt="" className="inner-emblem-bg" /><img src="/images/photo-art-04.webp" srcSet="/images/photo-art-04-p-500.webp 500w, /images/photo-art-04-p-800.webp 800w, /images/photo-art-04-p-1080.webp 1080w, /images/photo-art-04.webp 1232w" sizes="100vw" alt="" className="inner-emblem-bg-2" />
                    <div className="emblem-logo-wrap"><img src="/images/Outsome-Symbol_White_Moving.svg" alt="" className="emblem-logo" /></div>
                  </div>
                </div>
                <div className="text---badge">request a demo</div>
                <h1 className="heading---h2">Let us show you the future of Business Intelligence.</h1>
                <div className="text---lead subheading-narrow">Prospect balances depth with simplicity, so your team moves faster from day one.</div>
              </div>
              <div className="group centered">
                <div className="text---badge">join over 500 companies</div>
                <div className="logo-group centered"><img src="/images/logo-baincroft.svg" alt="" className="logo-group-item logo-1" /><img src="/images/Vector-1.svg" alt="" className="logo-group-item logo-2" /><img src="/images/invarion.svg" alt="" className="logo-group-item logo-3" /><img src="/images/Vector.svg" alt="" className="logo-group-item logo-4" /><img src="/images/logo-bailey-klein-2.svg" alt="" className="logo-group-item logo-5" /></div>
              </div>
            </div>
            <div className="form-block w-form">
              <form id="wf-form-Demo-Form" name="wf-form-Demo-Form" data-name="Demo Form" method="get" className="form">
                <div className="input-pair">
                  <div className="input-group">
                    <div>First name</div><input className="form-input w-input" maxLength={256} name="Demo-First-Name" data-name="Demo First Name" placeholder="" type="text" id="Demo-First-Name" required />
                  </div>
                  <div className="input-group">
                    <div>Last name</div><input className="form-input w-input" maxLength={256} name="Demo-Last-Name" data-name="Demo Last Name" placeholder="" type="text" id="Demo-Last-Name" required />
                  </div>
                </div>
                <div className="input-pair">
                  <div className="input-group">
                    <div>Email address</div><input className="form-input w-input" maxLength={256} name="Demo-Email" data-name="Demo Email" placeholder="" type="email" id="Demo-Email" required />
                  </div>
                  <div className="input-group">
                    <div>Phone</div><input className="form-input w-input" maxLength={256} name="Demo-Phone" data-name="Demo Phone" placeholder="" type="tel" id="Demo-Phone" required />
                  </div>
                </div>
                <div className="input-group">
                  <div>Company name</div><input className="form-input w-input" maxLength={256} name="Demo-Company" data-name="Demo Company" placeholder="" type="text" id="Demo-Company" required />
                </div>
                <div className="input-pair">
                  <div className="input-group">
                    <div>Your role</div><input className="form-input w-input" maxLength={256} name="Demo-Role" data-name="Demo Role" placeholder="" type="text" id="Demo-Role" />
                  </div>
                  <div className="input-group">
                    <div>Job level</div><input className="form-input w-input" maxLength={256} name="Demo-Job-Level" data-name="Demo Job Level" placeholder="" type="text" id="Demo-Job-Level" required />
                  </div>
                </div>
                <div className="input-group">
                  <div>What are you interested in learning about?</div>
                  <div className="select-wrap"><select id="Demo-Select" name="Demo-Select" data-name="Demo Select" className="select-field w-select">
                      <option value="">Select an option</option>
                      <option value="First">First choice</option>
                      <option value="Second">Second choice</option>
                      <option value="Third">Third choice</option>
                    </select></div>
                </div>
                <div className="input-group">
                  <div>Anything else you'd like to know?</div><textarea id="Demo-Message" name="Demo-Message" maxLength={5000} data-name="Demo Message" placeholder="" required className="form-input textarea w-input"></textarea>
                </div>
                <div>By clicking submit below, you agree to Prospect's Privacy Policy and to receive a phone call (if a phone number was provided) from Prospect. We never share your data.</div><input type="submit" data-wait="Please wait..." className="button form-button w-button" value="Send Request" />
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
      </section>
      <Footer />
    </>
  );
}

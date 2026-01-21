import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { AnimatedButton } from '../components/AnimatedButton';

export default function LegalPage() {
  return (
    <>
      <Navbar />
      <section className="section padding-bottom-large">
        <div className="main-container">
          <div className="cms-article-wrap">
            <div className="cms-article-box">
              <div className="group">
                <h1 className="heading---h3">Privacy Policy</h1>
                <div className="text---lead cms-box-short-description">At Prospect, we respect your privacy. This policy outlines how we collect, use, and protect your personal information when you visit our website or use our services.</div>
                <div className="text---badge">last updated: 01.07.25</div>
              </div>
              <div className="article cms-article w-richtext">
                <p>This Privacy Policy outlines how we handle the information you provide to us, whether you're browsing our site, signing up for our services, or interacting with our team. We are committed to maintaining transparency about how we collect, use, and share data and ensuring that your personal information is handled in accordance with industry standards and applicable regulations. By using our services, you agree to the practices described in this policy.</p>
                <h6>1. Information We Collect</h6>
                <p>We collect a variety of information to help us operate effectively and provide you with the best possible experience. This includes personal information such as your name, email address, job title, company name, and any other details you choose to submit through contact forms, sign-up processes, or direct communication with our team. We also gather technical data such as IP addresses, browser types, device information, and behavioral data about how you navigate our website. This information is collected through cookies, server logs, and third-party analytics tools, and it helps us improve usability, monitor site performance, and ensure the security of our platform.</p>
                <h6>2. How We Use Your Data</h6>
                <p>We use your information to provide, personalize, and improve our services. This includes communicating with you about new features or product updates, offering customer support, and responding to your inquiries.</p>
                <p>We also analyze usage data to better understand user behavior and refine our offerings. Additionally, if you opt into marketing communications, we may use your email address to send occasional newsletters or event invitations. However, we will never sell your personal information to third parties. All usage of your data is governed by principles of necessity, minimalism, and transparency.</p>
                <h6>3. Sharing Your Information</h6>
                <p>We believe you should be in control of your data. As such, you have the right to access the information we hold about you, request corrections to inaccurate information, and ask for deletion of your personal data when it's no longer necessary for us to retain it. You may also object to or restrict our processing of your information and can opt out of marketing communications at any time using the unsubscribe link in our emails or by contacting us directly. To exercise any of these rights, please contact us via email, and we will respond promptly in accordance with applicable laws.</p>
                <p><strong>You have the right to:</strong></p>
                <ul role="list">
                  <li>Access and update your personal data</li>
                  <li>Request deletion of your information</li>
                  <li>Withdraw consent for marketing at any time</li>
                  <li>File a complaint with a data protection authority</li>
                </ul>
                <h5>Security and Data Retention</h5>
                <p>We take the security of your information seriously and implement a variety of technical and organizational safeguards to protect it from unauthorized access, disclosure, alteration, or destruction. These include encryption, secure access controls, and regular audits of our systems and procedures. While no system is entirely immune to risk, we are committed to continually improving our security practices.</p>
                <p>We retain your personal information only as long as necessary to fulfill the purposes outlined in this policy, including satisfying legal, regulatory, tax, and accounting requirements.</p>
                <h5>Third-Party Tools and External Links</h5>
                <p>Our website may include links to other websites and services that are not operated or controlled by Prospect. This Privacy Policy applies only to our site and services, and we are not responsible for the content, privacy policies, or practices of any third parties. We recommend reviewing the privacy policies of those sites before providing them with your personal information. Additionally, we use third-party tools (such as analytics providers) that may collect data independently of us, subject to their own terms.</p>
                <p><strong>We may use third-party tools to:</strong></p>
                <ul role="list">
                  <li>Monitor user engagement and improve user experience</li>
                  <li>Deliver email campaigns and manage subscriptions</li>
                  <li>Analyze site performance and troubleshoot technical issues</li>
                </ul>
                <h5>Changes to This Policy</h5>
                <p>We may revise this Privacy Policy from time to time to reflect changes to our practices, legal obligations, or service offerings. When we do, we will update the effective date at the top of this page and, where appropriate, provide you with notice by email or through our platform. We encourage you to review this page periodically to stay informed about how we are protecting your data and respecting your privacy preferences.</p>
              </div>
              <div className="cms-box-cta">
                <div>
                  <div className="text---bold">Do you have questions?</div>
                  <div>Reach out to our team and start a discussion.</div>
                </div>
                <AnimatedButton to="/contact" size="small">
                  Contact us
                </AnimatedButton>
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

import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import HomePage2 from './pages/HomePage2'
import HomePage3 from './pages/HomePage3'
import AboutPage1 from './pages/AboutPage1'
import AboutPage2 from './pages/AboutPage2'
import AboutPage3 from './pages/AboutPage3'
import FeaturesPage1 from './pages/FeaturesPage1'
import FeaturesPage2 from './pages/FeaturesPage2'
import FeaturesPage3 from './pages/FeaturesPage3'
import PricingPage from './pages/PricingPage'
import ContactPage from './pages/ContactPage'
import RequestDemoPage from './pages/RequestDemoPage'
import BlogPage from './pages/BlogPage'
import CustomersPage from './pages/CustomersPage'
import LegalPage from './pages/LegalPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/home-2" element={<HomePage2 />} />
      <Route path="/home-3" element={<HomePage3 />} />
      <Route path="/about-1" element={<AboutPage1 />} />
      <Route path="/about-2" element={<AboutPage2 />} />
      <Route path="/about-3" element={<AboutPage3 />} />
      <Route path="/features-1" element={<FeaturesPage1 />} />
      <Route path="/features-2" element={<FeaturesPage2 />} />
      <Route path="/features-3" element={<FeaturesPage3 />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/request-demo" element={<RequestDemoPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/customers" element={<CustomersPage />} />
      <Route path="/legal" element={<LegalPage />} />
    </Routes>
  )
}

export default App

import Link from "next/link";
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faInstagram,
  faTwitter,
  faLinkedin,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";

const FooterSection = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Student Accommodation</h3>
              <p className="text-gray-600 text-sm leading-relaxed max-w-md">
                Find the perfect student accommodation with ease. Connect with verified landlords and 
                discover quality housing options tailored for students across South Africa.
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <nav>
              <ul className="space-y-3">
                <li>
                  <Link href="/about" className="text-gray-600 hover:text-primary-600 text-sm transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact-us" className="text-gray-600 hover:text-primary-600 text-sm transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-gray-600 hover:text-primary-600 text-sm transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Legal
            </h4>
            <nav>
              <ul className="space-y-3">
                <li>
                  <Link href="/terms" className="text-gray-600 hover:text-primary-600 text-sm transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="text-gray-600 hover:text-primary-600 text-sm transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Social Media & Copyright */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-6 mb-4 md:mb-0">
              <a
                href="#"
                aria-label="Facebook"
                className="text-gray-400 hover:text-primary-600 transition-colors"
              >
                <FontAwesomeIcon icon={faFacebook} className="h-5 w-5" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="text-gray-400 hover:text-primary-600 transition-colors"
              >
                <FontAwesomeIcon icon={faInstagram} className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                aria-label="Twitter" 
                className="text-gray-400 hover:text-primary-600 transition-colors"
              >
                <FontAwesomeIcon icon={faTwitter} className="h-5 w-5" />
              </a>
              <a
                href="#"
                aria-label="Linkedin"
                className="text-gray-400 hover:text-primary-600 transition-colors"
              >
                <FontAwesomeIcon icon={faLinkedin} className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                aria-label="Youtube" 
                className="text-gray-400 hover:text-primary-600 transition-colors"
              >
                <FontAwesomeIcon icon={faYoutube} className="h-5 w-5" />
              </a>
            </div>
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} Student Accommodation Platform. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
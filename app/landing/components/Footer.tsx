import { Github, Twitter, Linkedin, Mail } from "lucide-react";
import { footerLinks } from "../data";

export const Footer = () => {
  return (
    <footer className="border-t border-gray-200 py-12 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          <div className="col-span-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
              ListKeeping
            </div>
            <p className="text-gray-600">
              Intelligent inventory management for modern businesses.
            </p>
          </div>
          {footerLinks.map((section, i) => (
            <div key={i}>
              <h4 className="font-semibold text-gray-900 mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link, j) => (
                  <li key={j}>
                    <a
                      href="#"
                      className="text-gray-600 hover:text-gray-900 transition"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-200">
          <div className="flex gap-4 mb-4 md:mb-0">
            <Github
              size={20}
              className="cursor-pointer text-gray-600 hover:text-gray-900 transition"
            />
            <Twitter
              size={20}
              className="cursor-pointer text-gray-600 hover:text-gray-900 transition"
            />
            <Linkedin
              size={20}
              className="cursor-pointer text-gray-600 hover:text-gray-900 transition"
            />
            <Mail
              size={20}
              className="cursor-pointer text-gray-600 hover:text-gray-900 transition"
            />
          </div>
          <div className="flex gap-4">
            <input
              type="email"
              placeholder="Subscribe to newsletter"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
            <button className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-6 py-2 text-sm font-medium text-white transition hover:bg-gray-800">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
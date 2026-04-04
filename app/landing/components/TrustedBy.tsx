import { trustedCompanies } from "../data";

export const TrustedBy = () => {
  return (
    <section className="py-16 border-y border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-gray-500 mb-8">
          Trusted by innovative companies worldwide
        </p>
        <div className="flex flex-wrap justify-center gap-12 items-center">
          {trustedCompanies.map((company, i) => (
            <div
              key={i}
              className="text-xl font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              {company}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
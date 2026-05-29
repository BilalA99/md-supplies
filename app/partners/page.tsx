import type { Metadata } from 'next'
import Link from 'next/link'
import { WholesalePricing } from '@/components/home/WholesalePricing'

export const metadata: Metadata = {
  title: 'Partners | MD Supplies',
  description: 'Our network of trusted medical supply brands and business partners.',
}

const BRAND_PARTNERS = [
  { name: 'Medline', description: 'Leading manufacturer of medical supplies and equipment.', vendorSlug: 'medline' },
  { name: 'Dynarex', description: 'Dependable general medical products for healthcare providers.', vendorSlug: 'dynarex' },
  { name: 'McKesson', description: 'Comprehensive healthcare supply and distribution solutions.', vendorSlug: 'mckesson' },
  { name: 'Cardinal Health', description: 'Surgical and exam products trusted by clinicians worldwide.', vendorSlug: 'cardinal-health' },
  { name: 'Covidien', description: 'Advanced medical devices and disposables for patient care.', vendorSlug: 'covidien' },
  { name: 'BD Medical', description: 'Syringes, needles, and infusion products with global reach.', vendorSlug: 'bd-medical' },
]

const BUSINESS_PARTNERS = [
  {
    name: 'HealthTrust Performance Group',
    description: 'Group purchasing organization providing access to national contracts and pricing programs for healthcare facilities.',
    offering: 'GPO contracts & pricing',
  },
  {
    name: 'Premier Inc.',
    description: 'A leading healthcare performance improvement company helping providers achieve better outcomes at lower costs.',
    offering: 'Supply chain optimization',
  },
  {
    name: 'Vizient',
    description: 'The largest member-driven healthcare performance improvement company in the United States.',
    offering: 'Contracts & analytics',
  },
  {
    name: 'MedAssets',
    description: 'Comprehensive revenue cycle management and spend management services for healthcare organizations.',
    offering: 'Revenue & spend management',
  },
]

export default function PartnersPage() {
  return (
    <main>
      {/* Hero */}
      <section className="w-full bg-neutral-100">
        <div className="max-w-360 mx-auto px-4 sm:px-8 lg:px-14 pt-16 md:pt-20 pb-12 md:pb-16">
          <p className="text-teal-500 text-[13px] sm:text-[15px] font-semibold tracking-[0.75px] uppercase mb-4">
            Our Network
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h1 className="text-[40px] sm:text-[50px] font-semibold text-navy-900 leading-[1.1] tracking-tight">
              Our Partners
            </h1>
            <p className="text-gray-500 text-[15px] leading-[1.65] max-w-[460px]">
              We work with the most trusted names in medical supplies and healthcare distribution to bring you quality products at wholesale prices.
            </p>
          </div>
        </div>
      </section>

      {/* Trusted Brands */}
      <section className="w-full bg-white border-t border-gray-100">
        <div className="max-w-360 mx-auto px-4 sm:px-8 lg:px-14 py-16 md:py-20">
          <h2 className="text-[28px] font-semibold text-navy-900 tracking-[0.56px] mb-3">
            Trusted Brands
          </h2>
          <p className="text-gray-500 text-[15px] mb-10 max-w-[560px]">
            We carry products from the most reputable manufacturers in the medical supply industry.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BRAND_PARTNERS.map(({ name, description, vendorSlug }) => (
              <div
                key={name}
                className="border border-gray-200 p-6 flex flex-col gap-4"
              >
                <div className="h-[48px] flex items-center">
                  <span className="text-navy-900 text-[22px] font-bold tracking-tight">{name}</span>
                </div>
                <p className="text-gray-500 text-[14px] leading-6 flex-1">{description}</p>
                <Link
                  href={`/brands/${vendorSlug}`}
                  className="text-teal-500 text-[14px] font-semibold hover:text-navy-900 transition-colors w-fit"
                >
                  Shop {name} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Partners */}
      <section className="w-full bg-neutral-50 border-t border-gray-100">
        <div className="max-w-360 mx-auto px-4 sm:px-8 lg:px-14 py-16 md:py-20">
          <h2 className="text-[28px] font-semibold text-navy-900 tracking-[0.56px] mb-3">
            Business Partners &amp; Distributors
          </h2>
          <p className="text-gray-500 text-[15px] mb-10 max-w-[560px]">
            We collaborate with leading healthcare organizations to expand access to quality medical supplies.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BUSINESS_PARTNERS.map(({ name, description, offering }) => (
              <div key={name} className="bg-white border border-gray-200 p-6 flex flex-col gap-3">
                <span className="text-navy-900 text-[18px] font-semibold">{name}</span>
                <span className="bg-teal-50 text-teal-700 text-[11px] font-semibold px-2 py-0.5 border border-teal-200 uppercase tracking-[0.22px] w-fit">
                  {offering}
                </span>
                <p className="text-gray-500 text-[14px] leading-6">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Become a Partner CTA */}
      <section className="w-full bg-teal-500">
        <div className="max-w-360 mx-auto px-4 sm:px-8 lg:px-14 py-14 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-white text-[24px] sm:text-[28px] font-semibold tracking-[0.56px]">
              Interested in partnering with MD Supplies?
            </h2>
            <p className="text-white/80 text-[15px] mt-2">
              Let us know how we can work together to serve the healthcare community.
            </p>
          </div>
          <Link
            href="/b2b"
            className="shrink-0 bg-white text-teal-500 text-[15px] font-semibold px-8 py-3.5 hover:bg-teal-50 transition-colors whitespace-nowrap"
          >
            Contact Us
          </Link>
        </div>
      </section>

      <WholesalePricing />
    </main>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { INDUSTRIES } from '@/lib/industries'
import { WholesalePricing } from '@/components/home/WholesalePricing'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Shop by Industry | MD Supplies',
  description: 'Medical supplies curated for your specialty — urgent care, EMS, pharmacy, physical therapy, and more.',
}

export default function IndustriesPage() {
  return (
    <main>
      <section className="w-full bg-neutral-100">
        <div className="max-w-360 mx-auto px-4 sm:px-8 lg:px-14 pt-16 md:pt-20 pb-12 md:pb-16">
          <p className="text-teal-500 text-[13px] sm:text-[15px] font-semibold tracking-[0.75px] uppercase mb-4">
            Shop by Specialty
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h1 className="text-[40px] sm:text-[50px] font-semibold text-navy-900 leading-[1.1] tracking-tight">
              Industries We Serve
            </h1>
            <p className="text-gray-500 text-[15px] leading-[1.65] max-w-[420px]">
              Medical supplies curated for your specialty — from urgent care to physical therapy.
            </p>
          </div>
        </div>
      </section>

      <section className="w-full bg-neutral-100">
        <div className="max-w-360 mx-auto px-4 sm:px-8 lg:px-14 pb-20 md:pb-24">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {INDUSTRIES.map(({ name, slug, image, description }) => (
              <Link
                key={slug}
                href={`/industries/${slug}`}
                className="group relative overflow-hidden aspect-[314/390]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/65" />
                <div className="absolute bottom-5 left-5 right-5">
                  <span className="text-white text-[20px] font-semibold tracking-[0.4px] drop-shadow-sm block">
                    {name}
                  </span>
                  <span className="text-white/70 text-[13px] mt-1 line-clamp-2 hidden sm:block">
                    {description}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <WholesalePricing />
    </main>
  )
}

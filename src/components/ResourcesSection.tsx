import Image from "next/image";
import { ArrowLink } from "@/components/resources/ArrowLink";
import { cn } from "@/lib/utils";

// Layout, type and hover behaviour follow 7shifts' "Free resources" section
// (docs/research/components/ResourcesSection.spec.md). sm/md/lg are 7shifts' breakpoints (567 / 810 / 1024px).

type Resource = {
  tag: string;
  tagClassName: string;
  cover: string;
  coverAlt: string;
  title: string;
  body: string;
  linkLabel: string;
  href: string;
};

const HEADING = "Free resources";
const VIEW_ALL = { label: "View all research", href: "#resources" } as const;

const RESOURCES: readonly Resource[] = [
  {
    tag: "Playbook",
    tagClassName: "bg-lavender",
    cover: "/images/covers/playbook.webp",
    coverAlt: "Cover of The GEO Playbook 2026",
    title: "The GEO Playbook 2026",
    body: "Field-tested tactics for getting pharma brands cited accurately in AI answers, from source priorities to GEO in MLR.",
    linkLabel: "Download free",
    href: "/research/geo-playbook-2026",
  },
  {
    tag: "Index",
    tagClassName: "bg-lime",
    cover: "/images/covers/index.webp",
    coverAlt: "Cover of the Aeon Index: pharma brands ranked in AI answers",
    title: "The Aeon Index",
    body: "The first public ranking of pharma brand reputation in AI answers. Free to read, no login required.",
    linkLabel: "See the ranking",
    href: "/aeon-index",
  },
  {
    tag: "Guide",
    tagClassName: "bg-periwinkle",
    cover: "/images/covers/guide.webp",
    coverAlt: "Cover of GEO for pharma: the guide",
    title: "GEO for pharma: the guide",
    body: "What generative engine optimization means for Rx, OTC and biotech brands, and how it fits your MLR process.",
    linkLabel: "Read the guide",
    href: "/research/geo-for-pharma",
  },
];

/** Rendered cover width: 3 × 386.66px at ≥1200, a third of the padded viewport at 810–1199, full width below. */
const COVER_SIZES = "(min-width: 1200px) 387px, (min-width: 810px) calc((100vw - 80px) / 3), calc(100vw - 40px)";

export function ResourcesSection() {
  return (
    <section
      id="resources"
      data-section="resources"
      aria-labelledby="resources-heading"
      className="-mt-[20px] -mb-[100px] bg-white px-[20px] pt-[80px] pb-[100px]"
    >
      {/*
        7shifts: `flex justify-between` + `max-sm:w-1/2` on the link column. "View all research" (155px, one line)
        is longer than "View more", so the heading column shrinks instead (grow basis-0 → "Free / resources" on
        phones) and the row may wrap on very narrow screens (<360px) rather than overflow.
      */}
      <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-y-2">
        <div className="flex grow basis-0 flex-col justify-center">
          <h2 id="resources-heading" className="font-display text-[40px] leading-10 font-medium">
            {HEADING}
          </h2>
        </div>
        <div className="flex flex-col justify-center">
          <ArrowLink href={VIEW_ALL.href}>{VIEW_ALL.label}</ArrowLink>
        </div>
      </div>

      <div className="mx-auto mt-[20px] grid max-w-[1200px] grid-cols-1 gap-x-[20px] md:grid-cols-3">
        {RESOURCES.map((resource) => (
          <article key={resource.href} className="col-span-1 mb-[50px]">
            <Image
              src={resource.cover}
              alt={resource.coverAlt}
              width={1200}
              height={671}
              sizes={COVER_SIZES}
              className="mb-4 rounded-[10px] object-cover md:max-h-[180px] lg:max-h-[200px]"
            />
            <div
              className={cn(
                "w-fit rounded-[20px] px-[20px] py-[9px] font-display text-[16px] leading-6 font-medium",
                resource.tagClassName,
              )}
            >
              {resource.tag}
            </div>
            <h3 className="py-[20px] font-display text-[18px] leading-none font-medium">{resource.title}</h3>
            <p className="text-[18px] leading-[1.5em]">{resource.body}</p>
            <ArrowLink href={resource.href} srContext={resource.title}>
              {resource.linkLabel}
            </ArrowLink>
          </article>
        ))}
      </div>
    </section>
  );
}

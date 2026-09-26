import { Globe } from "lucide-react";
import { HERO_CONTENT } from "@/components/hero/hero.content";
import { PillButton, START_HREF, WALKTHROUGH_HREF } from "@/components/ui/pill-button";

// Onboarding Screen 1 in the hero: one input, one button. A plain GET form (no JS): submitting opens
// /start?website=<value>, which normalises the domain. ≥567px the button sits inside the rounded-full field;
// below that the input and button stack full width.

const { form } = HERO_CONTENT;

export function HeroForm() {
  return (
    <div className="mx-auto w-full max-w-[480px]">
      <form
        action={START_HREF}
        method="get"
        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-1 sm:rounded-full sm:border sm:border-oat sm:bg-white sm:p-1 sm:shadow-[0_1px_2px_rgba(20,21,21,0.04),0_6px_20px_-8px_rgba(20,21,21,0.14)] sm:transition-[border-color,box-shadow] sm:duration-150 sm:has-[input:focus-visible]:border-royal sm:has-[input:focus-visible]:shadow-[0_0_0_4px_rgba(69,112,255,0.16)]"
      >
        <label htmlFor="hero-website" className="sr-only">
          {form.label}
        </label>
        <div className="relative min-w-0 flex-1">
          <Globe aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-stone" />
          <input
            id="hero-website"
            name={form.param}
            type="text"
            inputMode="url"
            autoComplete="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            required
            placeholder={form.placeholder}
            className="h-12 w-full rounded-full border border-oat bg-white pr-4 pl-11 font-sans text-[16px] leading-6 text-black transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-taupe focus-visible:border-royal focus-visible:shadow-[0_0_0_4px_rgba(69,112,255,0.16)] sm:border-0 sm:bg-transparent sm:pl-10 sm:focus-visible:shadow-none"
          />
        </div>
        <PillButton type="submit" className="w-full px-5 sm:w-auto">
          {form.submit}
        </PillButton>
      </form>

      <p className="mt-3 flex flex-wrap items-center justify-center gap-x-2 text-center text-[11px] leading-[1.5em] text-stone">
        <span>{form.micro}</span>
        <a
          href={WALKTHROUGH_HREF}
          className="inline-flex min-h-6 items-center rounded-sm text-[12px] font-medium text-black underline decoration-oat underline-offset-[3px] transition-colors duration-150 hover:decoration-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal"
        >
          {form.walkthrough}
        </a>
      </p>
    </div>
  );
}

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

// Drafts (content_md) and full AI answers are Markdown, with GFM tables.
const components: Components = {
  h1: ({ children }) => <h2 className="mt-8 mb-3 font-display text-[24px] leading-tight font-medium first:mt-0">{children}</h2>,
  h2: ({ children }) => <h2 className="mt-8 mb-3 font-display text-[22px] leading-tight font-medium first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-6 mb-2 font-display text-[18px] leading-tight font-medium first:mt-0">{children}</h3>,
  h4: ({ children }) => <h4 className="mt-5 mb-2 text-[16px] font-semibold first:mt-0">{children}</h4>,
  p: ({ children }) => <p className="my-3 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="my-3 list-disc space-y-1.5 pl-5 marker:text-taupe">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-1.5 pl-5 marker:text-taupe">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-royal-dark underline underline-offset-3">
      {children}
    </a>
  ),
  blockquote: ({ children }) => <blockquote className="my-4 border-l-3 border-oat pl-4 text-graphite">{children}</blockquote>,
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-oat/70">
      <table className="w-full border-collapse text-left text-[14px]">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="bg-offwhite px-3 py-2 font-medium">{children}</th>,
  td: ({ children }) => <td className="border-t border-oat/60 px-3 py-2 align-top">{children}</td>,
  hr: () => <hr className="my-6 border-oat" />,
  code: ({ children }) => <code className="rounded bg-sand px-1 py-0.5 text-[0.9em]">{children}</code>,
};

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("text-[16px] leading-[1.65] text-black", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import matter from "gray-matter";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  // 解析 frontmatter，只渲染正文内容
  const { content: markdownContent } = matter(content);

  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // 自定义标题样式
          h1: ({ children }) => (
            <h1 className="mb-4 mt-6 text-2xl font-bold text-neutral-900">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-5 text-xl font-bold text-neutral-900">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 text-lg font-semibold text-neutral-900">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-2 mt-3 text-base font-semibold text-neutral-900">{children}</h4>
          ),
          // 段落样式
          p: ({ children }) => <p className="mb-4 leading-relaxed text-neutral-700">{children}</p>,
          // 链接样式
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {children}
            </a>
          ),
          // 代码块样式
          pre: ({ children }) => (
            <pre className="mb-4 overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-900 p-4 text-sm text-white">
              {children}
            </pre>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            return isInline ? (
              <code
                className="rounded bg-neutral-100 px-1.5 py-0.5 text-sm text-red-600"
                {...props}
              >
                {children}
              </code>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // 列表样式
          ul: ({ children }) => (
            <ul className="mb-4 list-disc space-y-1 pl-6 text-neutral-700">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-decimal space-y-1 pl-6 text-neutral-700">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          // 引用样式
          blockquote: ({ children }) => (
            <blockquote className="mb-4 border-l-4 border-neutral-300 pl-4 italic text-neutral-600">
              {children}
            </blockquote>
          ),
          // 表格样式
          table: ({ children }) => (
            <div className="mb-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-neutral-50">{children}</thead>,
          th: ({ children }) => (
            <th className="px-4 py-2 text-left text-sm font-semibold text-neutral-900">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="whitespace-nowrap px-4 py-2 text-sm text-neutral-700">{children}</td>
          ),
          // 水平线样式
          hr: () => <hr className="my-6 border-neutral-200" />,
          // 图片样式
          img: ({ src, alt }) => <img src={src} alt={alt} className="mb-4 max-w-full rounded-lg" />,
        }}
      >
        {markdownContent}
      </ReactMarkdown>
    </div>
  );
}

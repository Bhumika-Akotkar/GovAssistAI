import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SchemeCard } from './SchemeCard';
import { StepWalkthrough } from './StepWalkthrough';

export function MarkdownRenderer({ content, languageCode = 'en' }) {
  const components = {
    // Custom renderer for code blocks to handle artifacts
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';

      // Handle artifact blocks
      if (!inline && children) {
        const codeContent = String(children).replace(/\n$/, '');

        if (codeContent.startsWith('artifact-scheme-card')) {
          try {
            const jsonStr = codeContent.replace('artifact-scheme-card\n', '');
            return <SchemeCard data={jsonStr} />;
          } catch (e) {
            return <div className="text-red-500 text-xs p-2 bg-red-50 rounded">Failed to render Scheme Card</div>;
          }
        }

        if (codeContent.startsWith('artifact-step-walkthrough')) {
          try {
            const jsonStr = codeContent.replace('artifact-step-walkthrough\n', '');
            return <StepWalkthrough data={jsonStr} />;
          } catch (e) {
            return <div className="text-red-500 text-xs p-2 bg-red-50 rounded">Failed to render Walkthrough</div>;
          }
        }
      }

      // Regular code blocks
      if (!inline) {
        return (
          <code
            className={`block bg-sand px-3 py-2 rounded text-sm font-mono overflow-x-auto ${className || ''}`}
            {...props}
          >
            {children}
          </code>
        );
      }

      // Inline code
      return (
        <code
          className={`bg-sand px-1.5 py-0.5 rounded text-sm font-mono ${className || ''}`}
          {...props}
        >
          {children}
        </code>
      );
    },

    // Custom renderer for tables
    table({ children }) {
      return (
        <div className="overflow-x-auto my-3">
          <table className="min-w-full border border-line">
            {children}
          </table>
        </div>
      );
    },

    thead({ children }) {
      return <thead className="bg-paper-2">{children}</thead>;
    },

    tbody({ children }) {
      return <tbody>{children}</tbody>;
    },

    tr({ children }) {
      return <tr className="border-b border-line">{children}</tr>;
    },

    th({ children }) {
      return (
        <th className="px-4 py-2 text-left text-sm font-semibold text-ink border-r border-line last:border-r-0">
          {children}
        </th>
      );
    },

    td({ children }) {
      return (
        <td className="px-4 py-2 text-sm text-ink-2 border-r border-line last:border-r-0">
          {children}
        </td>
      );
    },

    // Custom renderer for blockquotes
    blockquote({ children }) {
      return (
        <blockquote className="border-l-4 border-forest pl-4 py-2 my-3 bg-sand/50 rounded-r">
          {children}
        </blockquote>
      );
    },

    // Custom renderer for headings
    h1({ children }) {
      return <h1 className="text-2xl font-bold text-ink mt-4 mb-2">{children}</h1>;
    },

    h2({ children }) {
      return <h2 className="text-xl font-semibold text-ink mt-3 mb-2">{children}</h2>;
    },

    h3({ children }) {
      return <h3 className="text-lg font-medium text-ink mt-2 mb-1">{children}</h3>;
    },

    // Custom renderer for lists
    ul({ children }) {
      return <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>;
    },

    ol({ children }) {
      return <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>;
    },

    li({ children }) {
      return <li className="text-sm text-ink-2">{children}</li>;
    },

    // Custom renderer for paragraphs
    p({ children }) {
      return <p className="text-sm text-ink-2 my-2 leading-relaxed">{children}</p>;
    },

    // Custom renderer for strong/bold
    strong({ children }) {
      return <strong className="font-semibold text-ink">{children}</strong>;
    },

    // Custom renderer for emphasis/italic
    em({ children }) {
      return <em className="italic text-ink-2">{children}</em>;
    },

    // Custom renderer for links
    a({ href, children }) {
      return (
        <a
          href={href}
          className="text-forest hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    },

    // Custom renderer for horizontal rule
    hr() {
      return <hr className="my-4 border-line" />;
    },
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
      className="markdown-content"
    >
      {content}
    </ReactMarkdown>
  );
}

export default MarkdownRenderer;

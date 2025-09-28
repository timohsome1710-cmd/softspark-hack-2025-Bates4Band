import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface LaTeXRendererProps {
  content: string;
  isInline?: boolean;
}

const LaTeXRenderer = ({ content, isInline = false }: LaTeXRendererProps) => {
  if (!content) return null;

  try {
    if (isInline) {
      return <InlineMath math={content} />;
    } else {
      return <BlockMath math={content} />;
    }
  } catch (error) {
    // If LaTeX parsing fails, show the raw content
    return <span className="text-red-500 text-sm">LaTeX Error: {content}</span>;
  }
};

export default LaTeXRenderer;
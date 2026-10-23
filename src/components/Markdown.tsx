import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/** Renderiza markdown; acepta string o arreglo de líneas (formato de los JSON). */
export default function Markdown({ children }: { children: string | string[] }) {
  const text = Array.isArray(children) ? children.join('\n') : children
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{ a: (props) => <a {...props} target="_blank" rel="noreferrer" /> }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}

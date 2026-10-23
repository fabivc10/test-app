import { useState, type ReactNode } from 'react'

/** Botón con confirmación en línea (sin diálogos del navegador). */
export default function ConfirmButton({
  children,
  question,
  onConfirm,
  className = 'btn',
}: {
  children: ReactNode
  question: string
  onConfirm: () => void
  className?: string
}) {
  const [asking, setAsking] = useState(false)
  if (!asking)
    return (
      <button className={className} onClick={() => setAsking(true)}>
        {children}
      </button>
    )
  return (
    <span className="confirm">
      <span>{question}</span>
      <button
        className="btn danger small"
        onClick={() => {
          setAsking(false)
          onConfirm()
        }}
      >
        Sí
      </button>
      <button className="btn small" onClick={() => setAsking(false)}>
        No
      </button>
    </span>
  )
}

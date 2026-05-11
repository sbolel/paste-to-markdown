import { useMemo } from 'react'
import type { ReactElement } from 'react'

interface MarkdownHighlighterProps {
  markdown: string
  className?: string
}

interface Token {
  type: string
  content: string
  index: number
}

const tokenizeMarkdown = (text: string): Token[] => {
  const tokens: Token[] = []

  const patterns = [
    { type: 'heading', regex: /^(#{1,6})\s+(.*)$/gm },
    { type: 'code-block', regex: /^```[\s\S]*?```$/gm },
    { type: 'inline-code', regex: /`([^`]+)`/g },
    { type: 'bold', regex: /\*\*([^*]+)\*\*|__([^_]+)__/g },
    { type: 'italic', regex: /\*([^*]+)\*|_([^_]+)_/g },
    { type: 'strikethrough', regex: /~~([^~]+)~~/g },
    { type: 'link', regex: /\[([^\]]+)\]\(([^)]+)\)/g },
    { type: 'image', regex: /!\[([^\]]*)\]\(([^)]+)\)/g },
    { type: 'blockquote', regex: /^>\s+.*$/gm },
    { type: 'unordered-list', regex: /^(\s*)([-*+])\s+(.*)$/gm },
    { type: 'ordered-list', regex: /^(\s*)(\d+\.)\s+(.*)$/gm },
    { type: 'task-list', regex: /^(\s*)([-*+])\s+\[([ xX])\]\s+(.*)$/gm },
    { type: 'horizontal-rule', regex: /^(---|\*\*\*|___)$/gm },
    { type: 'table-separator', regex: /^\|?\s*[-:]+\s*(\|\s*[-:]+\s*)+\|?\s*$/gm },
    { type: 'table-row', regex: /^\|.*\|.*$/gm },
    { type: 'yaml-frontmatter', regex: /^---\n[\s\S]*?\n---$/gm },
    { type: 'footnote-ref', regex: /\[\^(\d+)\]/g },
    { type: 'footnote-def', regex: /^\[\^(\d+)\]:\s+(.*)$/gm },
  ]

  const lines = text.split('\n')
  
  lines.forEach((line, lineIndex) => {
    let lineProcessed = false
    
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags.replace('g', ''))
      const match = line.match(regex)
      
      if (match && match.index === 0) {
        tokens.push({
          type: pattern.type,
          content: line,
          index: lineIndex
        })
        lineProcessed = true
        break
      }
    }
    
    if (!lineProcessed) {
      tokens.push({
        type: 'text',
        content: line,
        index: lineIndex
      })
    }
  })

  return tokens
}

const highlightInlineElements = (text: string, lineType: string): ReactElement[] => {
  const elements: ReactElement[] = []
  let lastIndex = 0
  let keyIndex = 0

  const inlinePatterns = [
    { type: 'code', regex: /`([^`]+)`/g, className: 'text-amber-600 bg-amber-50 px-1 rounded' },
    { type: 'bold', regex: /\*\*([^*]+)\*\*/g, className: 'text-purple-700 font-semibold' },
    { type: 'bold-alt', regex: /__([^_]+)__/g, className: 'text-purple-700 font-semibold' },
    { type: 'italic', regex: /\*([^*]+)\*/g, className: 'text-blue-600 italic' },
    { type: 'italic-alt', regex: /_([^_]+)_/g, className: 'text-blue-600 italic' },
    { type: 'strikethrough', regex: /~~([^~]+)~~/g, className: 'text-red-600 line-through' },
    { type: 'link', regex: /\[([^\]]+)\]\(([^)]+)\)/g, className: 'text-cyan-600' },
    { type: 'image', regex: /!\[([^\]]*)\]\(([^)]+)\)/g, className: 'text-green-600' },
    { type: 'footnote', regex: /\[\^(\d+)\]/g, className: 'text-orange-600 font-medium' },
  ]

  const allMatches: Array<{ index: number; length: number; element: ReactElement }> = []

  inlinePatterns.forEach(pattern => {
    const regex = new RegExp(pattern.regex)
    let match

    const tempText = text
    
    while ((match = regex.exec(tempText)) !== null) {
      const matchIndex = match.index
      
      if (pattern.type === 'link') {
        allMatches.push({
          index: matchIndex,
          length: match[0].length,
          element: (
            <span key={`inline-${keyIndex++}`} className={pattern.className}>
              {'['}
              <span className="underline">{match[1]}</span>
              {']('}
              <span className="opacity-70">{match[2]}</span>
              {')'}
            </span>
          )
        })
      } else if (pattern.type === 'image') {
        allMatches.push({
          index: matchIndex,
          length: match[0].length,
          element: (
            <span key={`inline-${keyIndex++}`} className={pattern.className}>
              {'!['}
              <span className="font-medium">{match[1] || 'image'}</span>
              {']('}
              <span className="opacity-70">{match[2]}</span>
              {')'}
            </span>
          )
        })
      } else {
        allMatches.push({
          index: matchIndex,
          length: match[0].length,
          element: (
            <span key={`inline-${keyIndex++}`} className={pattern.className}>
              {match[0]}
            </span>
          )
        })
      }
    }
  })

  allMatches.sort((a, b) => a.index - b.index)

  const validMatches: Array<{ index: number; length: number; element: ReactElement }> = []
  let lastEnd = 0

  allMatches.forEach(match => {
    if (match.index >= lastEnd) {
      validMatches.push(match)
      lastEnd = match.index + match.length
    }
  })

  lastIndex = 0
  validMatches.forEach(match => {
    if (match.index > lastIndex) {
      elements.push(
        <span key={`text-${keyIndex++}`}>
          {text.substring(lastIndex, match.index)}
        </span>
      )
    }
    elements.push(match.element)
    lastIndex = match.index + match.length
  })

  if (lastIndex < text.length) {
    elements.push(
      <span key={`text-${keyIndex++}`}>
        {text.substring(lastIndex)}
      </span>
    )
  }

  return elements.length > 0 ? elements : [<span key="plain">{text}</span>]
}

const renderToken = (token: Token, index: number): ReactElement => {
  const { type, content } = token

  switch (type) {
    case 'heading': {
      const match = content.match(/^(#{1,6})\s+(.*)$/)
      if (match) {
        return (
          <div key={index} className="leading-relaxed">
            <span className="text-indigo-600 font-bold">{match[1]}</span>
            <span className="text-foreground/90"> </span>
            <span className="text-foreground font-semibold">{highlightInlineElements(match[2], 'heading')}</span>
          </div>
        )
      }
      break
    }

    case 'code-block': {
      const lines = content.split('\n')
      const langMatch = lines[0].match(/^```(\w+)?/)
      const lang = langMatch?.[1] || ''
      
      return (
        <div key={index} className="bg-slate-100 border border-slate-300 rounded-md my-1">
          <div className="border-b border-slate-300 px-3 py-1 bg-slate-200">
            <span className="text-slate-600 font-mono text-xs">```</span>
            {lang && <span className="text-emerald-700 font-mono text-xs font-medium">{lang}</span>}
          </div>
          <div className="px-3 py-2">
            {lines.slice(1, -1).map((line, i) => (
              <div key={i} className="text-slate-800 font-mono text-sm leading-relaxed">
                {line || '\u00A0'}
              </div>
            ))}
          </div>
          <div className="border-t border-slate-300 px-3 py-1 bg-slate-200">
            <span className="text-slate-600 font-mono text-xs">```</span>
          </div>
        </div>
      )
    }

    case 'blockquote': {
      const text = content.replace(/^>\s+/, '')
      return (
        <div key={index} className="leading-relaxed">
          <span className="text-slate-400 font-bold">&gt; </span>
          <span className="text-slate-600 italic">{highlightInlineElements(text, 'blockquote')}</span>
        </div>
      )
    }

    case 'unordered-list': {
      const match = content.match(/^(\s*)([-*+])\s+(.*)$/)
      if (match) {
        const indent = match[1].length
        return (
          <div key={index} className="leading-relaxed" style={{ paddingLeft: `${indent * 0.5}rem` }}>
            <span className="text-rose-600 font-bold">{match[2]}</span>
            <span> </span>
            <span className="text-foreground/90">{highlightInlineElements(match[3], 'list')}</span>
          </div>
        )
      }
      break
    }

    case 'ordered-list': {
      const match = content.match(/^(\s*)(\d+\.)\s+(.*)$/)
      if (match) {
        const indent = match[1].length
        return (
          <div key={index} className="leading-relaxed" style={{ paddingLeft: `${indent * 0.5}rem` }}>
            <span className="text-rose-600 font-bold">{match[2]}</span>
            <span> </span>
            <span className="text-foreground/90">{highlightInlineElements(match[3], 'list')}</span>
          </div>
        )
      }
      break
    }

    case 'task-list': {
      const match = content.match(/^(\s*)([-*+])\s+\[([ xX])\]\s+(.*)$/)
      if (match) {
        const indent = match[1].length
        const checked = match[3].toLowerCase() === 'x'
        return (
          <div key={index} className="leading-relaxed" style={{ paddingLeft: `${indent * 0.5}rem` }}>
            <span className="text-rose-600 font-bold">{match[2]}</span>
            <span> [</span>
            <span className={checked ? 'text-green-600 font-bold' : 'text-slate-400'}>{match[3]}</span>
            <span>] </span>
            <span className="text-foreground/90">{highlightInlineElements(match[4], 'list')}</span>
          </div>
        )
      }
      break
    }

    case 'horizontal-rule':
      return (
        <div key={index} className="leading-relaxed">
          <span className="text-slate-400 font-bold">{content}</span>
        </div>
      )

    case 'table-separator':
      return (
        <div key={index} className="leading-relaxed">
          <span className="text-teal-600 font-mono">{content}</span>
        </div>
      )

    case 'table-row':
      return (
        <div key={index} className="leading-relaxed">
          <span className="text-teal-700 font-mono">{content}</span>
        </div>
      )

    case 'yaml-frontmatter':
      return (
        <div key={index} className="bg-violet-50 border border-violet-300 rounded-md my-1 px-3 py-2">
          {content.split('\n').map((line, i) => (
            <div key={i} className="text-violet-700 font-mono text-sm leading-relaxed">
              {line || '\u00A0'}
            </div>
          ))}
        </div>
      )

    case 'footnote-def': {
      const match = content.match(/^\[\^(\d+)\]:\s+(.*)$/)
      if (match) {
        return (
          <div key={index} className="leading-relaxed">
            <span className="text-orange-600 font-medium">[^{match[1]}]</span>
            <span className="text-foreground/70">: {highlightInlineElements(match[2], 'footnote')}</span>
          </div>
        )
      }
      break
    }

    default:
      return (
        <div key={index} className="leading-relaxed">
          <span className="text-foreground/90">{highlightInlineElements(content, 'text')}</span>
        </div>
      )
  }

  return (
    <div key={index} className="leading-relaxed">
      <span className="text-foreground/90">{content}</span>
    </div>
  )
}

export function MarkdownHighlighter({ markdown, className = '' }: MarkdownHighlighterProps) {
  const highlighted = useMemo(() => {
    if (!markdown) return null
    
    const tokens = tokenizeMarkdown(markdown)
    return tokens.map((token, index) => renderToken(token, index))
  }, [markdown])

  return (
    <div className={`font-mono text-sm whitespace-pre-wrap ${className}`}>
      {highlighted}
    </div>
  )
}

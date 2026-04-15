import { useState, useEffect } from 'react'
import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ClipboardText, Copy, ArrowRight } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
})
turndownService.use(gfm)

function App() {
  const [htmlInput, setHtmlInput] = useState('')
  const [markdownOutput, setMarkdownOutput] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (htmlInput.trim()) {
      try {
        const markdown = turndownService.turndown(htmlInput)
        setMarkdownOutput(markdown)
      } catch (error) {
        setMarkdownOutput('Error converting HTML to Markdown')
      }
    } else {
      setMarkdownOutput('')
    }
  }, [htmlInput])

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setHtmlInput(text)
      toast.success('Content pasted successfully')
    } catch (error) {
      toast.error('Failed to read clipboard. Please grant permission.')
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownOutput)
      toast.success('Markdown copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleInputPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain')
    if (pastedText) {
      e.preventDefault()
      setHtmlInput(pastedText)
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8 text-center md:mb-12"
        >
          <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl" style={{ letterSpacing: '-0.02em' }}>
            Paste to Markdown
          </h1>
          <p className="text-muted-foreground text-base md:text-lg" style={{ lineHeight: '1.6' }}>
            Convert any HTML content into clean, validated Markdown
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="flex h-full flex-col p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <Label 
                  htmlFor="html-input" 
                  className="text-sm font-medium uppercase tracking-wider"
                  style={{ letterSpacing: '0.05em' }}
                >
                  HTML Input
                </Label>
                {isMobile && (
                  <Button
                    onClick={handlePaste}
                    size="sm"
                    variant="outline"
                    className="gap-2 transition-transform hover:scale-105 active:scale-95"
                  >
                    <ClipboardText size={16} />
                    Paste
                  </Button>
                )}
              </div>
              <Textarea
                id="html-input"
                value={htmlInput}
                onChange={(e) => setHtmlInput(e.target.value)}
                onPaste={handleInputPaste}
                placeholder="Paste your HTML content here (Ctrl/Cmd+V)..."
                className="min-h-[400px] flex-1 resize-none font-mono text-sm transition-all focus:ring-2 focus:ring-accent"
                style={{ lineHeight: '1.5' }}
              />
            </Card>
          </motion.div>

          <div className="hidden items-center justify-center md:flex">
            <ArrowRight size={32} className="text-muted-foreground" weight="bold" />
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="md:col-start-2"
          >
            <Card className="flex h-full flex-col p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <Label 
                  htmlFor="markdown-output" 
                  className="text-sm font-medium uppercase tracking-wider"
                  style={{ letterSpacing: '0.05em' }}
                >
                  Markdown Output
                </Label>
                <Button
                  onClick={handleCopy}
                  disabled={!markdownOutput}
                  size="sm"
                  className="gap-2 bg-accent text-accent-foreground transition-transform hover:bg-accent/90 hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Copy size={16} />
                  Copy
                </Button>
              </div>
              <Textarea
                id="markdown-output"
                value={markdownOutput}
                readOnly
                placeholder="Converted Markdown will appear here..."
                className="min-h-[400px] flex-1 resize-none bg-secondary/50 font-mono text-sm"
                style={{ lineHeight: '1.5' }}
              />
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default App
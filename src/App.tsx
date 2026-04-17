import { useState, useEffect } from 'react'
import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ClipboardText, Copy } from '@phosphor-icons/react'
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

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        return
      }
      
      const htmlContent = e.clipboardData?.getData('text/html')
      const plainText = e.clipboardData?.getData('text/plain')
      const content = htmlContent || plainText
      
      if (content) {
        e.preventDefault()
        setHtmlInput(content)
        toast.success('Content pasted successfully')
      }
    }

    document.addEventListener('paste', handleGlobalPaste)
    return () => document.removeEventListener('paste', handleGlobalPaste)
  }, [])

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

        {!markdownOutput ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-2xl"
          >
            <Card className="p-8 shadow-sm md:p-12">
              <div className="mb-8 flex justify-center">
                <div className="rounded-full bg-accent/20 p-6">
                  <ClipboardText size={48} className="text-accent" weight="duotone" />
                </div>
              </div>
              <h2 className="mb-4 text-center text-xl font-bold md:text-2xl">
                Ready to Convert
              </h2>
              <p className="mb-8 text-center text-muted-foreground" style={{ lineHeight: '1.6' }}>
                Paste your HTML content to get started. The converted Markdown will appear instantly.
              </p>
              <div className="flex flex-col gap-4">
                <Button
                  onClick={handlePaste}
                  size="lg"
                  className="gap-3 bg-accent text-accent-foreground transition-transform hover:bg-accent/90 hover:scale-105 active:scale-95"
                >
                  <ClipboardText size={20} weight="bold" />
                  Paste from Clipboard
                </Button>
                <div className="relative">
                  <Separator className="my-4" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground uppercase tracking-wider">
                    or
                  </span>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Press <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">Ctrl+V</kbd> 
                  {' '}or{' '}
                  <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">⌘+V</kbd> anywhere on this page
                </p>
              </div>
            </Card>
            <textarea
              value={htmlInput}
              onChange={(e) => setHtmlInput(e.target.value)}
              onPaste={handleInputPaste}
              className="sr-only"
              autoFocus
              aria-label="HTML input"
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-4xl"
          >
            <Card className="bg-card text-card-foreground gap-6 rounded-xl border flex flex-col p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <Label 
                  htmlFor="markdown-output" 
                  className="text-sm font-medium uppercase tracking-wider"
                  style={{ letterSpacing: '0.05em' }}
                >
                  Markdown Output
                </Label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setHtmlInput('')
                      setMarkdownOutput('')
                    }}
                    size="sm"
                    variant="outline"
                    className="gap-2 transition-transform hover:scale-105 active:scale-95"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handleCopy}
                    size="sm"
                    className="gap-2 bg-accent text-accent-foreground transition-transform hover:bg-accent/90 hover:scale-105 active:scale-95"
                  >
                    <Copy size={16} />
                    Copy
                  </Button>
                </div>
              </div>
              <Textarea
                id="markdown-output"
                value={markdownOutput}
                readOnly
                className="min-h-[500px] flex-1 resize-none bg-secondary/50 font-mono text-sm"
                style={{ lineHeight: '1.5' }}
              />
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default App
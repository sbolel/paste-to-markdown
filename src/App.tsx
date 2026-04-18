import { useState, useEffect, useMemo } from 'react'
import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'
import { marked } from 'marked'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ClipboardText, Copy, Eye, Code, Download } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useKV } from '@github/spark/hooks'

type MarkdownFlavor = 'github' | 'commonmark' | 'strict' | 'custom'

const isMarkdown = (text: string): boolean => {
  const trimmed = text.trim()
  if (!trimmed) return false
  
  const markdownIndicators = [
    /^#{1,6}\s+/m,
    /\*\*[^*]+\*\*/,
    /\*[^*]+\*/,
    /^\s*[-*+]\s+/m,
    /^\s*\d+\.\s+/m,
    /\[.+\]\(.+\)/,
    /^>\s+/m,
    /^```/m,
    /`[^`]+`/,
    /^\s*\|.+\|/m,
    /__[^_]+__/,
    /_{1}[^_]+_{1}/,
    /~~[^~]+~~/,
  ]
  
  let indicatorCount = 0
  for (const pattern of markdownIndicators) {
    if (pattern.test(trimmed)) {
      indicatorCount++
    }
  }
  
  const hasHtmlTags = /<[^>]+>/.test(trimmed)
  
  return indicatorCount >= 2 && !hasHtmlTags
}

const createTurndownService = (flavor: MarkdownFlavor) => {
  let options: TurndownService.Options = {}
  
  switch (flavor) {
    case 'github':
      options = {
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        bulletListMarker: '-',
        emDelimiter: '_',
        strongDelimiter: '**',
      }
      break
    case 'commonmark':
      options = {
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        bulletListMarker: '-',
        emDelimiter: '*',
        strongDelimiter: '**',
      }
      break
    case 'strict':
      options = {
        headingStyle: 'atx',
        codeBlockStyle: 'indented',
        bulletListMarker: '*',
        emDelimiter: '*',
        strongDelimiter: '**',
      }
      break
    case 'custom':
      options = {
        headingStyle: 'setext',
        codeBlockStyle: 'fenced',
        bulletListMarker: '+',
        emDelimiter: '_',
        strongDelimiter: '__',
      }
      break
  }
  
  const service = new TurndownService(options)
  
  if (flavor === 'github') {
    service.use(gfm)
  }
  
  return service
}

function App() {
  const [htmlInput, setHtmlInput] = useState('')
  const [markdownOutput, setMarkdownOutput] = useState('')
  const [previewMode, setPreviewMode] = useState<'raw' | 'preview'>('raw')
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)
  const [filename, setFilename] = useState('markdown')
  const [markdownFlavor, setMarkdownFlavor] = useKV<MarkdownFlavor>('markdown-flavor', 'github')

  const turndownService = useMemo(() => createTurndownService(markdownFlavor || 'github'), [markdownFlavor])

  const handleFlavorChange = (value: MarkdownFlavor) => {
    setMarkdownFlavor(value)
    const flavorNames: Record<MarkdownFlavor, string> = {
      github: 'GitHub Flavored Markdown',
      commonmark: 'CommonMark',
      strict: 'Strict Markdown',
      custom: 'Custom Style'
    }
    toast.success(`Switched to ${flavorNames[value]}`)
  }

  useEffect(() => {
    if (htmlInput.trim()) {
      try {
        if (isMarkdown(htmlInput)) {
          setMarkdownOutput(htmlInput)
          toast.success('Markdown detected and validated')
        } else {
          const markdown = turndownService.turndown(htmlInput)
          setMarkdownOutput(markdown)
        }
      } catch (error) {
        setMarkdownOutput('Error converting HTML to Markdown')
      }
    } else {
      setMarkdownOutput('')
    }
  }, [htmlInput, turndownService])

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
      if (text) {
        setHtmlInput(text)
        toast.success('Content pasted successfully')
      } else {
        toast.error('No content found in clipboard')
      }
    } catch (error) {
      toast.error('Unable to read clipboard. Please use Ctrl+V or ⌘+V to paste.')
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

  const handleDownload = () => {
    setShowDownloadDialog(true)
  }

  const confirmDownload = () => {
    const sanitizedFilename = filename.trim() || 'markdown'
    const blob = new Blob([markdownOutput], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${sanitizedFilename}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setShowDownloadDialog(false)
    toast.success('Markdown file downloaded')
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
              id="hidden-paste-area"
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
            className="mx-auto max-w-[1400px]"
          >
            <Card className="bg-card text-card-foreground gap-3 rounded-xl border flex flex-col p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Label 
                    htmlFor="markdown-output" 
                    className="text-sm font-medium uppercase tracking-wider"
                    style={{ letterSpacing: '0.05em' }}
                  >
                    Markdown Output
                  </Label>
                  <Select value={markdownFlavor || 'github'} onValueChange={(value) => handleFlavorChange(value as MarkdownFlavor)}>
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="github">GitHub Flavored</SelectItem>
                      <SelectItem value="commonmark">CommonMark</SelectItem>
                      <SelectItem value="strict">Strict Markdown</SelectItem>
                      <SelectItem value="custom">Custom Style</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                    onClick={handleDownload}
                    size="sm"
                    variant="outline"
                    className="gap-2 transition-transform hover:scale-105 active:scale-95"
                  >
                    <Download size={16} />
                    Download
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
              <Tabs value={previewMode} onValueChange={(value) => setPreviewMode(value as 'raw' | 'preview')} className="flex-1 flex flex-col">
                <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                  <TabsTrigger value="raw" className="gap-2">
                    <Code size={16} />
                    Raw Markdown
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="gap-2">
                    <Eye size={16} />
                    Preview
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="raw" className="flex-1 mt-3">
                  <Textarea
                    id="markdown-output"
                    value={markdownOutput}
                    readOnly
                    className="min-h-[600px] flex-1 resize-none bg-secondary/50 font-mono text-sm"
                    style={{ lineHeight: '1.5' }}
                  />
                </TabsContent>
                <TabsContent value="preview" className="flex-1 mt-3">
                  <div 
                    className="min-h-[600px] rounded-md border bg-secondary/50 p-6 prose prose-sm max-w-none overflow-auto"
                    dangerouslySetInnerHTML={{ __html: marked.parse(markdownOutput) as string }}
                  />
                </TabsContent>
              </Tabs>
            </Card>
          </motion.div>
        )}
      </div>

      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Markdown File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filename">Filename</Label>
              <div className="flex gap-2">
                <Input
                  id="filename"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="Enter filename"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      confirmDownload()
                    }
                  }}
                />
                <span className="flex items-center text-sm text-muted-foreground">.md</span>
              </div>
              <p className="text-xs text-muted-foreground">
                The file will be saved as "{filename || 'markdown'}.md"
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDownloadDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDownload}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Download size={16} className="mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App
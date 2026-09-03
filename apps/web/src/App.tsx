import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ClipboardText,
  Copy,
  Eye,
  Code,
  Download,
  Info,
  Sparkle,
  Keyboard,
  BookOpen,
  ArrowCounterClockwise,
  GithubLogo,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CursorSparkles } from "@/components/CursorSparkles";

import type { MarkdownFlavor } from "@paste-to-markdown/core";
import { useMarkdownDocument } from "./hooks/use-markdown-document";
import { copyMarkdown } from "./lib/clipboard";
import { markdownFilename } from "./lib/markdown";
import {
  getMarkdownShortcut,
  applyMarkdownFormatToTextarea,
} from "./lib/markdown-formatting";

const aboutPageHref = `${import.meta.env.BASE_URL}about/`;

function App() {
  const {
    source,
    markdownOutput,
    setMarkdownOutput,
    previewMode,
    setPreviewMode,
    markdownFlavor,
    removeBlankLines,
    detectedExtensions,
    sanitizedPreviewHtml,
    canRestore,
    pendingPreferences,
    importClipboard,
    pasteClipboard,
    handleFlavorChange,
    handleRemoveBlankLinesChange,
    confirmPreferences,
    cancelPreferences,
    clear,
    restore,
  } = useMarkdownDocument();
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [filename, setFilename] = useState("markdown");
  const [showExtensions, setShowExtensions] = useState(false);
  const [selectForManualCopy, setSelectForManualCopy] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const flavorRef = useRef<HTMLButtonElement>(null);
  const spacingRef = useRef<HTMLButtonElement>(null);
  const dialogReturnFocus = useRef<HTMLElement | null>(null);
  const rememberFocus = () => {
    dialogReturnFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
  };
  const restoreDialogFocus = (event: Event) => {
    event.preventDefault();
    const origin = dialogReturnFocus.current;
    if (origin?.isConnected) origin.focus();
    else textareaRef.current?.focus();
  };
  const openShortcuts = () => {
    rememberFocus();
    setShowShortcutsDialog(true);
  };
  const handlePaste = () => {
    void pasteClipboard();
  };
  const handleUndo = restore;
  const handleDownload = () => {
    rememberFocus();
    setShowDownloadDialog(true);
  };

  useEffect(() => {
    const handleGlobalPaste = (event: ClipboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest(
          'input,textarea,[contenteditable="true"],[role="dialog"]',
        )
      )
        return;
      if (!event.clipboardData) return;
      const html = event.clipboardData.getData("text/html");
      const text = event.clipboardData.getData("text/plain");
      const hasImage = Array.from(event.clipboardData.items).some((item) =>
        item.type.startsWith("image/"),
      );
      if (!html && !text && !hasImage) return;
      event.preventDefault();
      importClipboard({ html, text, ...(hasImage ? { hasImage } : {}) });
    };
    document.addEventListener("paste", handleGlobalPaste);
    return () => document.removeEventListener("paste", handleGlobalPaste);
  }, [importClipboard]);

  useEffect(() => {
    if (!selectForManualCopy || previewMode !== "raw") return;
    textareaRef.current?.focus();
    textareaRef.current?.select();
    setSelectForManualCopy(false);
  }, [selectForManualCopy, previewMode]);

  const handleCopy = async () => {
    try {
      await copyMarkdown(markdownOutput);
      toast.success("Markdown copied to clipboard");
    } catch (error) {
      setPreviewMode("raw");
      setSelectForManualCopy(true);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to copy. Select the text and copy it manually.",
      );
    }
  };
  const confirmDownload = () => {
    const url = URL.createObjectURL(
      new Blob([markdownOutput], { type: "text/markdown;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = markdownFilename(filename);
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setShowDownloadDialog(false);
    toast.success("Markdown file downloaded");
  };
  return (
    <>
      <CursorSparkles />
      <div className="min-h-screen px-4 py-8 md:px-8 md:py-12 relative z-10">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8 text-center md:mb-12"
          >
            <h1
              className="mb-3 text-3xl font-bold tracking-tight md:text-4xl"
              style={{ letterSpacing: "-0.02em" }}
            >
              Paste to Markdown
            </h1>
            <p
              className="text-muted-foreground text-base md:text-lg"
              style={{ lineHeight: "1.6" }}
            >
              Convert any HTML content into clean Markdown
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
              <a
                href={aboutPageHref}
                className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-card/60 px-4 py-2 font-medium text-foreground transition-colors hover:border-accent/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                About This Project
              </a>
              <a
                href="https://github.com/sbolel/paste-to-markdown"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View the Paste to Markdown GitHub repository (opens in a new tab)"
                className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-card/60 px-4 py-2 font-medium text-foreground transition-colors hover:border-accent/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <GithubLogo size={18} weight="fill" aria-hidden="true" />
                <span>View on GitHub</span>
              </a>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Built by{" "}
              <a
                className="font-medium text-accent hover:underline"
                href="https://sinanbolel.com/"
              >
                Sinan Bolel
              </a>
              .
            </p>
          </motion.div>

          {source === null ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="mx-auto max-w-2xl"
            >
              <Card className="p-8 shadow-lg backdrop-blur-sm md:p-12 border-primary/20">
                <div className="mb-8 flex justify-center">
                  <div className="rounded-full bg-accent/20 p-6">
                    <ClipboardText
                      size={48}
                      className="text-accent"
                      weight="duotone"
                    />
                  </div>
                </div>
                <h2 className="mb-4 text-center text-xl font-bold md:text-2xl">
                  Ready to Convert
                </h2>
                <p
                  className="mb-8 text-center text-muted-foreground text-sm"
                  style={{ lineHeight: "1.6" }}
                >
                  Paste to get started. Markdown will appear instantly.
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
                  {canRestore && (
                    <Button
                      onClick={handleUndo}
                      size="lg"
                      variant="outline"
                      className="gap-3 transition-transform hover:scale-105 active:scale-95"
                    >
                      <ArrowCounterClockwise size={20} weight="bold" />
                      Restore Last Cleared Content
                    </Button>
                  )}
                  <div className="relative">
                    <Separator className="my-4" />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground uppercase tracking-wider">
                      or
                    </span>
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    Press{" "}
                    <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">
                      Ctrl+V
                    </kbd>{" "}
                    or{" "}
                    <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">
                      ⌘+V
                    </kbd>{" "}
                    anywhere on this page
                  </p>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mx-auto max-w-[1400px]"
            >
              <Card className="bg-card text-card-foreground gap-3 rounded-xl border border-primary/30 flex flex-col p-4 shadow-lg backdrop-blur-sm transition-shadow hover:shadow-xl hover:border-accent/40">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Label
                      htmlFor="markdown-output"
                      className="text-sm font-medium uppercase tracking-wider"
                      style={{ letterSpacing: "0.05em" }}
                    >
                      Markdown Output
                    </Label>
                    <Select
                      value={markdownFlavor}
                      onValueChange={(value) => {
                        dialogReturnFocus.current = flavorRef.current;
                        handleFlavorChange(value as MarkdownFlavor);
                      }}
                    >
                      <SelectTrigger
                        ref={flavorRef}
                        aria-label="Markdown style"
                        className="w-[160px] h-8 text-xs"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="github">GitHub Flavored</SelectItem>
                        <SelectItem value="commonmark">CommonMark</SelectItem>
                        <SelectItem value="strict">Strict Markdown</SelectItem>
                        <SelectItem value="custom">Custom Style</SelectItem>
                      </SelectContent>
                    </Select>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <Switch
                            ref={spacingRef}
                            id="remove-blank-lines"
                            checked={removeBlankLines}
                            onCheckedChange={(checked) => {
                              dialogReturnFocus.current = spacingRef.current;
                              handleRemoveBlankLinesChange(checked);
                            }}
                          />
                          <Label
                            htmlFor="remove-blank-lines"
                            className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1"
                          >
                            Remove blank lines in lists
                            <Info
                              size={14}
                              weight="fill"
                              className="text-muted-foreground/60"
                            />
                          </Label>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-xs leading-relaxed">
                          Turn off to preserve spacing when lists need visual
                          separation between items, such as complex nested lists
                          or lists with multi-paragraph items.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex max-w-full flex-wrap gap-2">
                    <Sheet>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SheetTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-2 transition-transform hover:scale-105 active:scale-95"
                            >
                              <BookOpen size={16} aria-hidden="true" />
                              <span className="sr-only">
                                Markdown cheatsheet
                              </span>
                            </Button>
                          </SheetTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Markdown cheatsheet</p>
                        </TooltipContent>
                      </Tooltip>
                      <SheetContent
                        side="right"
                        className="w-full sm:max-w-2xl overflow-y-auto"
                      >
                        <SheetHeader className="mb-6">
                          <SheetTitle className="flex items-center gap-2 text-2xl">
                            <BookOpen
                              size={28}
                              weight="duotone"
                              className="text-accent"
                            />
                            Markdown Cheatsheet
                          </SheetTitle>
                          <SheetDescription className="sr-only">
                            Markdown syntax and examples.
                          </SheetDescription>
                        </SheetHeader>
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <h3 className="text-lg font-bold border-b pb-2">
                              Headings
                            </h3>
                            <div className="space-y-2 text-sm">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-muted-foreground mb-1">
                                    Syntax
                                  </p>
                                  <code className="block bg-muted p-3 rounded font-mono text-xs">
                                    # Heading 1<br />
                                    ## Heading 2<br />
                                    ### Heading 3<br />
                                    #### Heading 4
                                  </code>
                                </div>
                                <div>
                                  <p className="text-muted-foreground mb-1">
                                    Result
                                  </p>
                                  <div className="bg-secondary/50 p-3 rounded">
                                    <h1 className="text-2xl font-bold">
                                      Heading 1
                                    </h1>
                                    <h2 className="text-xl font-bold">
                                      Heading 2
                                    </h2>
                                    <h3 className="text-lg font-bold">
                                      Heading 3
                                    </h3>
                                    <h4 className="text-base font-bold">
                                      Heading 4
                                    </h4>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h3 className="text-lg font-bold border-b pb-2">
                              Emphasis
                            </h3>
                            <div className="space-y-2 text-sm">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <code className="block bg-muted p-3 rounded font-mono text-xs whitespace-pre-wrap">
                                    *italic* or _italic_
                                    <br />
                                    **bold** or __bold__
                                    <br />
                                    ***bold italic***
                                    <br />
                                    ~~strikethrough~~
                                  </code>
                                </div>
                                <div>
                                  <div className="bg-secondary/50 p-3 rounded space-y-1">
                                    <p>
                                      <em>italic</em>
                                    </p>
                                    <p>
                                      <strong>bold</strong>
                                    </p>
                                    <p>
                                      <strong>
                                        <em>bold italic</em>
                                      </strong>
                                    </p>
                                    <p>
                                      <s>strikethrough</s>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h3 className="text-lg font-bold border-b pb-2">
                              Lists
                            </h3>
                            <div className="space-y-4 text-sm">
                              <div>
                                <p className="text-muted-foreground mb-2">
                                  Unordered Lists
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                  <code className="block bg-muted p-3 rounded font-mono text-xs">
                                    - Item 1<br />
                                    - Item 2<br />
                                    {"  "}- Nested item
                                    <br />- Item 3
                                  </code>
                                  <div className="bg-secondary/50 p-3 rounded">
                                    <ul className="list-disc list-inside space-y-1">
                                      <li>Item 1</li>
                                      <li>
                                        Item 2
                                        <ul className="list-circle list-inside ml-4">
                                          <li>Nested item</li>
                                        </ul>
                                      </li>
                                      <li>Item 3</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-2">
                                  Ordered Lists
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                  <code className="block bg-muted p-3 rounded font-mono text-xs">
                                    1. First item
                                    <br />
                                    2. Second item
                                    <br />
                                    3. Third item
                                  </code>
                                  <div className="bg-secondary/50 p-3 rounded">
                                    <ol className="list-decimal list-inside space-y-1">
                                      <li>First item</li>
                                      <li>Second item</li>
                                      <li>Third item</li>
                                    </ol>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-2">
                                  Task Lists
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                  <code className="block bg-muted p-3 rounded font-mono text-xs">
                                    - [ ] Unchecked
                                    <br />- [x] Checked
                                  </code>
                                  <div className="bg-secondary/50 p-3 rounded">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <input type="checkbox" disabled />
                                        <span>Unchecked</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked
                                          disabled
                                        />
                                        <span>Checked</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h3 className="text-lg font-bold border-b pb-2">
                              Links & Images
                            </h3>
                            <div className="space-y-2 text-sm">
                              <div className="grid grid-cols-2 gap-4">
                                <code className="block bg-muted p-3 rounded font-mono text-xs whitespace-pre-wrap">
                                  [Link text](url)
                                  <br />
                                  ![Alt text](image.jpg)
                                </code>
                                <div className="bg-secondary/50 p-3 rounded space-y-2">
                                  <a href="#" className="text-accent underline">
                                    Link text
                                  </a>
                                  <p className="text-muted-foreground text-xs">
                                    Image would render here
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h3 className="text-lg font-bold border-b pb-2">
                              Code
                            </h3>
                            <div className="space-y-4 text-sm">
                              <div>
                                <p className="text-muted-foreground mb-2">
                                  Inline Code
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                  <code className="block bg-muted p-3 rounded font-mono text-xs">
                                    Use `code` in text
                                  </code>
                                  <div className="bg-secondary/50 p-3 rounded">
                                    Use{" "}
                                    <code className="bg-muted px-1 py-0.5 rounded text-xs">
                                      code
                                    </code>{" "}
                                    in text
                                  </div>
                                </div>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-2">
                                  Code Block
                                </p>
                                <code className="block bg-muted p-3 rounded font-mono text-xs whitespace-pre">
                                  ```javascript
                                  <br />
                                  function hello() {"{"}
                                  <br />
                                  {"  "}console.log("Hi");
                                  <br />
                                  {"}"}
                                  <br />
                                  ```
                                </code>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h3 className="text-lg font-bold border-b pb-2">
                              Blockquotes
                            </h3>
                            <div className="space-y-2 text-sm">
                              <div className="grid grid-cols-2 gap-4">
                                <code className="block bg-muted p-3 rounded font-mono text-xs">
                                  {"> Quote text"}
                                  <br />
                                  {"> More quote"}
                                </code>
                                <div className="bg-secondary/50 p-3 rounded">
                                  <blockquote className="border-l-4 border-accent pl-3 italic text-muted-foreground">
                                    Quote text
                                    <br />
                                    More quote
                                  </blockquote>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h3 className="text-lg font-bold border-b pb-2">
                              Tables
                            </h3>
                            <div className="space-y-2 text-sm">
                              <code className="block bg-muted p-3 rounded font-mono text-xs whitespace-pre">
                                | Header 1 | Header 2 |<br />
                                | -------- | -------- |<br />
                                | Cell 1 | Cell 2 |<br />| Cell 3 | Cell 4 |
                              </code>
                              <div className="bg-secondary/50 p-3 rounded overflow-x-auto">
                                <table className="w-full border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-muted">
                                      <th className="border border-border p-2 text-left">
                                        Header 1
                                      </th>
                                      <th className="border border-border p-2 text-left">
                                        Header 2
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="border border-border p-2">
                                        Cell 1
                                      </td>
                                      <td className="border border-border p-2">
                                        Cell 2
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="border border-border p-2">
                                        Cell 3
                                      </td>
                                      <td className="border border-border p-2">
                                        Cell 4
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h3 className="text-lg font-bold border-b pb-2">
                              Horizontal Rule
                            </h3>
                            <div className="space-y-2 text-sm">
                              <div className="grid grid-cols-2 gap-4">
                                <code className="block bg-muted p-3 rounded font-mono text-xs">
                                  ---
                                  <br />
                                  or
                                  <br />
                                  ***
                                </code>
                                <div className="bg-secondary/50 p-3 rounded">
                                  <hr className="border-t border-border" />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-lg bg-accent/10 border border-accent/30 p-4">
                            <p className="text-sm text-accent-foreground">
                              <strong>Tip:</strong> Use keyboard shortcuts
                              (Cmd/Ctrl + /) to quickly format selected text in
                              the markdown output area.
                            </p>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={openShortcuts}
                          size="sm"
                          variant="ghost"
                          className="gap-2 transition-transform hover:scale-105 active:scale-95"
                        >
                          <Keyboard size={16} aria-hidden="true" />
                          <span className="sr-only">Keyboard shortcuts</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Keyboard shortcuts</p>
                      </TooltipContent>
                    </Tooltip>
                    {canRestore && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleUndo}
                            size="sm"
                            variant="outline"
                            className="gap-2 transition-transform hover:scale-105 active:scale-95"
                          >
                            <ArrowCounterClockwise
                              size={16}
                              aria-hidden="true"
                            />
                            <span className="sr-only">
                              Restore last cleared content
                            </span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            Restore last cleared content
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={clear}
                          size="sm"
                          variant="destructive"
                          className="gap-2 transition-transform hover:scale-105 active:scale-95"
                        >
                          Clear
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          Clear content (can be restored)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Button
                      onClick={handleDownload}
                      disabled={!markdownOutput}
                      size="sm"
                      variant="outline"
                      className="gap-2 transition-transform hover:scale-105 active:scale-95"
                    >
                      <Download size={16} />
                      Download
                    </Button>
                    <Button
                      onClick={handleCopy}
                      disabled={!markdownOutput}
                      size="sm"
                      className="gap-2 bg-accent text-accent-foreground transition-transform hover:bg-accent/90 hover:scale-105 active:scale-95"
                    >
                      <Copy size={16} />
                      Copy
                    </Button>
                  </div>
                </div>

                {(detectedExtensions.yamlFrontMatter ||
                  detectedExtensions.footnotes ||
                  detectedExtensions.taskLists ||
                  detectedExtensions.tables ||
                  detectedExtensions.strikethrough ||
                  detectedExtensions.definitionLists) && (
                  <Collapsible
                    open={showExtensions}
                    onOpenChange={setShowExtensions}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <Sparkle
                          size={16}
                          weight="fill"
                          className="text-accent"
                        />
                        <span className="text-xs">
                          {showExtensions ? "Hide" : "Show"} Markdown Extensions
                          Detected
                        </span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3">
                      <div className="rounded-lg border bg-muted/30 p-4">
                        <p className="text-xs text-muted-foreground mb-3">
                          The following syntax was detected. Preview support
                          varies by extension:
                        </p>
                        <div className="space-y-2">
                          {detectedExtensions.yamlFrontMatter && (
                            <div className="flex items-start gap-2 text-xs">
                              <div className="rounded-full bg-accent/20 p-1 mt-0.5">
                                <Sparkle
                                  size={10}
                                  weight="fill"
                                  className="text-accent"
                                />
                              </div>
                              <div>
                                <p className="font-medium">YAML Front Matter</p>
                                <p className="text-muted-foreground">
                                  Metadata block at the beginning of the
                                  document
                                </p>
                              </div>
                            </div>
                          )}
                          {detectedExtensions.footnotes && (
                            <div className="flex items-start gap-2 text-xs">
                              <div className="rounded-full bg-accent/20 p-1 mt-0.5">
                                <Sparkle
                                  size={10}
                                  weight="fill"
                                  className="text-accent"
                                />
                              </div>
                              <div>
                                <p className="font-medium">Footnotes</p>
                                <p className="text-muted-foreground">
                                  Reference-style footnotes with [^1] syntax
                                </p>
                              </div>
                            </div>
                          )}
                          {detectedExtensions.taskLists && (
                            <div className="flex items-start gap-2 text-xs">
                              <div className="rounded-full bg-accent/20 p-1 mt-0.5">
                                <Sparkle
                                  size={10}
                                  weight="fill"
                                  className="text-accent"
                                />
                              </div>
                              <div>
                                <p className="font-medium">Task Lists</p>
                                <p className="text-muted-foreground">
                                  Checkboxes with - [ ] and - [x] syntax
                                </p>
                              </div>
                            </div>
                          )}
                          {detectedExtensions.tables && (
                            <div className="flex items-start gap-2 text-xs">
                              <div className="rounded-full bg-accent/20 p-1 mt-0.5">
                                <Sparkle
                                  size={10}
                                  weight="fill"
                                  className="text-accent"
                                />
                              </div>
                              <div>
                                <p className="font-medium">Tables</p>
                                <p className="text-muted-foreground">
                                  Pipe-delimited tables with header separators
                                </p>
                              </div>
                            </div>
                          )}
                          {detectedExtensions.strikethrough && (
                            <div className="flex items-start gap-2 text-xs">
                              <div className="rounded-full bg-accent/20 p-1 mt-0.5">
                                <Sparkle
                                  size={10}
                                  weight="fill"
                                  className="text-accent"
                                />
                              </div>
                              <div>
                                <p className="font-medium">Strikethrough</p>
                                <p className="text-muted-foreground">
                                  Text wrapped in ~~ for strikethrough effect
                                </p>
                              </div>
                            </div>
                          )}
                          {detectedExtensions.definitionLists && (
                            <div className="flex items-start gap-2 text-xs">
                              <div className="rounded-full bg-accent/20 p-1 mt-0.5">
                                <Sparkle
                                  size={10}
                                  weight="fill"
                                  className="text-accent"
                                />
                              </div>
                              <div>
                                <p className="font-medium">Definition Lists</p>
                                <p className="text-muted-foreground">
                                  Term and definition pairs using : syntax
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
                <Tabs
                  value={previewMode}
                  onValueChange={(value) =>
                    setPreviewMode(value as "raw" | "preview")
                  }
                  className="flex-1 flex flex-col"
                >
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
                  <TabsContent
                    forceMount
                    value="raw"
                    className="flex-1 mt-3 data-[state=inactive]:hidden"
                  >
                    <Textarea
                      ref={textareaRef}
                      id="markdown-output"
                      value={markdownOutput}
                      onChange={(e) => setMarkdownOutput(e.target.value)}
                      spellCheck={false}
                      onKeyDown={(event) => {
                        if (
                          (event.metaKey || event.ctrlKey) &&
                          event.key === "/"
                        ) {
                          event.preventDefault();
                          openShortcuts();
                          return;
                        }
                        const format = getMarkdownShortcut(event);
                        if (!format) return;
                        event.preventDefault();
                        const result = applyMarkdownFormatToTextarea(
                          event.currentTarget,
                          format,
                          markdownFlavor,
                        );
                        setMarkdownOutput(event.currentTarget.value);
                        event.currentTarget.setSelectionRange(
                          result.selectionStart,
                          result.selectionEnd,
                        );
                        toast.success(result.successMessage);
                      }}
                      className="min-h-[600px] rounded-md border bg-secondary/50 p-6 overflow-auto font-mono text-sm resize-none"
                      placeholder="Your markdown will appear here..."
                    />
                  </TabsContent>
                  <TabsContent value="preview" className="flex-1 mt-3">
                    <div
                      data-testid="markdown-preview"
                      className="min-h-[600px] rounded-md border bg-secondary/50 p-6 prose prose-sm max-w-none overflow-auto"
                      dangerouslySetInnerHTML={{ __html: sanitizedPreviewHtml }}
                    />
                  </TabsContent>
                </Tabs>
              </Card>
            </motion.div>
          )}
        </div>
        <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
          <DialogContent onCloseAutoFocus={restoreDialogFocus}>
            <DialogHeader>
              <DialogTitle>Download Markdown File</DialogTitle>
              <DialogDescription className="sr-only">
                Save the current Markdown to your device.
              </DialogDescription>
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
                      if (e.key === "Enter") {
                        confirmDownload();
                      }
                    }}
                  />
                  <span className="flex items-center text-sm text-muted-foreground">
                    .md
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  The file will be saved as "{markdownFilename(filename)}"
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
        <Dialog
          open={showShortcutsDialog}
          onOpenChange={setShowShortcutsDialog}
        >
          <DialogContent
            onCloseAutoFocus={restoreDialogFocus}
            className="max-w-2xl"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Keyboard size={24} />
                Keyboard Shortcuts
              </DialogTitle>
              <DialogDescription className="sr-only">
                Format text in the Raw Markdown editor using these shortcuts.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 pl-6">
              <p className="text-sm text-muted-foreground">
                Use these keyboard shortcuts to quickly format your markdown
                text. Select text in the Raw Markdown view and press the
                shortcut. Formatting follows the selected flavor. Strikethrough
                remains available in every flavor as an optional Markdown
                extension.
              </p>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Text Formatting</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Bold</span>
                        <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">
                          ⌘/Ctrl + B
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Italic</span>
                        <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">
                          ⌘/Ctrl + I
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Strikethrough</span>
                        <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">
                          ⌘/Ctrl + D
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Inline Code</span>
                        <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">
                          ⌘/Ctrl + E
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Code Block</span>
                        <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">
                          ⌘/Ctrl + Shift + C
                        </kbd>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Structure</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Heading 1</span>
                        <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">
                          ⌘/Ctrl + 1
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Heading 2</span>
                        <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">
                          ⌘/Ctrl + 2
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Heading 3</span>
                        <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">
                          ⌘/Ctrl + 3
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Link</span>
                        <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">
                          ⌘/Ctrl + K
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Quote</span>
                        <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">
                          ⌘/Ctrl + Shift + Q
                        </kbd>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 pt-2 border-t">
                  <h3 className="text-sm font-semibold">Lists</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Bullet List</span>
                      <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">
                        ⌘/Ctrl + Shift + L
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Numbered List</span>
                      <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">
                        ⌘/Ctrl + Shift + O
                      </kbd>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 pt-2 border-t">
                  <h3 className="text-sm font-semibold">Other</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span>Show Shortcuts</span>
                    <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">
                      ⌘/Ctrl + /
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setShowShortcutsDialog(false)}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Got it
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog
          open={pendingPreferences !== null}
          onOpenChange={(open) => {
            if (!open) cancelPreferences();
          }}
        >
          <DialogContent onCloseAutoFocus={restoreDialogFocus}>
            <DialogHeader>
              <DialogTitle>Replace your Markdown edits?</DialogTitle>
              <DialogDescription>
                Changing formatting settings will reconvert the original pasted
                content and replace your manual edits.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={cancelPreferences}>
                Keep my edits
              </Button>
              <Button onClick={() => confirmPreferences()}>Reconvert</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

export default App;

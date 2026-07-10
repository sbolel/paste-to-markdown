export type MarkdownFormatType =
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'code'
  | 'code-block'
  | 'link'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'list'
  | 'ordered-list'
  | 'quote'

interface MarkdownFormatEdit {
  replacement: string
  cursorOffset: number
  successMessage: string
}

export interface AppliedMarkdownFormat {
  selectionStart: number
  selectionEnd: number
  successMessage: string
}

export const getMarkdownFormatEdit = (
  formatType: MarkdownFormatType,
  selectedText: string,
): MarkdownFormatEdit => {
  switch (formatType) {
    case 'bold':
      return {
        replacement: `**${selectedText}**`,
        cursorOffset: 2,
        successMessage: 'Applied bold formatting',
      }
    case 'italic':
      return {
        replacement: `*${selectedText}*`,
        cursorOffset: 1,
        successMessage: 'Applied italic formatting',
      }
    case 'strikethrough':
      return {
        replacement: `~~${selectedText}~~`,
        cursorOffset: 2,
        successMessage: 'Applied strikethrough formatting',
      }
    case 'code':
      return {
        replacement: `\`${selectedText}\``,
        cursorOffset: 1,
        successMessage: 'Applied inline code formatting',
      }
    case 'code-block':
      return {
        replacement: `\`\`\`\n${selectedText}\n\`\`\``,
        cursorOffset: 4,
        successMessage: 'Applied code block formatting',
      }
    case 'link':
      return {
        replacement: `[${selectedText || 'link text'}](url)`,
        cursorOffset: selectedText ? selectedText.length + 3 : 11,
        successMessage: 'Applied link formatting',
      }
    case 'heading1':
      return {
        replacement: `# ${selectedText}`,
        cursorOffset: 2,
        successMessage: 'Applied heading 1 formatting',
      }
    case 'heading2':
      return {
        replacement: `## ${selectedText}`,
        cursorOffset: 3,
        successMessage: 'Applied heading 2 formatting',
      }
    case 'heading3':
      return {
        replacement: `### ${selectedText}`,
        cursorOffset: 4,
        successMessage: 'Applied heading 3 formatting',
      }
    case 'list':
      return {
        replacement: `- ${selectedText}`,
        cursorOffset: 2,
        successMessage: 'Applied list formatting',
      }
    case 'ordered-list':
      return {
        replacement: `1. ${selectedText}`,
        cursorOffset: 3,
        successMessage: 'Applied ordered list formatting',
      }
    case 'quote':
      return {
        replacement: `> ${selectedText}`,
        cursorOffset: 2,
        successMessage: 'Applied quote formatting',
      }
  }
}

export const applyMarkdownFormatToTextarea = (
  textarea: HTMLTextAreaElement,
  formatType: MarkdownFormatType,
): AppliedMarkdownFormat => {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = textarea.value.slice(start, end)
  const edit = getMarkdownFormatEdit(formatType, selectedText)
  const selectionPosition = selectedText ? start + edit.replacement.length : start + edit.cursorOffset
  const supportsNativeInsertText = typeof document !== 'undefined'
    && typeof document.execCommand === 'function'
    && (
      typeof document.queryCommandSupported !== 'function'
      || document.queryCommandSupported('insertText')
    )

  if (supportsNativeInsertText) {
    textarea.focus()
    textarea.setSelectionRange(start, end)
    const applied = document.execCommand('insertText', false, edit.replacement)

    if (!applied) {
      textarea.setRangeText(edit.replacement, start, end, 'end')
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
    }
  } else {
    textarea.setRangeText(edit.replacement, start, end, 'end')
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  }

  return {
    selectionStart: selectionPosition,
    selectionEnd: selectionPosition,
    successMessage: edit.successMessage,
  }
}

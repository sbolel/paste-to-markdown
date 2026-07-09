import assert from 'node:assert/strict'
import test from 'node:test'

import { applyMarkdownFormatToTextarea } from '../src/lib/markdown-formatting.ts'

class MockTextarea extends EventTarget {
  value: string
  selectionStart: number
  selectionEnd: number
  setRangeTextCalls = 0
  focusCalls = 0

  constructor(value: string, selectionStart: number, selectionEnd = selectionStart) {
    super()
    this.value = value
    this.selectionStart = selectionStart
    this.selectionEnd = selectionEnd
  }

  setRangeText(replacement: string, start: number, end: number) {
    this.setRangeTextCalls += 1
    this.value = `${this.value.slice(0, start)}${replacement}${this.value.slice(end)}`
    const cursor = start + replacement.length
    this.selectionStart = cursor
    this.selectionEnd = cursor
  }

  setSelectionRange(selectionStart: number, selectionEnd: number) {
    this.selectionStart = selectionStart
    this.selectionEnd = selectionEnd
  }

  focus() {
    this.focusCalls += 1
  }
}

test('uses the native insertText command when the browser supports it', () => {
  const textarea = new MockTextarea('This is sample text.', 8, 19)
  let execCommandCalls = 0
  const originalDocument = globalThis.document

  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      execCommand: (_command: string, _showUi: boolean, replacement: string) => {
        execCommandCalls += 1
        textarea.setRangeText(replacement, textarea.selectionStart, textarea.selectionEnd)
        return true
      },
      queryCommandSupported: (command: string) => command === 'insertText',
    },
  })

  try {
    const result = applyMarkdownFormatToTextarea(textarea as unknown as HTMLTextAreaElement, 'strikethrough')

    assert.equal(execCommandCalls, 1)
    assert.equal(textarea.focusCalls, 1)
    assert.equal(textarea.value, 'This is ~~sample text~~.')
    assert.equal(textarea.setRangeTextCalls, 1)
    assert.deepEqual(result, {
      selectionStart: 23,
      selectionEnd: 23,
      successMessage: 'Applied strikethrough formatting',
    })
  } finally {
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: originalDocument,
    })
  }
})

test('falls back to setRangeText and dispatches input when insertText is unavailable', () => {
  const textarea = new MockTextarea('Heading', 0)
  let inputEvents = 0
  const originalDocument = globalThis.document

  textarea.addEventListener('input', () => {
    inputEvents += 1
  })

  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: undefined,
  })

  try {
    const result = applyMarkdownFormatToTextarea(textarea as unknown as HTMLTextAreaElement, 'bold')

    assert.equal(textarea.value, '****Heading')
    assert.equal(textarea.setRangeTextCalls, 1)
    assert.equal(inputEvents, 1)
    assert.equal(result.selectionStart, 2)
    assert.equal(result.selectionEnd, 2)
  } finally {
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: originalDocument,
    })
  }
})

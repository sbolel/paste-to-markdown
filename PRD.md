# Planning Guide

A specialized web tool that converts HTML content into clean, validated Markdown format with support for both desktop and mobile paste operations.

**Experience Qualities**:
1. **Immediate** - Conversions happen instantly as users paste, with no delay or loading states
2. **Precise** - Output is validated, properly formatted Markdown that users can trust and use immediately
3. **Accessible** - Works seamlessly on both desktop (keyboard shortcuts) and mobile (explicit paste button)

**Complexity Level**: Micro Tool (single-purpose application)
This is a focused utility that does one thing exceptionally well - converting HTML to Markdown. It has minimal state and a straightforward single-screen interface.

## Essential Features

### HTML to Markdown Conversion
- **Functionality**: Accepts HTML input and converts it to valid Markdown syntax, or detects and validates existing Markdown content
- **Purpose**: Enables users to quickly transform rich HTML content into portable Markdown format, or validate already-formatted Markdown
- **Trigger**: User pastes HTML content or Markdown (Ctrl/Cmd+V or mobile paste button)
- **Progression**: User pastes content → System detects if already Markdown → If Markdown, validates and displays as-is → If HTML, converts to Markdown instantly → Validated Markdown appears in output area → User can copy result
- **Success criteria**: All common HTML elements (headings, lists, links, bold, italic, code blocks, tables) convert accurately to Markdown; already-formatted Markdown is detected and preserved without re-conversion

### Mobile Paste Support
- **Functionality**: Explicit "Paste" button that programmatically triggers paste operation
- **Purpose**: Enables mobile users to paste content without keyboard shortcuts
- **Trigger**: User taps the paste button
- **Progression**: User taps paste button → Browser paste permission requested → User grants permission → Clipboard content read → Conversion occurs
- **Success criteria**: Mobile users can successfully paste and convert content with a single tap

### Markdown Validation
- **Functionality**: Ensures output is syntactically correct Markdown
- **Purpose**: Guarantees the converted output will render correctly in Markdown parsers
- **Trigger**: Automatically runs after conversion
- **Progression**: HTML converted → Markdown validated → Clean output displayed
- **Success criteria**: Output passes Markdown linting and renders correctly

### Copy to Clipboard
- **Functionality**: One-click copy of the converted Markdown
- **Purpose**: Streamlines the workflow by eliminating manual text selection
- **Trigger**: User clicks copy button
- **Progression**: User clicks copy → Markdown copied to clipboard → Success toast notification shown
- **Success criteria**: Converted Markdown is accurately copied and ready to paste elsewhere

### Preview Toggle
- **Functionality**: Switch between raw markdown text and rendered preview
- **Purpose**: Allows users to verify how the markdown will render before copying
- **Trigger**: User clicks on Raw Markdown or Preview tab
- **Progression**: User clicks tab → View switches between raw markdown text and formatted HTML preview
- **Success criteria**: Preview accurately renders the markdown with proper formatting for headings, lists, links, code blocks, tables, and other elements

### Markdown Flavor Selection
- **Functionality**: Choose between different markdown syntax flavors (GitHub, CommonMark, Strict, Custom)
- **Purpose**: Provides flexibility to match the user's target markdown parser requirements
- **Trigger**: User selects a flavor from the dropdown in the output section
- **Progression**: User selects flavor → Conversion engine reconfigures → Markdown regenerates with selected flavor's syntax rules
- **Success criteria**: Each flavor produces syntactically correct markdown according to its specification (e.g., GFM includes tables and strikethrough, CommonMark is more standardized, Strict uses traditional indented code blocks)

### Markdown Extensions Detection
- **Functionality**: Automatically detect and display markdown syntax extensions (YAML front matter, footnotes, task lists, tables, strikethrough, definition lists)
- **Purpose**: Inform users when their markdown contains extended syntax that may require special parser support
- **Trigger**: Content is pasted or converted
- **Progression**: Content analyzed → Extensions detected → Collapsible panel displays detected extensions with explanations
- **Success criteria**: Correctly identifies YAML front matter (--- delimited blocks), footnotes ([^1] syntax), task lists (- [ ] and - [x] syntax), tables (pipe-delimited with header separators), strikethrough (~~text~~ syntax), and definition lists (term\n: definition syntax); displays clear explanations for each detected extension

## Edge Case Handling

- **Empty Paste**: Show helpful placeholder text encouraging users to paste HTML content or Markdown
- **Invalid HTML**: Gracefully handle malformed HTML by converting what's parseable and stripping invalid elements
- **Plain Text Paste**: Accept plain text input and pass it through without modification
- **Markdown Paste**: Detect content that's already in Markdown format and validate it instead of re-converting
- **Markdown with Extensions**: Detect and inform users about extended markdown syntax (YAML front matter, footnotes, task lists, tables, strikethrough, definition lists) that may require specific parser support
- **Large Content**: Handle large HTML documents without UI freezing or performance degradation
- **Permission Denied**: Show clear message if user denies clipboard permission on mobile
- **Unsupported Elements**: Strip or convert unsupported HTML elements to closest Markdown equivalent

## Design Direction

The design should evoke feelings of clarity, efficiency, and technical precision. It should feel like a professional developer tool - clean, distraction-free, and purpose-built. The interface should communicate reliability and accuracy while maintaining a modern, polished aesthetic.

## Color Selection

A developer-focused palette with strong contrast and technical sophistication.

- **Primary Color**: Deep slate blue `oklch(0.25 0.05 250)` - Communicates technical professionalism and trustworthiness
- **Secondary Colors**: Warm gray `oklch(0.95 0.01 60)` for backgrounds, creating subtle warmth while maintaining neutrality
- **Accent Color**: Vibrant cyan `oklch(0.70 0.15 195)` - Attention-grabbing for CTAs like copy and paste buttons, suggesting digital precision
- **Foreground/Background Pairings**: 
  - Background (Warm Gray #F7F7F6 `oklch(0.97 0.01 60)`): Dark Slate (#1A1C23 `oklch(0.15 0.02 250)`) - Ratio 13.2:1 ✓
  - Primary (Deep Slate `oklch(0.25 0.05 250)`): White (#FFFFFF `oklch(1 0 0)`) - Ratio 11.8:1 ✓
  - Accent (Vibrant Cyan `oklch(0.70 0.15 195)`): Dark Slate (`oklch(0.15 0.02 250)`) - Ratio 7.1:1 ✓
  - Card (White `oklch(1 0 0)`): Dark Slate (`oklch(0.15 0.02 250)`) - Ratio 17.5:1 ✓

## Font Selection

Monospace for code authenticity with a clean sans-serif for UI elements, creating a developer-tool aesthetic.

- **Typographic Hierarchy**:
  - H1 (App Title): Space Grotesk Bold/32px/tight letter spacing (-0.02em)
  - H2 (Section Labels): Space Grotesk Medium/14px/uppercase/wide letter spacing (0.05em)
  - Body (Instructions): Inter Regular/15px/relaxed line height (1.6)
  - Code (Content Areas): JetBrains Mono Regular/14px/normal line height (1.5)
  - Button Labels: Inter Medium/14px/normal letter spacing

## Animations

Animations should be minimal and functional, reinforcing actions without distracting from the core conversion task. Use subtle micro-interactions for button states (gentle scale on hover), smooth transitions when content appears (fade-in with slight upward movement), and satisfying feedback for the copy action (brief scale pulse). Keep all animations under 200ms to maintain the tool's snappy, efficient feel.

## Component Selection

- **Components**:
  - Textarea: For HTML input and Markdown output areas with monospace styling
  - Button: Primary style for "Paste" (mobile), accent style for "Copy" action
  - Card: Container for input/output sections with subtle elevation
  - Label: For "HTML Input" and "Markdown Output" section headers
  - Separator: Vertical divider between input/output sections
  - Toast (Sonner): Success confirmation for copy actions
  
- **Customizations**:
  - Custom dual-panel layout with vertical separator for desktop (side-by-side)
  - Mobile-adaptive layout stacking panels vertically
  - Paste button visibility logic (show on mobile/touch devices, hide on desktop)
  - Monospace font override for textarea elements
  - Auto-resize textareas to fit content
  
- **States**:
  - Buttons: Distinct hover (scale 1.02), active (scale 0.98), focus (ring with accent color)
  - Textareas: Focus state with accent border glow, disabled state for output (read-only but copyable)
  - Paste button: Hidden on desktop, visible on mobile with touch-friendly sizing
  
- **Icon Selection**:
  - ClipboardText: Paste button (input action)
  - Copy: Copy to clipboard button (output action)
  - CheckCircle: Success state in toast notifications
  - ArrowRight: Visual separator between input/output sections
  
- **Spacing**:
  - Container: px-4 py-8 (mobile), px-8 py-12 (desktop)
  - Card padding: p-6
  - Section gaps: gap-8 (vertical on mobile), gap-6 (horizontal on desktop)
  - Button spacing: px-6 py-3 for touch-friendly targets
  
- **Mobile**:
  - Stack input/output vertically on screens < 768px
  - Show paste button on touch devices
  - Increase button sizes to 48px minimum touch targets
  - Single column layout with full-width textareas
  - Reduce font sizes slightly (H1: 24px, Code: 13px)

# Founder Sprint MVP - 디자인 시스템

**문서 버전**: v1.0  
**작성일**: 2026년 1월 20일  
**소스**: Webflow Export (`/Users/cosmos/Downloads/outsome.webflow`)  
**목적**: Next.js 프로젝트에서 Webflow 디자인을 정확히 재현하기 위한 디자인 토큰 및 컴포넌트 정의

---

## 목차

1. [색상 시스템](#1-색상-시스템)
2. [타이포그래피](#2-타이포그래피)
3. [간격 시스템](#3-간격-시스템)
4. [버튼](#4-버튼)
5. [폼 요소](#5-폼-요소)
6. [레이아웃](#6-레이아웃)
7. [특수 효과](#7-특수-효과)
8. [CSS 변수 전체 목록](#8-css-변수-전체-목록)
9. [Next.js 통합 가이드](#9-nextjs-통합-가이드)

---

## 1. 색상 시스템

### 1.1 주요 색상

| 이름 | CSS 변수 | HEX 값 | 용도 |
|------|----------|--------|------|
| **Light 1** | `--color-light-1` | `#fefaf3` | 메인 배경 (크림색) |
| **Light 2** | `--color-light-2` | `#f1eadd` | 세컨더리 배경 (베이지) |
| **Dark** | `--color-dark` | `#000000` | 텍스트, 버튼 배경 |
| **White** | `--color-white` | `#ffffff` | 순수 흰색 |

### 1.2 투명도 변형

| 이름 | CSS 변수 | HEX 값 | 용도 |
|------|----------|--------|------|
| **Dark 12%** | `--color-dark-12` | `#2f2c251f` | 보더, 구분선 |
| **Dark 7%** | `--color-dark-7` | `#2f2c250f` | 인풋 배경 |
| **Light 1 30%** | `--color-light-1-30` | `#fefaf34d` | 라이트 버튼 (다크 배경 위) |
| **Light 1 10%** | `--color-light-1-10` | `#fefaf31a` | 다크 배경 위 보더 |

### 1.3 글래스 효과 색상

| 이름 | CSS 변수 | HEX 값 | 용도 |
|------|----------|--------|------|
| **Glass Surface** | `--color-glass-surface` | `#fefaf399` | 글래스 배경 |
| **Glass Border** | `--color-glass-border` | `#ffffff66` | 글래스 보더 |

### 1.4 피드백 색상

| 이름 | CSS 변수 | HEX 값 | 용도 |
|------|----------|--------|------|
| **Success** | `--forms-success-bg` | `#a9ee81` | 성공 메시지 배경 |
| **Error** | `--forms-error-bg` | `#f5aaaa` | 에러 메시지 배경 |

---

## 2. 타이포그래피

### 2.1 폰트 패밀리

| 용도 | 폰트 | Fallback | 파일 |
|------|------|----------|------|
| **Body** | BDO Grotesk | Arial, sans-serif | `BDOGrotesk-VF.ttf` (Variable) |
| **Headings** | Libre Caslon Condensed | Times New Roman, sans-serif | `LibreCaslonCondensed-Regular.otf`, `LibreCaslonCondensed-Italic.otf` |
| **Badges** | Roboto Mono | Trebuchet MS, sans-serif | `RobotoMono-Medium.ttf` |

### 2.2 타입 스케일

**Base Unit**: `14px`  
**Scale Factor**: `1.26`

| 레벨 | 크기 계산 | 대략적 크기 | Line Height | Letter Spacing |
|------|----------|-------------|-------------|----------------|
| **H1** | base × 1.26^5 | ~44px | 1em | -0.02em |
| **H2** | base × 1.26^4 | ~35px | 1.1em | -0.02em |
| **H3** | base × 1.26^3 | ~28px | 1.2em | -0.02em |
| **H4** | base × 1.26^2 | ~22px | 1.25em | -0.02em |
| **H5** | base × 1.26^1.5 | ~19px | 1.3em | -0.01em |
| **Lead** | base × 1.26 | ~18px | 1.4em | - |
| **Body** | base | 14px | 1.4em | - |
| **Small** | base ÷ 1.26 | ~11px | 1.4em | - |

### 2.3 텍스트 스타일 클래스

```css
/* Headings - Libre Caslon Condensed, font-weight: 400 */
.heading---h1 { font-family: "Libre Caslon Condensed"; font-weight: 400; }
.heading---h2 { font-family: "Libre Caslon Condensed"; font-weight: 400; }
.heading---h3 { font-family: "Libre Caslon Condensed"; font-weight: 400; }
.heading---h4 { font-family: "Libre Caslon Condensed"; font-weight: 400; }
.heading---h5 { font-family: "Libre Caslon Condensed"; font-weight: 400; }

/* Body Text */
.text---lead { font-size: 18px; line-height: 1.4em; }
.text---small { font-size: 11px; line-height: 1.4em; }
.text---bold { font-variation-settings: "wght" 550; }
.text---muted { opacity: 0.5; }

/* Badge - Roboto Mono, uppercase */
.text---badge {
  font-family: "Roboto Mono";
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* Italic - Libre Caslon Condensed Italic */
.italic { font-style: italic; }
```

---

## 3. 간격 시스템

### 3.1 Gap Scale

**Base Unit**: `24px`

| 이름 | 배수 | 값 | 용도 |
|------|------|-----|------|
| `gap-0-125x` | 0.125x | 3px | 아이콘 간격 |
| `gap-0-25x` | 0.25x | 6px | 미세 간격 |
| `gap-0-5x` | 0.5x | 12px | 작은 간격 |
| `gap-0-75x` | 0.75x | 18px | 중간 간격 |
| `gap-base` | 1x | 24px | 기본 간격 |
| `gap-1-5x` | 1.5x | 36px | 큰 간격 |
| `gap-2x` | 2x | 48px | 섹션 내부 |
| `gap-3x` | 3x | 72px | 섹션 간격 |
| `gap-4x` | 4x | 96px | 대형 섹션 |
| `gap-5x` | 5x | 120px | 푸터 |
| `gap-6x` | 6x | 144px | - |
| `gap-7x` | 7x | 168px | - |

### 3.2 섹션 패딩

**Base Unit**: `96px`

| 이름 | 배수 | 값 |
|------|------|-----|
| `section-padding-0-5x` | 0.5x | 48px |
| `section-padding-base` | 1x | 96px |
| `section-padding-1-5x` | 1.5x | 144px |

### 3.3 Grid Gap

| 이름 | 값 |
|------|-----|
| `grid-gap-xs` | 6px |
| `grid-gap-s` | 12px |
| `grid-gap-m` | 24px |

---

## 4. 버튼

### 4.1 버튼 크기

| 크기 | Height | X Padding | Border Radius |
|------|--------|-----------|---------------|
| **Default** | 48px | 24px | 9px |
| **Small** | 42px | 18px | 9px |

### 4.2 버튼 변형

```css
/* Default Button - Dark background */
.button {
  height: 48px;
  padding: 0 24px;
  border-radius: 9px;
  background-color: #000000;
  color: #fefaf3;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Light 2 Background */
.button.bg-light-2 {
  background-color: #f1eadd;
  color: #000000;
}

/* Light Button (on dark background) */
.button.light {
  background-color: #fefaf34d;
  color: #fefaf3;
}

/* Small variant */
.button.small {
  height: 42px;
  padding: 0 18px;
}
```

### 4.3 버튼 애니메이션 구조

버튼 텍스트는 hover 시 위로 슬라이드하는 애니메이션:

```html
<a class="button">
  <div class="button-text-wrap">
    <div class="button-text-initial">Button Text</div>
    <div class="button-text-reveal">Button Text</div>
  </div>
</a>
```

```css
.button-text-wrap {
  height: 1.4em; /* line-height */
  flex-direction: column;
  display: flex;
  overflow: hidden;
}

.button-text-reveal {
  transform: translateY(80%);
}

.button:hover .button-text-wrap {
  /* 위로 이동하여 reveal 텍스트 표시 */
}
```

---

## 5. 폼 요소

### 5.1 Input 기본 스타일

```css
.form-input {
  height: 48px;
  padding: 0 18px;
  border: 1px solid transparent;
  border-radius: 9px;
  background-color: #2f2c250f; /* dark 7% */
  color: #000000;
  transition: background-color 0.2s, border-color 0.2s;
}

.form-input:focus {
  background-color: #2f2c251f; /* dark 12% */
  border-color: transparent;
}

/* Textarea */
.form-input.textarea {
  min-height: 200px;
  padding: 18px;
}
```

### 5.2 Input Group

```css
.input-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
```

### 5.3 Checkbox & Radio

```css
.checkbox, .radio {
  width: 18px;
  height: 18px;
  background-color: #2f2c251f;
  border-radius: 2px; /* checkbox */
  /* border-radius: 50%; for radio */
}

.checkbox-field, .radio-field {
  display: flex;
  align-items: center;
  gap: 12px;
}
```

### 5.4 Select

```css
.select-field {
  height: 48px;
  padding: 0 18px;
  border-radius: 9px;
  background-color: #2f2c250f;
  cursor: pointer;
}
```

### 5.5 피드백 메시지

```css
.form-success {
  padding: 24px;
  border-radius: 6px;
  background-color: #a9ee81;
  text-align: center;
}

.form-error {
  margin-top: 24px;
  padding: 12px 18px;
  border-radius: 6px;
  background-color: #f5aaaa;
  text-align: center;
}
```

---

## 6. 레이아웃

### 6.1 컨테이너

```css
.main-container {
  max-width: 1440px;
  padding-left: 24px;
  padding-right: 24px;
  width: 100%;
  margin: 0 auto;
}
```

### 6.2 섹션

```css
.section {
  padding-top: 96px;
  padding-bottom: 96px;
  overflow: clip;
}

.section.padding-small {
  padding-top: 48px;
  padding-bottom: 48px;
}

.section.padding-bottom-large {
  padding-bottom: 144px;
}

.section.bg-light-2 {
  background-color: #f1eadd;
}

.section.bg-dark {
  background-color: #000000;
  color: #fefaf3;
}
```

### 6.3 Grid

```css
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: center;
}
```

### 6.4 Group (Flex Column)

```css
.group {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: flex-start;
}

.group.centered {
  align-items: center;
  text-align: center;
}

.group.title {
  gap: 36px;
}
```

### 6.5 Navbar

```css
.navbar {
  position: sticky;
  top: 0;
  z-index: 99;
  background-color: #fefaf3;
}

.navbar-row {
  height: 72px;
  display: flex;
  align-items: center;
  gap: 48px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-link {
  color: #000000;
  font-weight: 500;
  transition: opacity 0.2s;
}

.nav-link:hover {
  opacity: 0.5;
}
```

### 6.6 Footer

```css
.footer {
  padding-top: 96px;
  padding-bottom: 48px;
  background-color: #000000;
  color: #fefaf3;
}

.footer-top {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.footer-menus {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 24px;
}

.footer-link {
  color: #fefaf3;
  font-weight: 400;
  transition: opacity 0.2s;
}

.footer-link:hover {
  opacity: 0.5;
}
```

---

## 7. 특수 효과

### 7.1 글래스 서피스

```css
.glass-surface {
  padding: 18px;
  border: 1px solid #ffffff66;
  border-radius: 6px;
  background-color: #fefaf399;
  box-shadow: 0 4px 18px 0 #0000001f;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

### 7.2 Border Radius

| 이름 | 값 |
|------|-----|
| Base | 6px |
| 2x | 12px |
| Button/Input | 9px |

### 7.3 Transitions

기본 트랜지션: `0.2s ease`

```css
/* 일반적인 hover 효과 */
transition: opacity 0.2s;
transition: background-color 0.2s;
transition: color 0.2s, background-color 0.2s;
```

---

## 8. CSS 변수 전체 목록

```css
:root {
  /* Colors */
  --color-light-1: #fefaf3;
  --color-light-2: #f1eadd;
  --color-dark: #000000;
  --color-white: #ffffff;
  --color-dark-12: #2f2c251f;
  --color-dark-7: #2f2c250f;
  --color-light-1-30: #fefaf34d;
  --color-light-1-10: #fefaf31a;
  --color-glass-surface: #fefaf399;
  --color-glass-border: #ffffff66;
  
  /* Typography */
  --font-body: "BDO Grotesk", Arial, sans-serif;
  --font-headings: "Libre Caslon Condensed", "Times New Roman", sans-serif;
  --font-badges: "Roboto Mono", "Trebuchet MS", sans-serif;
  --type-base-unit: 14px;
  --type-scale-factor: 1.26;
  --type-body-line-height: 1.4em;
  
  /* Gaps */
  --gap-base: 24px;
  --gap-0-5x: 12px;
  --gap-0-75x: 18px;
  --gap-1-5x: 36px;
  --gap-2x: 48px;
  --gap-3x: 72px;
  --gap-4x: 96px;
  
  /* Section Padding */
  --section-padding: 96px;
  --section-padding-small: 48px;
  --section-padding-large: 144px;
  
  /* Buttons */
  --button-height: 48px;
  --button-height-small: 42px;
  --button-padding-x: 24px;
  --button-padding-x-small: 18px;
  --button-radius: 9px;
  
  /* Forms */
  --input-height: 48px;
  --input-padding-x: 18px;
  --input-radius: 9px;
  --textarea-min-height: 200px;
  --checkbox-size: 18px;
  --form-success-bg: #a9ee81;
  --form-error-bg: #f5aaaa;
  
  /* Layout */
  --container-max-width: 1440px;
  --container-gutter: 24px;
  --navbar-height: 72px;
  
  /* Border Radius */
  --radius-base: 6px;
  --radius-2x: 12px;
  
  /* Effects */
  --glass-blur: 12px;
  --glass-shadow-blur: 18px;
  --glass-shadow-color: #0000001f;
}
```

---

## 9. Next.js 통합 가이드

### 9.1 권장 방식: CSS 변수 + Tailwind

Webflow CSS 변수를 그대로 사용하고, Tailwind로 확장합니다.

#### Step 1: 폰트 설정

```tsx
// app/layout.tsx
import localFont from 'next/font/local'

const bdoGrotesk = localFont({
  src: '../fonts/BDOGrotesk-VF.ttf',
  variable: '--font-body',
  display: 'block',
})

const libreCaslon = localFont({
  src: [
    { path: '../fonts/LibreCaslonCondensed-Regular.otf', weight: '400', style: 'normal' },
    { path: '../fonts/LibreCaslonCondensed-Italic.otf', weight: '400', style: 'italic' },
  ],
  variable: '--font-headings',
  display: 'block',
})

const robotoMono = localFont({
  src: '../fonts/RobotoMono-Medium.ttf',
  variable: '--font-badges',
  weight: '500',
  display: 'block',
})

export default function RootLayout({ children }) {
  return (
    <html className={`${bdoGrotesk.variable} ${libreCaslon.variable} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

#### Step 2: Tailwind 설정

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'light-1': '#fefaf3',
        'light-2': '#f1eadd',
        'dark': '#000000',
        'dark-12': '#2f2c251f',
        'dark-7': '#2f2c250f',
        'glass-surface': '#fefaf399',
        'glass-border': '#ffffff66',
        'success': '#a9ee81',
        'error': '#f5aaaa',
      },
      fontFamily: {
        body: ['var(--font-body)', 'Arial', 'sans-serif'],
        headings: ['var(--font-headings)', 'Times New Roman', 'sans-serif'],
        badges: ['var(--font-badges)', 'Trebuchet MS', 'sans-serif'],
      },
      spacing: {
        '0.5x': '12px',
        '0.75x': '18px',
        '1x': '24px',
        '1.5x': '36px',
        '2x': '48px',
        '3x': '72px',
        '4x': '96px',
      },
      borderRadius: {
        'button': '9px',
        'input': '9px',
        'card': '6px',
      },
      maxWidth: {
        'container': '1440px',
      },
    },
  },
}
```

#### Step 3: 글로벌 CSS

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-light-1: #fefaf3;
  --color-light-2: #f1eadd;
  --color-dark: #000000;
  --navbar-height: 72px;
}

body {
  background-color: var(--color-light-1);
  font-family: var(--font-body);
  color: var(--color-dark);
  font-size: 14px;
  line-height: 1.4;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Headings */
h1, h2, h3, h4, h5 {
  font-family: var(--font-headings);
  font-weight: 400;
}
```

### 9.2 폰트 파일 복사

```bash
# Webflow 폰트를 Next.js 프로젝트로 복사
cp /Users/cosmos/Downloads/outsome.webflow/fonts/* ./public/fonts/
```

### 9.3 컴포넌트 예시

```tsx
// components/ui/button.tsx
interface ButtonProps {
  children: React.ReactNode
  variant?: 'default' | 'light-2' | 'light'
  size?: 'default' | 'small'
  href?: string
}

export function Button({ children, variant = 'default', size = 'default', href }: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all rounded-button'
  
  const variants = {
    default: 'bg-dark text-light-1 hover:opacity-90',
    'light-2': 'bg-light-2 text-dark hover:opacity-90',
    light: 'bg-light-1/30 text-light-1 hover:bg-light-1 hover:text-dark',
  }
  
  const sizes = {
    default: 'h-12 px-6',
    small: 'h-[42px] px-[18px]',
  }
  
  const className = `${baseStyles} ${variants[variant]} ${sizes[size]}`
  
  if (href) {
    return <a href={href} className={className}>{children}</a>
  }
  
  return <button className={className}>{children}</button>
}
```

---

## 문서 끝

declare module "pdfkit" {
  import { EventEmitter } from "events"
  import type { Stream } from "stream"

  class PDFDocument extends EventEmitter {
    constructor(options?: PDFKit.DocumentOptions)

    addPage(options?: PDFKit.DocumentOptions): this
    font(src: string, family?: string): this
    fontSize(size: number): this
    text(text: string, x?: number, y?: number, options?: PDFKit.TextOptions): this
    moveDown(lines?: number): this
    moveUp(lines?: number): this
    lineCap(style: string): this
    lineJoin(style: string): this
    lineWidth(width: number): this
    dash(length: number, options?: PDFKit.DashOptions): this
    undash(): this
    moveTo(x: number, y: number): this
    lineTo(x: number, y: number): this
    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): this
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): this
    rect(x: number, y: number, w: number, h: number): this
    roundedRect(x: number, y: number, w: number, h: number, r?: number): this
    ellipse(x: number, y: number, r1: number, r2?: number): this
    circle(x: number, y: number, radius: number): this
    polygon(...points: number[][]): this
    path(path: string): this
    fill(color?: string | PDFKit.ColorValue): this
    stroke(color?: string | PDFKit.ColorValue): this
    fillAndStroke(fillColor?: string | PDFKit.ColorValue, strokeColor?: string | PDFKit.ColorValue): this
    end(): void
    pipe(destination: Stream): this
    image(src: string | Buffer, x?: number, y?: number, options?: PDFKit.ImageOptions): this

    // Add more methods as needed
    page: {
      width: number
      height: number
    }
  }

  namespace PDFKit {
    interface DocumentOptions {
      size?: string | [number, number]
      margin?: number | { top: number; left: number; bottom: number; right: number }
      bufferPages?: boolean
      autoFirstPage?: boolean
      layout?: "portrait" | "landscape"
      info?: {
        Title?: string
        Author?: string
        Subject?: string
        Keywords?: string
        CreationDate?: Date
        ModDate?: Date
      }
      [key: string]: any
    }

    interface TextOptions {
      align?: "left" | "center" | "right" | "justify"
      width?: number
      height?: number
      ellipsis?: boolean | string
      columns?: number
      columnGap?: number
      indent?: number
      paragraphGap?: number
      lineGap?: number
      wordSpacing?: number
      characterSpacing?: number
      fill?: boolean
      stroke?: boolean
      underline?: boolean
      link?: string
      continued?: boolean
      [key: string]: any
    }

    interface DashOptions {
      space?: number
      phase?: number
    }

    interface ImageOptions {
      width?: number
      height?: number
      scale?: number
      fit?: [number, number]
      align?: "center" | "right"
      valign?: "center" | "bottom"
      [key: string]: any
    }

    type ColorValue = string | [number, number, number] | [number, number, number, number]
  }

  export = PDFDocument
}

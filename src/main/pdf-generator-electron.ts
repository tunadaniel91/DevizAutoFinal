import { BrowserWindow } from "electron"
import { generateDevizHTML, generateIstoricHTML } from "./pdf-template-html"
import * as fs from "fs"

export async function generateDevizPDF(data: any, outputPath: string): Promise<void> {
  let win: BrowserWindow | null = null

  try {
    win = new BrowserWindow({
      show: false,
      webPreferences: {
        offscreen: true,
      },
    })

    // Generate HTML content
    const htmlContent = generateDevizHTML(data)

    // Load HTML content
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)

    // Wait for content to render
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Generate PDF using Electron's native method
    const pdfData = await win.webContents.printToPDF({
      pageSize: "A4",
      printBackground: true,
      margins: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    })

    // Write PDF to file
    fs.writeFileSync(outputPath, pdfData)
  } catch (error) {
    console.error("Error generating PDF with Electron:", error)
    throw error
  } finally {
    if (win && !win.isDestroyed()) {
      win.close()
    }
  }
}

export async function generateIstoricDevizPDF(data: any, outputPath: string): Promise<void> {
  let win: BrowserWindow | null = null

  try {
    win = new BrowserWindow({
      show: false,
      webPreferences: {
        offscreen: true,
      },
    })

    const htmlContent = generateIstoricHTML(data)

    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)

    await new Promise((resolve) => setTimeout(resolve, 500))

    const pdfData = await win.webContents.printToPDF({
      pageSize: "A4",
      printBackground: true,
      margins: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    })

    fs.writeFileSync(outputPath, pdfData)
  } catch (error) {
    console.error("Error generating historic PDF with Electron:", error)
    throw error
  } finally {
    if (win && !win.isDestroyed()) {
      win.close()
    }
  }
}

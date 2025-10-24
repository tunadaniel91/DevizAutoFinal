// Type definitions for Electron
// This is a simplified version to help with the build process

declare namespace Electron {
  interface App {
    getPath(name: string): string
    on(event: string, listener: Function): this
    quit(): void
  }

  interface BrowserWindow {
    loadURL(url: string): Promise<void>
    loadFile(filePath: string): Promise<void>
    maximize(): void
    on(event: string, listener: Function): this
    webContents: WebContents
  }

  interface WebContents {
    on(event: string, listener: Function): this
    send(channel: string, ...args: any[]): void
  }

  interface IpcMain {
    on(channel: string, listener: (event: IpcMainEvent, ...args: any[]) => void): this
    handle(channel: string, listener: (event: IpcMainEvent, ...args: any[]) => Promise<any> | any): this
  }

  interface IpcMainEvent {
    reply(channel: string, ...args: any[]): void
  }

  interface Dialog {
    showSaveDialog(options: any): Promise<{ canceled: boolean; filePath?: string }>
  }
}

declare module "electron" {
  export const app: Electron.App
  export const BrowserWindow: any
  export const ipcMain: Electron.IpcMain
  export const dialog: Electron.Dialog
}

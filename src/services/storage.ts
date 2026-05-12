import { get, set } from 'idb-keyval';

const HANDLE_KEY = 'tcm-workspace-handle';

export class FileSystemStorage {
  private handle: FileSystemDirectoryHandle | null = null;

  async connect(): Promise<boolean> {
    if (!('showDirectoryPicker' in window)) {
      alert('您的浏览器版本过低或不支持本地目录访问功能。\n请使用最新版的 Chrome、Edge 或 Opera 浏览器。');
      return false;
    }

    try {
      console.log('Requesting directory picker...');
      this.handle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });
      console.log('Directory handle obtained:', this.handle.name);
      await set(HANDLE_KEY, this.handle);
      return true;
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log('User cancelled the picker.');
      } else {
        console.error('Failed to select directory:', e);
        alert('选择文件夹失败: ' + e.message);
      }
      return false;
    }
  }

  async disconnect() {
    this.handle = null;
    await set(HANDLE_KEY, null);
  }

  async isConnected(): Promise<boolean> {
    if (this.handle) return true;
    const stored = await get<FileSystemDirectoryHandle>(HANDLE_KEY);
    if (stored) {
      this.handle = stored;
      // We need to check if we still have permission
      const state = await this.handle.queryPermission({ mode: 'readwrite' });
      return state === 'granted';
    }
    return false;
  }

  async requestPermission(): Promise<boolean> {
    if (!this.handle) {
      const stored = await get<FileSystemDirectoryHandle>(HANDLE_KEY);
      if (stored) this.handle = stored;
    }
    
    if (this.handle) {
      const state = await this.handle.requestPermission({ mode: 'readwrite' });
      return state === 'granted';
    }
    return false;
  }

  private async getDirectory(path: string, create = true): Promise<FileSystemDirectoryHandle | null> {
    if (!this.handle) return null;
    const parts = path.split('/').filter(Boolean);
    let current = this.handle;
    for (const part of parts) {
      current = await current.getDirectoryHandle(part, { create });
    }
    return current;
  }

  async writeJSON(path: string, filename: string, data: any) {
    if (!this.handle) throw new Error('Not connected');
    const dir = await this.getDirectory(path);
    if (!dir) throw new Error(`Directory ${path} not found`);
    
    const fileHandle = await dir.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
  }

  async writeBlob(path: string, filename: string, blob: Blob) {
    if (!this.handle) throw new Error('Not connected');
    const dir = await this.getDirectory(path);
    if (!dir) throw new Error(`Directory ${path} not found`);
    
    const fileHandle = await dir.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
  }

  async getFileUrl(path: string, filename: string): Promise<string | null> {
    if (!this.handle) return null;
    try {
      const dir = await this.getDirectory(path, false);
      if (!dir) return null;
      const fileHandle = await dir.getFileHandle(filename);
      const file = await fileHandle.getFile();
      return URL.createObjectURL(file);
    } catch (e) {
      return null;
    }
  }

  async readJSON(path: string, filename: string): Promise<any> {
    if (!this.handle) return null;
    try {
      const dir = await this.getDirectory(path, false);
      if (!dir) return null;
      const fileHandle = await dir.getFileHandle(filename);
      const file = await fileHandle.getFile();
      const text = await file.text();
      return JSON.parse(text);
    } catch (e) {
      return null;
    }
  }

  async listFiles(path: string): Promise<string[]> {
    if (!this.handle) return [];
    try {
      const dir = await this.getDirectory(path, false);
      if (!dir) return [];
      const files: string[] = [];
      for await (const entry of dir.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.json')) {
          files.push(entry.name);
        }
      }
      return files;
    } catch (e) {
      return [];
    }
  }

  async deleteFile(path: string, filename: string) {
    if (!this.handle) return;
    try {
      const dir = await this.getDirectory(path, false);
      if (!dir) return;
      await dir.removeEntry(filename);
    } catch (e) {
      console.error('Delete failed', e);
    }
  }
}

export const storage = new FileSystemStorage();

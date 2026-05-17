import { Herb, Prescription } from '../types';
import { storage } from './storage';

export const api = {
  // Journals
  async getJournals() {
    console.log('Fetching journals from local storage...');
    const files = await storage.listFiles('journals');
    console.log(`Found ${files.length} files in journals/ folder:`, files);
    
    const journalEntries = await Promise.all(
      files.map(async (file) => {
        const date = file.replace('.json', '');
        const content = await storage.readJSON('journals', file);
        return { date, content };
      })
    );

    const allData: Record<string, any> = {};
    for (const { date, content } of journalEntries) {
      if (content) {
        allData[date] = {
          note: content.note || content.note_content,
          tcm: content.tcm || content.tcm_content,
          genNote: content.genNote || content.gen_note_content
        };
      }
    }
    return allData;
  },

  async getJournal(date: string) {
    const content = await storage.readJSON('journals', `${date}.json`);
    if (!content) return null;
    return {
      note: content.note_content,
      tcm: content.tcm_content,
      genNote: content.gen_note_content
    };
  },

  async saveJournal(date: string, data: any) {
    // data has note_content, tcm_content, gen_note_content
    await storage.writeJSON('journals', `${date}.json`, data);
    return data;
  },

  // Herbs
  async getHerbs(): Promise<Herb[]> {
    const files = await storage.listFiles('herbs');
    const herbEntries = await Promise.all(
      files.map(file => storage.readJSON('herbs', file))
    );
    return herbEntries.filter((h): h is Herb => h !== null);
  },

  async getHerb(name: string): Promise<Herb | null> {
    return storage.readJSON('herbs', `${name}.json`);
  },

  async createHerb(herb: Herb): Promise<Herb> {
    await storage.writeJSON('herbs', `${herb.name}.json`, herb);
    return herb;
  },

  async updateHerb(id: string, herb: Herb): Promise<Herb> {
    await storage.writeJSON('herbs', `${herb.name}.json`, herb);
    return herb;
  },

  async deleteHerb(name: string): Promise<void> {
    await storage.deleteFile('herbs', `${name}.json`);
  },

  async uploadHerbImage(filename: string, blob: Blob): Promise<string> {
    const ext = filename.split('.').pop() || 'jpg';
    const localName = `image_${Date.now()}.${ext}`;
    await storage.writeBlob('herbs/images', localName, blob);
    return `local://${localName}`;
  },

  async resolveImageUrl(url: string): Promise<string> {
    if (url.startsWith('local://')) {
      const filename = url.replace('local://', '');
      const localUrl = await storage.getFileUrl('herbs/images', filename);
      return localUrl || url;
    }
    return url;
  },

  // Prescriptions
  async getPrescriptions(): Promise<Prescription[]> {
    const list = await storage.readJSON('', 'prescriptions.json');
    return list || [];
  },

  async createPrescription(prescription: Prescription): Promise<Prescription> {
    const list = await this.getPrescriptions();
    list.push(prescription);
    await storage.writeJSON('', 'prescriptions.json', list);
    return prescription;
  }
};

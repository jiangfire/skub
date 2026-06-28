declare module "adm-zip" {
  export default class AdmZip {
    constructor(source: Buffer | string);
    getEntries(): Array<{
      entryName: string;
      isDirectory: boolean;
      header?: { compressedSize: number };
      getData(): Buffer;
    }>;
    addFile(path: string, data: Buffer): void;
    toBuffer(): Buffer;
  }
}

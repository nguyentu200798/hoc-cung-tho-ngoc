declare module 'mammoth' {
  interface MammothResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }

  const mammoth: {
    convertToHtml(input: { path?: string; buffer?: Buffer }): Promise<MammothResult>;
  };

  export default mammoth;
}

declare module 'word-extractor' {
  interface ExtractedDocument {
    getBody(): string;
    getHeaders(options?: { includeFooters?: boolean }): string;
    getFootnotes(): string;
    getEndnotes(): string;
  }

  export default class WordExtractor {
    extract(filePathOrBuffer: string | Buffer): Promise<ExtractedDocument>;
  }
}

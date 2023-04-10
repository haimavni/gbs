import * as pdfjsLib from "pdfjs-dist";

// Define an interface for the PDF document
interface PdfDocument {
    numPages: number;
    getPage(pageNumber: number): Promise<PdfPage>;
}

// Define an interface for the PDF page
interface PdfPage {
    pageNumber: number;
    getViewport(scale: number): pdfjsLib.PageViewport;
    //getTextContent(): Promise<pdfjsLib.TextContent>;
}

export class PdfLib {
    pdfLib;

    constructor(pdfLib) {
        this.pdfLib = pdfLib;
    }

    async loadDocument(url: string): Promise<PdfDocument> {
        //const loadPdf = async (url: string): Promise<PdfDocument> => {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdfDocument = await loadingTask.promise;

        return {
            numPages: pdfDocument.numPages,
            getPage: async (pageNumber: number): Promise<PdfPage> => {
                const pdfPage = await pdfDocument.getPage(pageNumber);
                return {
                    pageNumber,
                    getViewport: (scale: number) =>
                        pdfPage.getViewport({ scale }), //,
                    //getTextContent: async () => pdfPage.getTextContent(),
                };
            },
        };
    }
}
//}
// Load the PDF file

// Example usage
// const url = 'https://example.com/example.pdf';
// const pdf = await loadPdf(url);
// const numPages = pdf.numPages;
// const page = await pdf.getPage(1);
// const viewport = page.getViewport(1.0);
// const textContent = await page.getTextContent();
// console.log(textContent.items.map(item => item.str).join(' '));

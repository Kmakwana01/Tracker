import nodemailer from "nodemailer";

interface LineInfo {
    fileName: string;
    line: string;
}

export const extractLineNumber = function(error: any) {
    const stackTrace = error.stack || '';
    const matches = stackTrace.match(/at\s+(.+)\s+\((.+):(\d+):(\d+)\)/);

    if (matches && matches.length >= 5) {
        const functionName = matches[1];
        const fileName = matches[2];
        const lineNumber = matches[3];
        const columnNumber = matches[4];
        
        return {
            fileName: fileName,
            line: `Error in function '${functionName}' in line ${lineNumber}, column ${columnNumber}`
        } as LineInfo; // Cast to LineInfo type
    }

    return 'Error details not found';
}

export const main = async function(error: any, req: any, line: LineInfo | string) {
    const api = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const body = JSON.stringify(req.body, null, 2);
    const errorMessage = error.message;
    
    let lines: string;
    let fileName: string;

    if (typeof line === 'string') {
        lines = line; // Handle the case where line is a string
        fileName = ''; // You may want to handle this case appropriately
    } else {
        lines = line.line;
        fileName = line.fileName;
    }

    const formattedData = `\napi: ${api}\n\nbody: ${body}\n\nerror: ${errorMessage}\n\nfileName: ${fileName}\n\nline: ${lines}`;
    console.log(formattedData)
    
    let testAccount = await nodemailer.createTestAccount();
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: "testkmsof@gmail.com",
            pass: "itrzefxqvjnuokjv",
        },
    });

    let info = await transporter.sendMail({
        from: "testkmsof@gmail.com",
        to: 'bhautik@kmsoft.org',
        subject: "Tracker - Error Email",
        text: `An error occurred: ${formattedData}`,
        //html: `An error occurred: \n <h2 style="color:#fff"> ${data} <\h2>`,
    });

    console.log("Message sent: %s", info.messageId);
    // console.log(
    //     "Preview URL: %s",
    //     nodemailer.getTestMessageUrl(info)
    // );
}

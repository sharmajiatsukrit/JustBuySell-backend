import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import dotenv from "dotenv";
import numWords from "num-words";
dotenv.config();
const uploadPath = process.env.UPLOAD_PATH;

// Your HTML generation function remains the same
export function generateInvoiceHtml(data: any): string {
    const itemRows = data.transactions
        .map((item: any) => {
            return `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e0e0e0; text-align: left;">${item.item}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e0e0e0; text-align: left;">${item.dateOfTxn}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e0e0e0; text-align: left;">${item.particular}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e0e0e0; text-align: right;">₹${item.amount}</td>
        </tr>
      `;
        })
        .join("");

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Invoice</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
          font-family: Arial, "Helvetica Neue", sans-serif;
        }
      </style>
    </head>
    <body>
      <div style="min-height: 100vh; background-color: #f5f5f5; padding: 20px; font-family: 'Plus Jakarta Sans', sans-serif;">
        <div style="max-width: 800px; margin: 0 auto; background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 0;">
          <div style="padding: 24px;">
            <h1 style="font-size: 32px; font-weight: bold; text-align: center; margin: 0 0 24px 0; color: #333;">
              Invoice
            </h1>

            <!-- Header Section -->
            <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 16px; margin: 16px 0;">
              <div style="display: grid; grid-template-columns: 1fr; gap: 16px;">
                <div>
                  <div style="width: 158px; display: flex; align-items: center; justify-content: center; border-radius: 4px;">
                    <img style="width: 100%" src="https://admin.justbuysell.com/static/media/logo.bb28cc167b6136c0d4f8.png" />
                  </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                  <div>
                    <div style="font-weight: bold; margin-bottom: 8px;">Billed By:</div>
                    <div style="font-size: 14px; color: #666; line-height: 1.5;">
                      SSS Trade Zone Private Limited<br />
                      Khasra No. 19/4, Khamruddin Nagar, Najafgarh Road, Nangloi, Delhi - 110041<br />
                      GSTIN: 07AAOCS3727K1ZV<br />
                      PAN: AAOCS3727K<br />
                    </div>
                  </div>
                  <div>
                    <div style="font-weight: bold; margin-bottom: 8px;">Bill to:</div>
                    <div style="font-size: 14px; color: #666; line-height: 1.5;">
                      ${data.userDetails.name}<br />
                      ${data.userDetails.company}<br />
                      ${data.userDetails.address1}<br />
                      ${data.userDetails.landmark}<br />
                      GSTIN: ${data.userDetails.gstNumber}<br />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Invoice Details -->
            <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 16px; margin-bottom: 16px;">
              <div style="font-weight: bold; margin-bottom: 8px;">Details</div>
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 8px 0;" />
             <div style="display: flex; gap: 16px;">
                <div style="flex: 1;">
                  <div style="font-size: 14px; color: #666;">Invoice Number:</div>
                  <div style="font-weight: bold;">${data.invoiceDetails.invoiceNumber}</div>
                </div>
                <div style="flex: 1;">
                  <div style="font-size: 14px; color: #666;">Invoice Date:</div>
                  <div style="font-weight: bold;">${data.invoiceDetails.invoiceDate}</div>
                </div>
                <div style="flex: 2;">
                  <div style="font-size: 14px; color: #666;">Invoice Period:</div>
                  <div style="font-weight: bold;">${data?.startOfMonth} to: ${data?.endOfMonth}</div>
                </div>
                <div style="flex: 1;">
                  <div style="font-size: 14px; color: #666;">HSN/SAC</div>
                  <div style="font-weight: bold;">99843100</div>
                </div>
              </div>

            </div>

            <!-- Table -->
            <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 16px; margin-top: 16px;">
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #f5f5f5;">
                    <th style="padding: 12px 8px; text-align: left; border-bottom: 1px solid #e0e0e0; font-weight: bold;">S. No.</th>
                    <th style="padding: 12px 8px; text-align: left; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Date</th>
                    <th style="padding: 12px 8px; text-align: left; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Particular</th>
                    <th style="padding: 12px 8px; text-align: right; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Lead Cost(₹)</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>
            </div>

            <!-- Summary -->
            <div style="padding: 4px 10px;">
            <table style="width: 100%; font-family: Arial, sans-serif; font-size: 14px; border-collapse: collapse;">
              <tr>
                <!-- Left cell: Total (in words) -->
                <td style="padding: 8px 0; text-align: left; font-weight: bold; width: 70%; vertical-align: top;">
                
                  <span style="margin-right: 8px;">Total (in words):</span>
                  <span>${amountInWords(data.subTotalAmount)}</span>
                
                </td>
                <!-- Right cell: First summary item -->
                <td style="width: 30%; vertical-align: top; padding: 8px 0;">
                  <div style="display: flex; justify-content: space-between;font-weight: bold;">
                    <span>Total Amount</span>
                    <span>₹${data.subTotalAmount}</span>
                  </div>
                </td>
              </tr>
                  ${generateSummaryRow("Discount Applied <br/>(- Free Credit)", data.totalDiscount)}
                  ${generateSummaryRow("Taxable Amount", data.totalTaxableAmount)}
                  ${data.cgstLabel ? generateSummaryRow("CGST (9%)", data.totalCGst) : ""}
                  ${data.sgstLabel ? generateSummaryRow("SGST (9%)", data.totalSGst) : ""}
                  ${data.igstLabel ? generateSummaryRow("IGST (18%)", data.totalIGst) : ""}
                  ${generateSummaryRow("Total INR", data.totalAmount, true)}
            </table>
              <div style="clear: both;"></div>
            </div>

            <!-- Footer -->
            <div style="padding: 0px 5px;">
              <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 8px 16px; margin-top: 21px;">
                <div style="font-size: 14px; color: #666; line-height: 1.5;">
                  Note: Unless otherwise stated, tax on this invoice is not payable under reverse charge. Supplies under reverse charge are to be mentioned separately.
                </div>
              </div>
              <div style="margin-top: 8px;">
                <div style="font-size: 14px; color: #666; line-height: 1.5; text-align: center; font-weight: 700;">
                  For any enquiry, reach out via email at accounts@justbuysell.com.
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
function amountInWords(amount: string | number): string {
    let num = Number(amount);
    if (isNaN(num)) return "";
    // Split into rupees and paise
    const [rupees, paise] = num.toFixed(2).split(".");
    let words = "";
    const rupeeNum = Number(rupees);
    const paiseNum = Number(paise);

    if (rupeeNum > 0) {
        words += toTitleCase(numWords(rupeeNum)) + (rupeeNum === 1 ? " Rupee" : " Rupees");
    }
    if (paiseNum > 0) {
        // Only add 'and' if rupees part is present
        if (words) {
            words += " and ";
        }
        words += toTitleCase(numWords(paiseNum)) + (paiseNum === 1 ? " Paise" : " Paise");
    }
    if (words) {
        words += " Only";
    }
    return words;
}


// Utility to format to Title Case with spaces
function toTitleCase(str: string): string {
    return str
        .replace(/-/g, " ")
        .replace(/\s+/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
        .trim();
}

function generateSummaryRow(label: string, value: any, bold = false): string {
    return `
   <tr style="${bold ? "font-weight: bold;" : ""}">
                <td></td>
                <td style="padding: 5px 0;">
                  <div style="display: flex; justify-content: space-between;">
                    <span>${label}</span>
                    <span>₹${value}</span>
                  </div>
                </td>
              </tr>
    <div style="display: flex; justify-content: space-between; margin-top: 11px; ${bold ? "font-weight: bold;" : ""}">
      <span style="width: 70%; text-align: right;margin-right:8px"></span>
      <span style="width: 28%;text-align: right;"></span>
    </div>
  `;
}

export async function generateInvoicePDF(data: any, filename: string) {
    try {
        // console.log("Generating PDF for data:", data);
        // console.log(data);
        const htmlContent = generateInvoiceHtml(data);
        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();

        // Set the HTML content
        await page.setContent(htmlContent, {
            waitUntil: "networkidle0", // Wait for all resources to load
        });

        // Generate PDF
        const pdf = await page.pdf({
            format: "A4",
            margin: {
                top: "0px",
                right: "0px",
                bottom: "0px",
                left: "0px",
            },
            printBackground: true, // Include CSS backgrounds
        });

        await browser.close();
        // Save to file
        const filePath = path.resolve(uploadPath as string, filename);
        fs.writeFileSync(filePath, pdf);
        return filePath;
    } catch (err) {
        console.error("Error generating PDF:", err);
        // throw err;
    }
}

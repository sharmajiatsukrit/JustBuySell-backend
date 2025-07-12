import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import dotenv from 'dotenv';
dotenv.config(); 
const uploadPath = process.env.UPLOAD_PATH;

// Your HTML generation function remains the same
export function generateInvoiceHtml(data: any): string {
    const itemRows = data.transactions
        .map((item:any) => {
            const amount = (item.amount || 0).toFixed(2);
            return `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e0e0e0; text-align: left;">${item.item}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e0e0e0; text-align: left;">${item.description}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e0e0e0; text-align: right;">₹${item.amount.toFixed(2)}</td>
      </tr>
    `;
        })
        .join("");
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
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

              <!-- Title -->
              <h1 style="font-size: 32px; font-weight: bold; text-align: center; margin: 0 0 24px 0; color: #333;">
                Invoice
              </h1>

              <!-- Header Section -->
              <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 16px; margin: 16px 0;">
                <div style="display: grid; grid-template-columns: 1fr; gap: 16px;">
                  <div>
                    <div style="width: 158px; display: flex; align-items: center; justify-content: center; border-radius: 4px;">
                      <img style="width: 100%" src="https://admin.justbuysell.com/static/media/logo.bb28cc167b6136c0d4f8.png"/>
                    </div>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                      <div style="font-weight: bold; margin-bottom: 8px;">Invoice number: 5118575990</div>
                      <div style="font-size: 14px; color: #666; line-height: 1.5;">
                        Company Address<br>
                        GSTIN: 06AACCG0527D1ZB<br>
                        PAN: AACCG0527D
                      </div>
                    </div>
                    <div>
                      <div style="font-weight: bold; margin-bottom: 8px;">Bill to:</div>
                      <div style="font-size: 14px; color: #666; line-height: 1.5;">
                        ${data.userDetails.name}<br>
                        ${data.userDetails.company}<br>
                        ${data.userDetails.address2}<br>
                        ${data.userDetails.address2}<br>
                        GSTIN: ${data.userDetails.gstNumber}<br>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Invoice Details Section -->
              <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 16px; margin-bottom: 16px;">
                <div style="font-weight: bold; margin-bottom: 8px;">Details</div>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 8px 0;">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                  <div>
                    <div style="font-size: 14px; color: #666;">Invoice number</div>
                    <div style="font-weight: bold;">${data.invoiceDetails.invoiceNumber}</div>
                  </div>
                  <div>
                    <div style="font-size: 14px; color: #666;">Invoice date</div>
                    <div style="font-weight: bold;">${data.invoiceDetails.invoiceDate}</div>
                  </div>
                </div>
              </div>

              <!-- Summary Section -->
              <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 16px; margin-bottom: 16px;">
                <div style="font-weight: bold; margin-bottom: 8px;">Summary for ${data?.startOfMonth} to ${data?.endOfMonth}</div>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 8px 0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                  <div>
                    <div style="font-size: 14px; color: #666;">Subtotal in INR</div>
                    <div style="font-weight: bold;">₹${data.summaryDetails.subTotal.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style="font-size: 14px; color: #666;">Integrated GST (18%)</div>
                    <div style="font-weight: bold;">₹${data.summaryDetails.totalGst.toFixed(2)}</div>
                  </div>
                  <div style="grid-column: span 2;">
                    <div style="font-size: 18px; font-weight: bold; margin-top: 8px;">Total in INR: ₹${data.summaryDetails.total.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <!-- Footer Section -->
              <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 16px; margin-bottom: 16px;">
                <div style="font-size: 14px; color: #666; line-height: 1.5; margin-bottom: 8px;">
                  Tax should not be deducted on the GST component charged on the invoice as per circular
                  no. 23 of 2017 dated 19 July 2017 issued by the Central Board of Direct Taxes,
                  Ministry of Finance, Govt of India.
                </div>
                <div style="font-size: 14px; color: #666; line-height: 1.5;">
                  Note: Unless otherwise stated, tax on this invoice is not payable under reverse
                  charge. Supplies under reverse charge are to be mentioned separately.
                </div>
              </div>

              <!-- Table Section -->
              <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 16px; margin-top: 16px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background-color: #f5f5f5;">
                      <th style="padding: 12px 8px; text-align: left; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Item</th>
                      <th style="padding: 12px 8px; text-align: left; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Description</th>
                      <th style="padding: 12px 8px; text-align: right; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Amount(₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemRows}
                    <tr>
                      <td colspan="3" style="padding: 12px 8px; border-bottom: 1px solid #e0e0e0; text-align: right;"><span style="margin-right: 14px;">Subtotal in INR</span> ₹${data.subTotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colspan="3" style="padding: 12px 8px; border-bottom: 1px solid #e0e0e0; text-align: right;"><span style="margin-right: 14px;">Integrated GST (18%)</span> ₹${data.totalGst.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colspan="3" style="padding: 12px 8px; font-weight: bold; text-align: right;"><span style="margin-right: 14px;">Total in INR</span> ₹${data.totalAmount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>


  `;
}

export async function generateInvoicePDF(data: any, filename: string) {
    try {
      console.log("hello2")
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
        console.log(`✅ PDF generated: ${filePath}`);
        return filePath;
    } catch (err) {
        console.error("Error generating PDF:", err);
        // throw err;
    }
}


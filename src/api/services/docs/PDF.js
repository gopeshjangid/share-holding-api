const ejs = require("ejs");
const fs = require("fs");
const puppeteer = require("puppeteer");
const path = require("path");
const filePath = path.join(__dirname, "test.ejs");

const generatePdf = (path, data, options) => {
	return new Promise((resolve, reject) => {
		fs.readFile(path, { encoding: "utf8" }, async function (err, content) {
			if (err) {
				return reject(`failed to read file ${path} Error:${err}`);
			}

			if (!data) {
				return reject("Data is required");
			}

			try {
				content = ejs.render(content, data);

				const browser = await puppeteer.launch({
					headless: false,
					args: ["--no-sandbox"],
				});
				const page = await browser.newPage();

				// We set the page content as the generated html by handlebars
				await page.setContent(content);

				// we Use pdf function to generate the pdf in the same folder as this file.
				const generated = await page.pdf({
					path: data.fileName || "File.pdf",
					format: "A4",
					displayHeaderFooter: true,
					margin: { left: 10, right: 10 },
					...options,
				});

				await browser.close();
				resolve(generated);
			} catch (e) {
				reject(`Error in generating pdf Error: ${e}`);
			}
		});
	});
};
module.exports = {
	generatePdf,
};

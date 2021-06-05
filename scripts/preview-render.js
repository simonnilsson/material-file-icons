const puppeteer = require("puppeteer");
const { getAllIcons } = require('../dist');

async function renderImage() {

  const icons = getAllIcons().sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));

  const html = icons.map(i => `<span style="margin:8px 0px;width:196px;height:32px;display:inline-block;">` + 
      `<div style="width:32px;height:32px;display:inline-block;">${i.svg}</div>` +
      `<p style="padding-left:8px;height:32px; width:152px;vertical-align:top;line-height:32px;font-family:Arial;display:inline-block;">${i.name}</p>` +
      `</span>`
    )
    .join('');
 
  const browser = await puppeteer.launch({
    defaultViewport: { width: 980, height: Math.ceil(icons.length / 5) * 48 },
  });

  const page = await browser.newPage();
  await page.setContent(html);
  await page.addStyleTag({content: '*{margin:0;padding:0}'});
  
  await page.screenshot({
    path: "preview.png",
    omitBackground: true,
  });
  
  await page.close();
  await browser.close();
}

renderImage();
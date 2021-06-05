const React = require('react');
const ReactDOMServer = require("react-dom/server");
const puppeteer = require("puppeteer");
const { FileIcon, getAllIcons } = require('../dist');

async function renderImage() {
 
  const icons = getAllIcons()
    .sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)) 
    .map(i => React.createElement('span', { key: i.name, style: { margin: '8px 0', width: 196, height: 32, display: 'inline-block' } }, [
      React.createElement(FileIcon, { key: 'icon', icon: i, style: { width: 32, height: 32, display: 'inline-block'  } }, null),
      React.createElement('p', { key: 'name', style: {  paddingLeft: 8, height: 32, width: 152, verticalAlign: 'top', lineHeight: '32px', fontFamily: 'Arial', display: 'inline-block'  } }, i.name)
    ]));

  const html = ReactDOMServer.renderToStaticMarkup(React.createElement(React.Fragment, null, icons));

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
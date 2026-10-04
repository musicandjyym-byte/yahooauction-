const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
(async () => {
 const browser = await chromium.launch({headless:true});
 try {
  const page = await browser.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  const generate=()=>page.getByRole('button',{name:'連絡文を作成'}).click();
  await generate();assert.match(await page.locator('#errors').textContent(),/運送会社/);assert.equal(await page.locator('#output').inputValue(),'');
  await page.selectOption('#carrier','佐川急便');await page.fill('#date','2026-10-05');await page.fill('#tracking','1234-5678-9012');await generate();
  assert.match(await page.locator('#output').inputValue(),/ご落札/);assert.match(await page.locator('#output').inputValue(),/2026年10月5日に商品を発送/);
  await page.selectOption('#market','メルカリShops');assert.equal(await page.locator('#output').inputValue(),'');await generate();assert.match(await page.locator('#output').inputValue(),/ご購入/);
  await page.selectOption('#kind','delay');await generate();assert.match(await page.locator('#errors').textContent(),/変更有無/);
  await page.selectOption('#change','same');await page.fill('#reason','集荷漏れ');await generate();assert.match(await page.locator('#output').inputValue(),/変更はございません/);assert.match(await page.locator('#output').inputValue(),/発送する予定/);
  await page.selectOption('#change','changed');await generate();assert.match(await page.locator('#output').inputValue(),/新しい番号/);
  await page.selectOption('#change','pending');await generate();assert.match(await page.locator('#output').inputValue(),/発送後に改めて/);assert.doesNotMatch(await page.locator('#output').inputValue(),/1234/);
  await page.selectOption('#kind','correction');await page.fill('#tracking','abc');await generate();assert.match(await page.locator('#errors').textContent(),/半角数字/);
  await page.fill('#tracking','9876-5432');await generate();assert.match(await page.locator('#output').inputValue(),/正しい番号/);assert.doesNotMatch(await page.locator('#output').inputValue(),/2026年/);
  await page.fill('#output','編集した連絡文');await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copied=text;}}}));await page.click('#copy');assert.equal(await page.evaluate(()=>window.copied),'編集した連絡文');
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('unavailable');}}}));await page.click('#copy');assert.match(await page.locator('#status').textContent(),/Ctrl\+C/);
  await page.click('#reset');assert.equal(await page.locator('#output').inputValue(),'');assert.equal(await page.locator('#tracking').inputValue(),'');
  await page.selectOption('#carrier','other');await page.fill('#otherCarrier','テスト配送');await page.fill('#date','2026-10-05');await page.fill('#tracking','1111');await generate();assert.match(await page.locator('#output').inputValue(),/テスト配送/);
  await page.screenshot({path:path.resolve(__dirname,'../../shipping-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);console.log('PASS: required fields, both marketplaces, three templates, tracking branches, editing/copy/fallback, reset, custom carrier, mobile layout');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

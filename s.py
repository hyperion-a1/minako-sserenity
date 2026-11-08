import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(headless=True); pg=await b.new_page(viewport={"width":411,"height":712})
    await pg.goto("http://localhost:8080/painel/sorteios"); await pg.wait_for_timeout(2500)
    await pg.evaluate("window.scrollTo(0,250)"); await pg.wait_for_timeout(400); await pg.screenshot(path="s1.png")
    await pg.get_by_role("button",name="Próximo: Quando").click(); await pg.wait_for_timeout(800); await pg.screenshot(path="s2.png")
    await pg.get_by_role("button",name="Anúncio",exact=False).first.click(); await pg.wait_for_timeout(800)
    print(await pg.locator("#secao-anuncio").is_visible())
    print(pg.url, await pg.evaluate("document.documentElement.scrollWidth"))
    await b.close()
asyncio.run(main())

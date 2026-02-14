import os
import asyncio
from playwright.async_api import async_playwright
from typing import List, Dict, Optional

class BrightDataService:
    def __init__(self):
        self.ws_endpoint = os.getenv("BRIGHTDATA_WS_ENDPOINT")
        if not self.ws_endpoint:
            print("⚠️ BRIGHTDATA_WS_ENDPOINT not found in environment variables")

    async def connect_and_scrape(self, url: str, selector: str) -> List[Dict]:
        """
        Generic method to scrape a list of items from a URL using a selector.
        This provides the base connection logic to BrightData.
        """
        if not self.ws_endpoint:
            return []

        print(f"Connecting to Scraping Browser to fetch: {url}")
        
        async with async_playwright() as p:
            try:
                browser = await p.chromium.connect_over_cdp(self.ws_endpoint)
                context = await browser.new_context()
                page = await context.new_page()
                
                # Set a reasonable timeout
                page.set_default_timeout(60000)
                
                await page.goto(url, wait_until='domcontentloaded')
                
                # Wait for results to appear
                try:
                    await page.wait_for_selector(selector, timeout=15000)
                except Exception:
                    print(f"Selector {selector} not found on {url}")
                    await browser.close()
                    return []

                # Extract data based on the specific site logic (to be passed in or handled by caller)
                # For this generic method, we'll return the page object to be handled by specific methods
                # BUT, since we can't pass the page object out easily working within the context manager,
                # we should implement specific scraping logic inside specific methods.
                pass 
                
                await browser.close()
            except Exception as e:
                print(f"Error scraping {url}: {e}")
                return []
        return []

    async def search_nice_guidelines(self, query: str) -> List[Dict]:
        """Search NICE guidelines"""
        if not self.ws_endpoint:
            return []

        url = f"https://www.nice.org.uk/search?q={query}"
        results = []

        print(f"🔍 Searching NICE for: {query}")

        try:
            async with async_playwright() as p:
                browser = await p.chromium.connect_over_cdp(self.ws_endpoint)
                context = await browser.new_context()
                page = await context.new_page()
                page.set_default_timeout(30000)
                
                await page.goto(url, wait_until='domcontentloaded')
                title = await page.title()
                print(f"   Page Title: {title}")
                
                # NICE search results selector
                try:
                    # Generic wait for body first
                    await page.wait_for_selector('body')
                    
                    # Try to find the results container - use more generic selectors
                    await page.wait_for_selector('.search-results-list, .nice-search-results, #search-results, ul.list-unstyled, main ul', timeout=30000)
                    
                    # Extract data
                    items = await page.evaluate('''() => {
                        const data = [];
                        // Selectors might change, try to find list items
                        const nodes = document.querySelectorAll('.search-results-list > li, ul.list-unstyled > li, main ul > li');
                        
                        nodes.forEach(node => {
                            const titleEl = node.querySelector('h3 a, .media-heading a, a');
                            const summaryEl = node.querySelector('p');
                            
                            if (titleEl && titleEl.innerText.length > 5) { // Ensure it's not a tiny link
                                data.push({
                                    title: titleEl.innerText.trim(),
                                    url: titleEl.href,
                                    summary: summaryEl ? summaryEl.innerText.trim() : '',
                                    type: 'Guideline',
                                    source: 'NICE'
                                });
                            }
                        });
                        return data.slice(0, 5);
                    }''')
                    results.extend(items)
                    
                except Exception as e:
                    print(f"   NICE scrape error: {e}")

                await browser.close()
        except Exception as e:
            print(f"   NICE connection error: {e}")
            
        return results

    async def search_nhs(self, query: str) -> List[Dict]:
        """Search NHS website"""
        if not self.ws_endpoint:
            return []

        url = f"https://www.nhs.uk/search/results?q={query}"
        results = []

        print(f"🔍 Searching NHS for: {query}")

        try:
            async with async_playwright() as p:
                browser = await p.chromium.connect_over_cdp(self.ws_endpoint)
                context = await browser.new_context()
                page = await context.new_page()
                page.set_default_timeout(30000)
                
                await page.goto(url, wait_until='domcontentloaded')
                title = await page.title()
                print(f"   Page Title: {title}")
                
                try:
                    await page.wait_for_selector('main, body', timeout=30000)
                    
                    items = await page.evaluate('''() => {
                        const data = [];
                        // Try various selectors for NHS search results
                        const nodes = document.querySelectorAll('.nhsuk-search__results li, .nhsuk-card, .nhsuk-list--border > li');
                        
                        nodes.forEach(node => {
                            const titleEl = node.querySelector('h2 a') || node.querySelector('.nhsuk-card__heading a') || node.querySelector('a');
                            const summaryEl = node.querySelector('p');
                            
                            if (titleEl && titleEl.innerText) {
                                data.push({
                                    title: titleEl.innerText.trim(),
                                    url: titleEl.href,
                                    summary: summaryEl ? summaryEl.innerText.trim() : '',
                                    type: 'Health Info',
                                    source: 'NHS'
                                });
                            }
                        });
                        return data.slice(0, 5);
                    }''')
                    results.extend(items)
                    
                except Exception as e:
                    print(f"   NHS scrape error: {e}")

                await browser.close()
        except Exception as e:
            print(f"   NHS connection error: {e}")
            
        return results

    async def search_csp(self, query: str) -> List[Dict]:
        """Search Chartered Society of Physiotherapy"""
        if not self.ws_endpoint:
            return []

        url = f"https://www.csp.org.uk/search?search_api_views_fulltext={query}"
        results = []

        print(f"🔍 Searching CSP for: {query}")

        try:
            async with async_playwright() as p:
                browser = await p.chromium.connect_over_cdp(self.ws_endpoint)
                context = await browser.new_context()
                page = await context.new_page()
                
                await page.goto(url, wait_until='domcontentloaded')
                
                try:
                    await page.wait_for_selector('.view-content', timeout=20000)
                    
                    items = await page.evaluate('''() => {
                        const data = [];
                        const nodes = document.querySelectorAll('.search-result');
                        
                        nodes.forEach(node => {
                            const titleEl = node.querySelector('h3 a');
                            const summaryEl = node.querySelector('.search-result__teaser');
                            
                            if (titleEl) {
                                data.push({
                                    title: titleEl.innerText.trim(),
                                    url: titleEl.href,
                                    summary: summaryEl ? summaryEl.innerText.trim() : '',
                                    type: 'Professional Guidance',
                                    source: 'CSP'
                                });
                            }
                        });
                        return data.slice(0, 5);
                    }''')
                    results.extend(items)
                    
                except Exception as e:
                    print(f"CSP scrape error: {e}")

                await browser.close()
        except Exception as e:
            print(f"CSP connection error: {e}")
            
        return results

    async def search_clinical_resources(self, query: str) -> List[Dict]:
        """Aggregator method"""
        
        # In a production app, we might run these in parallel using asyncio.gather
        # For now, sequential to ensure stability with the proxy connection
        
        nice_results = await self.search_nice_guidelines(query)
        nhs_results = await self.search_nhs(query)
        csp_results = await self.search_csp(query)
        
        return nice_results + nhs_results + csp_results

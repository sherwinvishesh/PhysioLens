from dotenv import load_dotenv
import os
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions
from claude_agent_sdk.types import StreamEvent
from typing import List, Dict
import json
import re

load_dotenv()

# Access the API keys from environment variables
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
BRIGHTDATA_API_TOKEN = os.getenv("BRIGHTDATA_API_TOKEN")

if not ANTHROPIC_API_KEY:
    raise ValueError("ANTHROPIC_API_KEY not found in environment variables")
if not BRIGHTDATA_API_TOKEN:
    raise ValueError("BRIGHTDATA_API_TOKEN not found in environment variables")


class BrightDataService:
    """Service for scraping physiology research using BrightData Web MCP and Claude Agent SDK"""
    
    def __init__(self):
        # Configure the Claude agent with BrightData Web MCP
        self.options = ClaudeAgentOptions(
            mcp_servers={
                "bright_data": {
                    "command": "npx",
                    "args": ["-y", "@brightdata/mcp"],
                    "env": {
                        "API_TOKEN": BRIGHTDATA_API_TOKEN,
                        "PRO_MODE": "true"  # Enable Pro mode for full tool access
                    }
                }
            },
            allowed_tools=["mcp__bright_data__*"],  # Enable all Bright Data Web MCP tools
            model="claude-sonnet-4-20250514",  # Use the latest Claude model
            include_partial_messages=True,
            permission_mode="acceptEdits",  # Allow file writing if needed
            max_buffer_size=10 * 1024 * 1024,  # 10MB for handling large responses
        )
    
    async def search_clinical_resources(self, query_text: str) -> List[Dict]:
        """
        Search multiple physiology research journals for relevant information
        
        Args:
            query_text: Search query (e.g., "muscle physiology" or "exercise biomechanics")
            
        Returns:
            List of research articles with title, url, authors, snippet, and source
        """
        
        prompt = f"""Use ONLY the search_engine tool to find research articles about "{query_text}".

IMPORTANT: You MUST get results from ALL THREE sources below. Search each one separately:

1. Search "site:journals.physiology.org {query_text}" - Get 3-4 results from Journal of Applied Physiology
2. Search "site:physoc.onlinelibrary.wiley.com {query_text}" - Get 3-4 results from The Journal of Physiology  
3. Search "site:mayo.edu physiology {query_text}" - Get 3-4 results from Mayo Clinic

For EACH result, extract:
- title
- url (full link)
- authors (if visible in search result)
- snippet (brief description, max 200 chars)
- source (which of the 3 sources)
- pubDate (if visible)
- doi (if visible)

CRITICAL: 
- Use ONLY search_engine tool (fastest)
- Do NOT use scrape, grep, or batch tools
- Return results from ALL 3 sources
- Return ONLY valid JSON array, no markdown

[{{"title":"...","url":"...","authors":"...","snippet":"...","source":"...","pubDate":"...","doi":"..."}}]
"""
        
        try:
            response_text = await self._execute_query(prompt)
            
            # Try to parse the response as JSON
            json_match = re.search(r'\[[\s\S]*\]', response_text)
            if json_match:
                results = json.loads(json_match.group(0))
                return results
            else:
                print(f"Could not extract JSON from response: {response_text[:200]}...")
                return []
                
        except Exception as e:
            print(f"Error in search_clinical_resources: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    async def scrape_physiology_journals(self) -> List[Dict]:
        """
        Scrape the specific physiology journal URLs for latest articles
        
        Returns:
            List of research articles from all three sources
        """
        
        prompt = """Please use the Bright Data Web MCP tools to scrape the following physiology research journal pages and extract article information:

1. Journal of Applied Physiology: https://journals.physiology.org/action/doSearch?AllField=physiology&SeriesKey=jappl
2. The Journal of Physiology: https://physoc.onlinelibrary.wiley.com/toc/14697793/2026/604/3
3. Mayo Clinic Physiology Research: https://www.mayo.edu/research/departments-divisions/department-physiology-biomedical-engineering/research/physiology

For each source, extract all visible articles/research items with:
- title: The title of the research article
- url: The full URL to the article (including DOI link if available)
- authors: List of authors or first author (if available)
- snippet: Abstract or description (max 300 characters)
- source: The source name
- pubDate: Publication date (if available)
- doi: DOI identifier (if available)

Return ONLY a valid JSON array of objects. Do not include any markdown formatting or code blocks.

Example format:
[
  {
    "title": "Effects of exercise on muscle physiology",
    "url": "https://journals.physiology.org/doi/10.1152/jappl.2024.12345",
    "authors": "Smith J, Johnson A",
    "snippet": "This study investigates the physiological adaptations...",
    "source": "Journal of Applied Physiology",
    "pubDate": "2024-01-15",
    "doi": "10.1152/jappl.2024.12345"
  }
]
"""
        
        try:
            response_text = await self._execute_query(prompt)
            
            json_match = re.search(r'\[[\s\S]*\]', response_text)
            if json_match:
                results = json.loads(json_match.group(0))
                return results
            else:
                print(f"Could not extract JSON from response: {response_text[:200]}...")
                return []
                
        except Exception as e:
            print(f"Error in scrape_physiology_journals: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    async def scrape_url(self, url: str) -> str:
        """
        Generic method to scrape any URL and return its content
        
        Args:
            url: URL to scrape
            
        Returns:
            Text content of the page
        """
        prompt = f"""Please use the Bright Data Web MCP tools to scrape the following URL and extract the main text content:
{url}

Return the main content of the page in a clean, readable format."""
        
        try:
            return await self._execute_query(prompt)
        except Exception as e:
            print(f"Error scraping URL: {e}")
            raise
    
    async def _execute_query(self, prompt: str) -> str:
        """
        Execute a query using the Claude Agent SDK with BrightData Web MCP
        
        Args:
            prompt: The prompt to send to the agent
            
        Returns:
            The complete response text from the agent
        """
        response_text = ""
        current_tool = None
        tool_input = ""
        
        # Agentic loop: Streams events returned by the Claude Agent SDK
        async for message in query(prompt=prompt, options=self.options):
            # Intercept only streaming events
            if isinstance(message, StreamEvent):
                event = message.event
                event_type = event.get("type")
                
                if event_type == "content_block_start":
                    # New tool call is starting
                    content_block = event.get("content_block", {})
                    if content_block.get("type") == "tool_use":
                        current_tool = content_block.get("name")
                        tool_input = ""
                        print(f"\n[Tool] Starting: {current_tool}")
                
                # Handle incremental text output
                elif event_type == "content_block_delta":
                    delta = event.get("delta", {})
                    if delta.get("type") == "text_delta":
                        # Accumulate streamed text
                        text_chunk = delta.get("text", "")
                        response_text += text_chunk
                        print(text_chunk, end="", flush=True)
                    elif delta.get("type") == "input_json_delta":
                        # Accumulate JSON input as it streams in
                        chunk = delta.get("partial_json", "")
                        tool_input += chunk
                
                elif event_type == "content_block_stop":
                    # Tool call complete
                    if current_tool:
                        print(f"\n[Tool] {current_tool} completed")
                        current_tool = None
        
        return response_text


# Example usage for testing
async def main():
    """Test the BrightData service"""
    service = BrightDataService()
    
    print("=" * 60)
    print("Testing BrightData Web MCP with Claude Agent SDK")
    print("=" * 60)
    
    # Test 1: Search with query
    print("\n[Test 1] Searching for 'muscle physiology'...")
    print("-" * 60)
    results = await service.search_clinical_resources("muscle physiology")
    
    print(f"\n\nFound {len(results)} results from search:")
    for i, result in enumerate(results[:3], 1):  # Show first 3
        print(f"\n{i}. [{result.get('source', 'Unknown')}] {result.get('title', 'No title')}")
        print(f"   Authors: {result.get('authors', 'N/A')}")
        print(f"   URL: {result.get('url', 'No URL')}")
        print(f"   Snippet: {result.get('snippet', 'No snippet')[:100]}...")
    
    # Test 2: Scrape specific journal URLs
    print("\n" + "=" * 60)
    print("[Test 2] Scraping specific physiology journal URLs...")
    print("-" * 60)
    
    journal_results = await service.scrape_physiology_journals()
    
    print(f"\n\nFound {len(journal_results)} articles from journals:")
    for i, result in enumerate(journal_results[:5], 1):  # Show first 5
        print(f"\n{i}. [{result.get('source', 'Unknown')}] {result.get('title', 'No title')}")
        print(f"   Authors: {result.get('authors', 'N/A')}")
        print(f"   DOI: {result.get('doi', 'N/A')}")
        print(f"   URL: {result.get('url', 'No URL')}")
        print(f"   Date: {result.get('pubDate', 'N/A')}")


if __name__ == "__main__":
    asyncio.run(main())
# BrightData Service Optimization Summary

## Problem
- **Speed**: Initial implementation took 7.5 minutes per query
- **Diversity**: All results came from only one source (Journal of Applied Physiology)

## Root Causes
1. Using slow tools (scrape_batch, grep) instead of fast search_engine
2. Prompt didn't explicitly require diversity across all 3 sources
3. Too much unnecessary scraping and processing

## Solution

### 1. Use ONLY Fast Tools
**Before**: Used multiple tools
- `search_engine` ✅
- `scrape_batch` ❌ (slow)
- `grep` ❌ (unnecessary)

**After**: Use ONLY `search_engine`
- Fastest BrightData tool
- Gets all needed info from search results
- No need to scrape full pages

### 2. Explicit Diversity Requirements
**Before**: Generic prompt asking to "scrape sources"
```python
"scrape the following physiology research sources..."
```

**After**: Explicit site-specific searches
```python
1. Search "site:journals.physiology.org {query}" - Get 3-4 from Source 1
2. Search "site:physoc.onlinelibrary.wiley.com {query}" - Get 3-4 from Source 2  
3. Search "site:mayo.edu physiology {query}" - Get 3-4 from Source 3
```

### 3. Simplified Data Extraction
**Before**: 
- Scrape full pages
- Parse complex HTML
- Extract from abstracts

**After**:
- Get info directly from search results
- Snippet already in search result
- Much faster, still accurate

## Expected Performance

### Speed Improvement
- **Before**: ~7.5 minutes
- **After**: ~30-60 seconds (10-15x faster)

### Diversity Improvement
- **Before**: All from 1 source
- **After**: 3-4 results from EACH of 3 sources (9-12 total)

## Key Changes in Code

```python
# OLD PROMPT (slow, not diverse)
prompt = f"""Search for physiology research articles about: "{query_text}"
Please use the Bright Data Web MCP tools to scrape the following physiology research sources...
"""

# NEW PROMPT (fast, diverse)
prompt = f"""Use ONLY the search_engine tool to find research articles about "{query_text}".

IMPORTANT: You MUST get results from ALL THREE sources below. Search each one separately:

1. Search "site:journals.physiology.org {query_text}" - Get 3-4 results from Journal of Applied Physiology
2. Search "site:physoc.onlinelibrary.wiley.com {query_text}" - Get 3-4 results from The Journal of Physiology  
3. Search "site:mayo.edu physiology {query_text}" - Get 3-4 results from Mayo Clinic

CRITICAL: 
- Use ONLY search_engine tool (fastest)
- Do NOT use scrape, grep, or batch tools
- Return results from ALL 3 sources
"""
```

## Testing

To verify the improvements:

1. **Start backend**:
   ```bash
   uvicorn main:app --reload
   ```

2. **Test query** (e.g., "bicep curls"):
   - Should complete in ~30-60 seconds (not 7.5 minutes)
   - Should return 9-12 results
   - Should have 3-4 from EACH source

3. **Check logs** for tool usage:
   - Should see: `[Tool] Starting: mcp__bright_data__search_engine` (3 times)
   - Should NOT see: `scrape_batch`, `grep`, etc.

## Files Modified

- `/backend/services/brightdata_service.py` - Optimized `search_clinical_resources()` method

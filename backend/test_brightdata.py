import asyncio
from services.brightdata_service import BrightDataService
from dotenv import load_dotenv
import os

load_dotenv()

async def test_brightdata():
    if not os.getenv("BRIGHTDATA_WS_ENDPOINT"):
        print("❌ BRIGHTDATA_WS_ENDPOINT not found")
        return

    print("🚀 Starting BrightData Test...")
    service = BrightDataService()
    
    # Test NICE search
    print("\n--------------------------------")
    print("Testing NICE Guidelines Search...")
    nice_results = await service.search_nice_guidelines("back pain")
    print(f"✅ NICE Results: {len(nice_results)}")
    for res in nice_results:
        print(f" - {res['title']} ({res['url']})")

    # Test NHS search
    print("\n--------------------------------")
    print("Testing NHS Search...")
    nhs_results = await service.search_nhs("back pain")
    print(f"✅ NHS Results: {len(nhs_results)}")
    for res in nhs_results:
        print(f" - {res['title']} ({res['url']})")

    # Test CSP search
    print("\n--------------------------------")
    print("Testing CSP Search...")
    csp_results = await service.search_csp("back pain")
    print(f"✅ CSP Results: {len(csp_results)}")
    for res in csp_results:
        print(f" - {res['title']} ({res['url']})")
        
    print("\n--------------------------------")
    print("🏁 Test Complete")

if __name__ == "__main__":
    asyncio.run(test_brightdata())

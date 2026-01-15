
import asyncio
import unittest
from unittest.mock import MagicMock, AsyncMock, patch

# Must export PYTHONPATH to include local dir for imports to work
# Run: export PYTHONPATH=$PYTHONPATH:.

class TestAutoApplyCoverage(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        # Mocks
        self.mock_client = MagicMock()
        self.mock_client._request = AsyncMock(return_value=MagicMock(status_code=200))
        
        self.mock_llm = MagicMock()
        self.mock_llm.generate_json = AsyncMock(return_value={"answer": "5"})
        
        # Browser Mocks
        self.mock_page = AsyncMock()
        self.mock_context = AsyncMock()
        self.mock_context.close = AsyncMock()
        self.mock_page.goto = AsyncMock()
        self.mock_page.close = AsyncMock()
        self.mock_page.wait_for_selector = AsyncMock()
        self.mock_page.screenshot = AsyncMock(return_value=b'img')
        
        self.mock_browser = MagicMock()
        self.mock_browser.is_initialized = True
        self.mock_browser.create_session = AsyncMock(return_value=(self.mock_context, self.mock_page))
        
        # We need to import inside test method or patch carefully due to top-level imports
        with patch('agent.handlers.auto_apply_handler.browser_service', self.mock_browser):
             from agent.handlers.auto_apply_handler import AutoApplyHandler
             self.handler = AutoApplyHandler(self.mock_client, self.mock_llm)
             # Force overwrite just in case
             self.handler.browser = self.mock_browser

    async def test_easy_apply_detection(self):
        print("\n--- TEST: Easy Apply Detection ---")
        
        # Mock Locator Logic for Easy Apply
        # .locator(sel).first.is_visible()
        mock_btn = AsyncMock()
        mock_btn.is_visible.return_value = True
        mock_btn.inner_text.return_value = "Easy Apply"
        
        def locator_side_effect(selector):
            print(f"DEBUG SIDE EFFECT: {selector} -> match? {'yes' if ('top-card' in selector or 'easy' in selector or 'Easy' in selector or 'primary' in selector) else 'no'}")
            mock_loc = AsyncMock()
            
            # Simple broad matching for test
            if "top-card" in selector or "easy" in selector or "Easy" in selector or "primary" in selector:
                print("   -> Matched Easy Apply")
                mock_loc.first = mock_btn
            else:
                 print("   -> Matched None/Other")
                 # Create a distinct mock that returns false explicitly
                 bad_btn = AsyncMock()
                 bad_btn.is_visible.return_value = False
                 mock_loc.first = bad_btn
            return mock_loc
            
        self.mock_page.locator.side_effect = locator_side_effect
        
        # Run Detection
        res = await self.handler.detect_apply_type(self.mock_page)
        print(f"Detected: {res}")
        self.assertEqual(res, "easy_apply")

    async def test_external_ats_flow(self):
        print("\n--- TEST: External ATS Flow ---")
        
        # 1. Detection needs to fail easy apply, pass external
        mock_easy = AsyncMock()
        mock_easy.is_visible.return_value = False
        
        mock_ext = AsyncMock()
        mock_ext.is_visible.return_value = True
        mock_ext.click = AsyncMock()
        
        def locator_side_effect(selector):
            mock_loc = AsyncMock()
            
            # 1. First Pass: detection
            # Easy Apply checks
            if "top-card" in selector or "easy" in selector:
                mock_loc.first = mock_easy  # False
            # External checks
            elif "external" in selector or "href" in selector:
                mock_loc.first = mock_ext   # True
                
            # 2. Second Pass: Execution inside handle_external_apply
            # It iterates External selectors again
            
            # 3. Form filling inputs (skip for this test)
            if "input" in selector:
                mock_loc.all.return_value = []
            
            return mock_loc
            
        self.mock_page.locator.side_effect = locator_side_effect
        
        # Mock Popup context manager
        # popup_mock IS the new page
        new_page_mock = AsyncMock()
        new_page_mock.url = "http://greenhouse.io/job/123"
        new_page_mock.wait_for_load_state = AsyncMock()
        new_page_mock.locator.side_effect = lambda s: AsyncMock(all=MagicMock(return_value=[])) # No inputs
        
        # Fix AsyncContext to behave exactly like Playwright
        class AsyncContext:
            async def __aenter__(self):
                cm = MagicMock()
                f = asyncio.Future()
                f.set_result(new_page_mock)
                cm.value = f
                return cm
            async def __aexit__(self, exc_type, exc, tb): 
                pass

        self.mock_page.expect_popup.return_value = AsyncContext()
        
        # Run
        job = {"id": "100", "url": "http://linkedin.com/job/x"}
        await self.handler.execute_single_application(job, "resume.pdf", {})
        
        # Verify Report
        self.mock_client._request.assert_called()
        args = self.mock_client._request.call_args[1]
        payload = args['json']
        print(f"DEBUG REPORT PAYLOAD: {payload}")
        print(f"FAILURE DETAILS: {payload.get('metadata', {}).get('message')}")
        self.assertEqual(payload['method'], 'external_ats')
        print("✅ External ATS Flow Reported Correctly")

if __name__ == '__main__':
    unittest.main()

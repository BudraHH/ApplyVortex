
import asyncio
import unittest
from unittest.mock import MagicMock, AsyncMock, patch
from agent.handlers.auto_apply_handler import AutoApplyHandler

class TestAutoApplyHandler(unittest.IsolatedAsyncioTestCase):
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
        self.mock_page.wait_for_timeout = AsyncMock()
        
        self.mock_browser = MagicMock()
        self.mock_browser.is_initialized = True
        self.mock_browser.create_session = AsyncMock(return_value=(self.mock_context, self.mock_page))
        
        # Patch Browser Service in Handler
        with patch('agent.handlers.auto_apply_handler.browser_service', self.mock_browser):
            self.handler = AutoApplyHandler(self.mock_client, self.mock_llm)
            # Override browser instance just in case
            self.handler.browser = self.mock_browser

    async def test_success_flow_simple(self):
        print("\n--- TEST: Success Flow (Simple) ---")
        # Setup Element Mocks
        # Apply Button
        mock_apply_btn = AsyncMock()
        mock_apply_btn.first = mock_apply_btn
        mock_apply_btn.is_visible.return_value = True
        mock_apply_btn.click = AsyncMock()
        
        # Modal
        mock_modal = AsyncMock()
        mock_modal.first = mock_modal
        mock_modal.wait_for = AsyncMock() # Add missing wait_for
        
        # Submit Button
        mock_submit_btn = AsyncMock()
        mock_submit_btn.first = mock_submit_btn
        mock_submit_btn.is_visible = AsyncMock(side_effect=[False, True]) # Hidden first check, Visible second
        mock_submit_btn.click = AsyncMock()
        
        # Locators
        def locator_side_effect(selector):
            if "apply-button" in selector:
                return mock_apply_btn
            if "easy-apply-modal" in selector:
                return mock_modal
            if "Submit" in selector:
                return mock_submit_btn
            
            # Default empty/invisible for others to skip steps
            mock_loc = AsyncMock()
            mock_loc.first = mock_loc # Chainable
            mock_loc.is_visible.return_value = False
            mock_loc.count.return_value = 0
            mock_loc.all.return_value = []
            return mock_loc

        self.mock_page.locator.side_effect = locator_side_effect
        mock_modal.locator.side_effect = locator_side_effect

        # Run
        job = {"id": "1", "url": "http://test.com", "title": "Dev"}
        await self.handler.execute_single_application(job, "resume.pdf", {})
        
        # Verify
        self.mock_page.goto.assert_called_with("http://test.com", timeout=30000)
        mock_apply_btn.click.assert_called()
        mock_submit_btn.click.assert_called()
        self.mock_client._request.assert_called_with("POST", "agent-forge/jobs/1/applied", json=unittest.mock.ANY)
        print("✅ Success Flow Passed")

    async def test_question_answering_flow(self):
        print("\n--- TEST: Question Answering Flow ---")
        # Setup: Apply -> Textarea (Q) -> Next -> Submit
        
        mock_apply_btn = AsyncMock()
        mock_apply_btn.first = mock_apply_btn
        mock_apply_btn.is_visible.return_value = True
        mock_apply_btn.click = AsyncMock()
        
        mock_textarea = AsyncMock() # Represents array of textareas
        mock_textarea.first = mock_textarea
        
        mock_ta_element = AsyncMock()
        mock_ta_element.is_visible.return_value = True
        mock_ta_element.input_value.return_value = "" # Empty initially
        mock_ta_element.get_attribute.return_value = "q1"
        mock_ta_element.fill = AsyncMock()
        
        # When .all() is called on textarea locator, return the element list
        mock_textarea.all.return_value = [mock_ta_element]

        mock_label = AsyncMock()
        mock_label.inner_text.return_value = "How many years of Python?"
        
        mock_submit_btn = AsyncMock()
        mock_submit_btn.first = mock_submit_btn
        mock_submit_btn.is_visible = AsyncMock(side_effect=[False, True]) # Visible on 2nd loop
        mock_submit_btn.click = AsyncMock()
        
        mock_next_btn = AsyncMock()
        mock_next_btn.first = mock_next_btn
        mock_next_btn.is_visible.return_value = True
        mock_next_btn.is_enabled.return_value = True
        mock_next_btn.click = AsyncMock()
        
        def locator_side_effect(selector):
            if "apply-button" in selector: return mock_apply_btn
            if "textarea" in selector: return mock_textarea
            if "label" in selector: return mock_label
            if "Submit" in selector: return mock_submit_btn
            if "Next" in selector or "Continue" in selector: return mock_next_btn
            
            mock_loc = AsyncMock()
            mock_loc.first = mock_loc
            mock_loc.is_visible.return_value = False
            mock_loc.count.return_value = 0
            mock_loc.all.return_value = []
            return mock_loc

        # Enable modal wait_for
        mock_modal = AsyncMock()
        mock_modal.first = mock_modal
        mock_modal.wait_for = AsyncMock()
        mock_modal.locator.side_effect = locator_side_effect # IMPORTANT: Modal logic calls locator on itself

        self.mock_page.locator.side_effect = locator_side_effect # Initial Apply button on page
        
        # Override page.locator to return modal for the modal selector
        def page_locator_effect(selector):
             if "easy-apply-modal" in selector: return mock_modal
             return locator_side_effect(selector)
        self.mock_page.locator.side_effect = page_locator_effect

        # Run
        job = {"id": "2", "url": "http://test.com", "title": "Senior Dev"}
        profile = {"skills": ["Python"]}
        await self.handler.execute_single_application(job, "resume.pdf", profile)
        
        # Verify
        self.mock_llm.generate_json.assert_called() # LLM called
        mock_ta_element.fill.assert_called_with("5") # Filled with LLM answer
        mock_next_btn.click.assert_called() # Clicked Next
        mock_submit_btn.click.assert_called() # Clicked Submit
        print("✅ Question Answering Flow Passed")

    async def test_failure_flow(self):
        print("\n--- TEST: Failure Flow (Timeout/Error) ---")
        self.mock_page.goto.side_effect = Exception("Timeout Navigation")
        
        job = {"id": "3", "url": "http://test.com", "title": "Bad Job"}
        await self.handler.execute_single_application(job, "resume.pdf", {})
        
        # Verify
        # Should report failure
        args, _ = self.mock_client._request.call_args
        self.assertEqual(args[0], "POST")
        payload = _['json']
        self.assertFalse(payload['applied'])
        self.assertIn("Timeout Navigation", payload['metadata']['message'])
        print("✅ Failure Flow Passed")

if __name__ == '__main__':
    unittest.main()

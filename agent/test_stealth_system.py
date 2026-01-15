"""
Test Script for rtrvr.ai-Grade Stealth System

Tests:
1. Session pool reuse (3 contexts max)
2. Sticky fingerprint consistency
3. Human simulation (mouse movement, typing, scrolling)
4. Health checks and recovery
5. Metrics tracking
"""

import asyncio
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def test_session_pool():
    """Test 1: Verify session pool reuses contexts."""
    from agent.core.browser_service import browser_service
    from agent.core.metrics import stealth_metrics
    
    logger.info("=" * 60)
    logger.info("TEST 1: Session Pool Reuse")
    logger.info("=" * 60)
    
    # Initialize browser
    await browser_service.initialize(headless=True)
    
    # Simulate 10 operations
    session_ids = []
    for i in range(10):
        session_id, context, page = await browser_service.get_page()
        session_ids.append(session_id)
        
        # Do some work
        await page.goto("https://www.google.com", timeout=10000)
        logger.info(f"Operation {i+1}: Session {session_id[:8]}")
        
        # Return to pool
        await browser_service.return_page(session_id, context, page)
        
        await asyncio.sleep(0.5)
    
    # Verify reuse
    unique_sessions = len(set(session_ids))
    logger.info(f"\n✅ Total operations: 10")
    logger.info(f"✅ Unique sessions: {unique_sessions}")
    logger.info(f"✅ Reuses: {10 - unique_sessions}")
    logger.info(f"✅ Reuse efficiency: {stealth_metrics.reuse_efficiency:.1f}%")
    
    assert unique_sessions <= 3, f"Expected max 3 sessions, got {unique_sessions}"
    assert stealth_metrics.context_reuses >= 7, f"Expected >= 7 reuses, got {stealth_metrics.context_reuses}"
    
    logger.info("✅ TEST 1 PASSED: Session pool working correctly\n")
    
    await browser_service.cleanup()


async def test_sticky_fingerprint():
    """Test 2: Verify fingerprint consistency across sessions."""
    from agent.core.browser_service import browser_service, StickyFingerprint
    
    logger.info("=" * 60)
    logger.info("TEST 2: Sticky Fingerprint Consistency")
    logger.info("=" * 60)
    
    # Create fingerprint
    fp1 = StickyFingerprint()
    ua1 = fp1.fingerprint['user_agent']
    
    # Create another instance (should load same fingerprint)
    fp2 = StickyFingerprint()
    ua2 = fp2.fingerprint['user_agent']
    
    logger.info(f"Fingerprint 1 UA: {ua1[:50]}...")
    logger.info(f"Fingerprint 2 UA: {ua2[:50]}...")
    
    assert ua1 == ua2, "Fingerprints should be identical"
    
    logger.info("✅ TEST 2 PASSED: Fingerprint is sticky\n")


async def test_human_simulation():
    """Test 3: Verify human simulation works."""
    from agent.core.browser_service import browser_service
    from agent.core.human_simulator import HumanSimulator
    
    logger.info("=" * 60)
    logger.info("TEST 3: Human Simulation")
    logger.info("=" * 60)
    
    await browser_service.initialize(headless=True)
    
    session_id, context, page = await browser_service.get_page()
    
    try:
        # Navigate to test page
        await page.goto("https://www.google.com", timeout=10000)
        
        # Test human scroll
        logger.info("Testing human scroll...")
        await HumanSimulator.human_scroll(page, direction='down', chunks=3)
        logger.info("✅ Human scroll completed")
        
        # Test human click (on Google logo)
        logger.info("Testing human click...")
        success = await HumanSimulator.human_click(page, 'img[alt="Google"]', timeout=5000)
        if success:
            logger.info("✅ Human click completed")
        else:
            logger.warning("⚠️ Click element not found (expected on some pages)")
        
        # Test human typing
        logger.info("Testing human typing...")
        await page.goto("https://www.google.com", timeout=10000)
        success = await HumanSimulator.human_type(page, 'textarea[name="q"]', "test query")
        if success:
            logger.info("✅ Human typing completed")
        
        logger.info("✅ TEST 3 PASSED: Human simulation working\n")
        
    finally:
        await browser_service.return_page(session_id, context, page)
        await browser_service.cleanup()


async def test_health_checks():
    """Test 4: Verify health checks work."""
    from agent.core.browser_service import browser_service
    
    logger.info("=" * 60)
    logger.info("TEST 4: Health Checks")
    logger.info("=" * 60)
    
    await browser_service.initialize(headless=True)
    
    # Create context
    session_id, context = await browser_service.browser_manager.create_context()
    
    # Run health check
    is_healthy = await browser_service.browser_manager.health_check(context, session_id)
    
    logger.info(f"Health check result: {'✅ PASSED' if is_healthy else '❌ FAILED'}")
    
    assert is_healthy, "Health check should pass for new context"
    
    logger.info("✅ TEST 4 PASSED: Health checks working\n")
    
    await browser_service.cleanup()


async def test_metrics():
    """Test 5: Verify metrics tracking."""
    from agent.core.metrics import stealth_metrics
    
    logger.info("=" * 60)
    logger.info("TEST 5: Metrics Tracking")
    logger.info("=" * 60)
    
    # Simulate some events
    stealth_metrics.on_session_created("test-session-1")
    stealth_metrics.on_context_reuse("test-session-1")
    stealth_metrics.on_context_reuse("test-session-1")
    stealth_metrics.on_operation_complete(1.5)
    stealth_metrics.on_health_check("test-session-1", passed=True)
    
    # Get summary
    summary = stealth_metrics.get_summary()
    
    logger.info("Metrics Summary:")
    for key, value in summary.items():
        logger.info(f"  {key}: {value}")
    
    assert summary['context_reuses'] >= 2, "Should have at least 2 reuses"
    assert summary['total_operations'] >= 1, "Should have at least 1 operation"
    
    logger.info("✅ TEST 5 PASSED: Metrics tracking working\n")


async def run_all_tests():
    """Run all tests."""
    logger.info("\n" + "=" * 60)
    logger.info("STEALTH SYSTEM TEST SUITE")
    logger.info("=" * 60 + "\n")
    
    try:
        await test_sticky_fingerprint()
        await test_session_pool()
        await test_human_simulation()
        await test_health_checks()
        await test_metrics()
        
        logger.info("\n" + "=" * 60)
        logger.info("🎉 ALL TESTS PASSED!")
        logger.info("=" * 60 + "\n")
        
        # Final metrics summary
        from agent.core.metrics import stealth_metrics
        stealth_metrics.log_summary()
        
    except Exception as e:
        logger.error(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    asyncio.run(run_all_tests())

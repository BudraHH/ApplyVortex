"""
Intelligence Service - Provides real-time profile optimization insights
based on job match analysis data.
"""

from typing import Dict, Any, List, Optional
from uuid import UUID
from decimal import Decimal
from collections import Counter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.job.job_match import JobMatchAnalysis
from app.repositories.job.match_repository import JobMatchRepository


class IntelligenceService:
    """
    Analyzes job match data to provide actionable optimization insights.
    
    Features:
    - Aggregates skill gaps across all job matches
    - Calculates optimization score based on profile/match quality
    - Provides prioritized recommendations with estimated impact
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.match_repo = JobMatchRepository(db)
    
    async def get_optimization_insights(self, user_id: UUID) -> Dict[str, Any]:
        """
        Generate optimization insights from user's job match data.
        
        Returns:
            - score: Overall optimization score (0-100)
            - salaryBoost: Estimated salary increase potential
            - skillGaps: Prioritized list of skills to acquire
        """
        # Fetch all job matches for the user
        matches = await self.match_repo.get_by_user(user_id, limit=100)
        
        if not matches:
            # Return empty state if no job match data exists
            return {
                "score": 0,
                "salaryBoost": "+0%",
                "skillGaps": [],
                "meta": {
                    "jobsAnalyzed": 0,
                    "message": "No job matches found. Sync jobs to get optimization insights."
                }
            }
        
        # Calculate optimization score based on average match quality
        avg_match = self._calculate_average_match(matches)
        optimization_score = self._calculate_optimization_score(avg_match, matches)
        
        # Aggregate and prioritize skill gaps
        skill_gaps = self._aggregate_skill_gaps(matches)
        
        # Estimate salary boost potential based on skill gaps
        salary_boost = self._estimate_salary_boost(skill_gaps, avg_match)
        
        return {
            "score": optimization_score,
            "salaryBoost": salary_boost,
            "skillGaps": skill_gaps[:5],  # Top 5 skill gaps
            "meta": {
                "jobsAnalyzed": len(matches),
                "averageMatchScore": round(float(avg_match) * 100, 1),
                "totalSkillGaps": len(skill_gaps)
            }
        }
    
    def _calculate_average_match(self, matches: List[JobMatchAnalysis]) -> Decimal:
        """Calculate average overall match score across all jobs."""
        if not matches:
            return Decimal("0")
        
        total = sum(m.overall_match for m in matches if m.overall_match)
        return total / len(matches)
    
    def _calculate_optimization_score(
        self, 
        avg_match: Decimal, 
        matches: List[JobMatchAnalysis]
    ) -> int:
        """
        Calculate optimization score (0-100) based on:
        - Average match score (60% weight)
        - Skill coverage (30% weight)
        - Match distribution quality (10% weight)
        """
        if not matches:
            return 0
        
        # Base score from average match (0-60 points)
        base_score = float(avg_match) * 60
        
        # Skill coverage bonus (0-30 points)
        # Higher if user has more matched skills vs missing skills
        total_matched = sum(len(m.matched_skills or []) for m in matches)
        total_missing = sum(len(m.missing_skills or []) for m in matches)
        
        if total_matched + total_missing > 0:
            skill_ratio = total_matched / (total_matched + total_missing)
            skill_score = skill_ratio * 30
        else:
            skill_score = 15  # Neutral if no data
        
        # Quality distribution bonus (0-10 points)
        # Higher if you have strong matches
        strong_matches = sum(1 for m in matches if float(m.overall_match or 0) >= 0.75)
        quality_ratio = strong_matches / len(matches) if matches else 0
        quality_score = quality_ratio * 10
        
        total_score = int(base_score + skill_score + quality_score)
        return min(max(total_score, 0), 100)  # Clamp to 0-100
    
    def _aggregate_skill_gaps(self, matches: List[JobMatchAnalysis]) -> List[Dict[str, Any]]:
        """
        Aggregate missing skills across all job matches and prioritize by frequency.
        Returns skill gap objects with impact estimates.
        """
        # Count frequency of each missing skill
        skill_counter = Counter()
        for match in matches:
            if match.missing_skills:
                skill_counter.update(match.missing_skills)
        
        if not skill_counter:
            return []
        
        # Calculate total jobs for percentage
        total_jobs = len(matches)
        
        # Sort by frequency and create skill gap objects
        skill_gaps = []
        for skill, count in skill_counter.most_common(10):
            frequency_pct = (count / total_jobs) * 100
            impact, status, detail = self._calculate_skill_impact(skill, frequency_pct, count)
            
            skill_gaps.append({
                "skill": skill,
                "impact": impact,
                "status": status,
                "detail": detail,
                "frequency": count,
                "frequencyPct": round(frequency_pct, 1),
                "color": self._get_status_color(status),
                "bg": self._get_status_bg(status)
            })
        
        return skill_gaps
    
    def _calculate_skill_impact(
        self, 
        skill: str, 
        frequency_pct: float, 
        count: int
    ) -> tuple:
        """Calculate impact percentage, status level, and detail message."""
        
        # Impact is correlated with frequency
        if frequency_pct >= 70:
            impact = f"+{int(30 + frequency_pct * 0.2)}%"
            status = "critical"
            detail = f"Found in {int(frequency_pct)}% of your matched jobs ({count} jobs). This is a critical skill gap affecting your match rates significantly."
        elif frequency_pct >= 40:
            impact = f"+{int(20 + frequency_pct * 0.15)}%"
            status = "high"
            detail = f"Required in {int(frequency_pct)}% of jobs ({count} positions). Adding this skill could substantially improve your matches."
        elif frequency_pct >= 20:
            impact = f"+{int(10 + frequency_pct * 0.1)}%"
            status = "medium"
            detail = f"Mentioned in {int(frequency_pct)}% of job listings ({count} jobs). Worth considering for broader opportunities."
        else:
            impact = f"+{int(5 + frequency_pct * 0.05)}%"
            status = "low"
            detail = f"Appears in {int(frequency_pct)}% of positions ({count} jobs). Nice to have but not critical."
        
        return impact, status, detail
    
    def _estimate_salary_boost(
        self, 
        skill_gaps: List[Dict], 
        avg_match: Decimal
    ) -> str:
        """Estimate potential salary boost if skill gaps are addressed."""
        if not skill_gaps:
            return "+0%"
        
        # Base boost on current match quality (inverse relationship)
        # Lower match = higher potential boost
        current_match_pct = float(avg_match) * 100
        base_boost = max(5, int((100 - current_match_pct) * 0.4))
        
        # Add boost based on critical skill gaps
        critical_gaps = sum(1 for g in skill_gaps if g.get("status") == "critical")
        high_gaps = sum(1 for g in skill_gaps if g.get("status") == "high")
        
        skill_boost = (critical_gaps * 5) + (high_gaps * 3)
        
        total_boost = min(base_boost + skill_boost, 50)  # Cap at 50%
        
        return f"+{total_boost}%"
    
    def _get_status_color(self, status: str) -> str:
        """Get Tailwind text color class for status."""
        colors = {
            "critical": "text-red-500",
            "high": "text-amber-500",
            "medium": "text-yellow-500",
            "low": "text-blue-500"
        }
        return colors.get(status, "text-slate-500")
    
    def _get_status_bg(self, status: str) -> str:
        """Get Tailwind background classes for status."""
        bgs = {
            "critical": "bg-red-50 border-red-100",
            "high": "bg-amber-50 border-amber-100",
            "medium": "bg-yellow-50 border-yellow-100",
            "low": "bg-blue-50 border-blue-100"
        }
        return bgs.get(status, "bg-slate-50 border-slate-100")

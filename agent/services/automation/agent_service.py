"""LangChain based autonomous agent for job applications."""

import logging
from typing import Dict, Any, List, Optional
from uuid import UUID
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import AgentExecutor, create_structured_chat_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from app.services.automation.agent_tools import AgentTools
from app.core.config import settings

logger = logging.getLogger(__name__)

class ApplyVortexAgent:
    """Autonomous agent that determines how to best apply for a job."""
    
    def __init__(self, db_session):
        self.db = db_session
        self.tools_provider = AgentTools(db_session)
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=settings.AI_API_KEY,
            temperature=0
        )
        self._setup_agent()

    def _setup_agent(self):
        tools = [
            self.tools_provider.research_job,
            self.tools_provider.tailor_resume_for_job,
            self.tools_provider.get_user_profile_summary,
            self.tools_provider.submit_application
        ]
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are the ApplyVortex Autonomous Application Assistant. 
            Your goal is to maximize the user's chance of getting hired by intelligently managing the application process.
            
            When given a Job ID and User ID:
            1. Research the job to understand its requirements.
            2. Get the user's profile summary.
            3. Decide if a tailored resume is needed (always recommended for high-match jobs).
            4. If needed, trigger the resume tailoring tool.
            5. Finally, use the submit_application tool to fill the form.
            
            Always think step-by-step. Be concise and professional."""),
            ("human", "Apply for job {job_id} for user {user_id} using base resume {base_resume_id}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        
        agent = create_structured_chat_agent(self.llm, tools, prompt)
        self.executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

    async def run_application_workflow(self, user_id: UUID, job_id: UUID, base_resume_id: UUID):
        """Execute the full autonomous application workflow."""
        try:
            result = await self.executor.ainvoke({
                "user_id": str(user_id),
                "job_id": str(job_id),
                "base_resume_id": str(base_resume_id)
            })
            return result
        except Exception as e:
            logger.error(f"Agent workflow failed: {e}")
            raise

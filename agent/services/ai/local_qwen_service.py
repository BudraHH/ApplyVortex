import logging
import json
import os
from typing import Dict, Any, List, Optional

# --- Dependency Check ---
try:
    from llama_cpp import Llama, LlamaGrammar
except ImportError:
    raise ImportError(
        "llama-cpp-python is required. Install with hardware acceleration:\n"
        "  Mac (Metal): CMAKE_ARGS='-DGGML_METAL=on' pip install llama-cpp-python\n"
        "  Linux (CUDA): CMAKE_ARGS='-DGGML_CUDA=on' pip install llama-cpp-python\n"
        "  Windows: $env:CMAKE_ARGS='-DGGML_CUDA=on'; pip install llama-cpp-python"
    )

logger = logging.getLogger(__name__)

class AIProcessingError(Exception):
    """Custom exception for AI generation failures."""
    pass

class LocalQwenService:
    """
    ApplyVortex Intelligence Engine (Qwen 2.5-7B GGUF).
    
    Features:
    - 8k Context Window for full Document analysis.
    - GBNF Grammar constrained generation for 100% valid JSON.
    - ChatML Prompt Engineering.
    """

    # GBNF Grammar: Restricts output to valid JSON Objects or Arrays.
    # Source: https://github.com/ggerganov/llama.cpp/blob/master/grammars/json.gbnf
    JSON_GBNF_GRAMMAR = r"""
        root   ::= object | array
        value  ::= object | array | string | number | ("true" | "false" | "null") ws

        object ::=
          "{" ws (
                    string ":" ws value
            ("," ws string ":" ws value)*
          )? "}" ws

        array  ::=
          "[" ws (
                    value
            ("," ws value)*
          )? "]" ws

        string ::=
          "\"" (
            [^"\\] |
            "\\" (["\\/bfnrt] | "u" [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F]) # escapes
          )* "\"" ws

        number ::= ("-"? ([0-9] | [1-9] [0-9]*)) ("." [0-9]+)? ([eE] [-+]? [0-9]+)? ws
        ws ::= ([ \t\n]*)
    """

    def __init__(self, model_path: str):
        """
        Initialize the Local LLM Engine.
        :param model_path: Absolute path to the .gguf file.
        """
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found at: {model_path}")

        logger.info(f"Loading Qwen 2.5 Engine from: {model_path} ...")
        
        try:
            self.llm = Llama(
                model_path=model_path,
                n_ctx=8192,         # 8k Context
                n_gpu_layers=-1,    # Offload ALL layers to GPU/Metal
                verbose=False       # Suppress C++ noise
            )
            # Pre-compile grammar for performance
            self.json_grammar = LlamaGrammar.from_string(self.JSON_GBNF_GRAMMAR)
            logger.info("✅ Qwen 2.5 Engine Initialized successfully.")
            
        except Exception as e:
            logger.error(f"Failed to initialize Llama model: {e}")
            raise e

    def _build_chatml_prompt(self, system_msg: str, user_msg: str) -> str:
        """Constructs a prompt strict Qwen 2.5 ChatML format."""
        return (
            f"<|im_start|>system\n{system_msg}<|im_end|>\n"
            f"<|im_start|>user\n{user_msg}<|im_end|>\n"
            f"<|im_start|>assistant\n"
        )

    def parse_resume(self, resume_text: str) -> Dict[str, Any]:
        """
        Task 1: Parsing. 
        Strategy: Deterministic (Temp 0.1) + Grammar Constraint.
        """
        SYS_PROMPT = (
            "You are a specialized Resume Parsing Engine. "
            "Extract the candidate data into the strict ApplyVortex JSON schema."
        )
        
        prompt = self._build_chatml_prompt(SYS_PROMPT, resume_text[:7000]) # Safety trim
        
        logger.debug("Starting Resume Parsing (Grammar Constrained)...")
        try:
            output = self.llm.create_completion(
                prompt,
                max_tokens=2048,
                temperature=0.1,    # Precision
                grammar=self.json_grammar, # FORCE valid JSON
                stop=["<|im_end|>"]
            )
            
            raw_text = output['choices'][0]['text']
            return json.loads(raw_text)
            
        except json.JSONDecodeError:
            logger.error("Generated JSON was invalid despite grammar constraints.")
            raise AIProcessingError("Failed to parse AI output into JSON.")
        except Exception as e:
            logger.error(f"Parsing failed: {e}")
            raise AIProcessingError(str(e))

    def score_job(self, jd_text: str, resume_json: Dict, job_title: str = "Unknown Role", company_name: str = "Unknown Company") -> Dict[str, Any]:
        """
        Task 2: Scoring.
        Strategy: Low Creativity (Temp 0.2) + Grammar Constraint.
        """
        SYS_PROMPT = (
            "Analyze the match score between the Candidate Profile and the Job. "
            "Return JSON with 'match_score' (0-100), 'reasoning' (string), "
            "'missing_skills' (array of strings), and 'skill_gap_recommendations' (array of strings)."
        )
        
        user_content = (
            f"TARGET JOB:\n"
            f"Role: {job_title}\n"
            f"Company: {company_name}\n\n"
            f"JOB DESCRIPTION:\n{jd_text[:6000]}\n\n" # Increased limit slightly
            f"CANDIDATE PROFILE:\n{json.dumps(resume_json)}"
        )
        
        prompt = self._build_chatml_prompt(SYS_PROMPT, user_content)
        
        try:
            output = self.llm.create_completion(
                prompt,
                max_tokens=1024,
                temperature=0.2,
                grammar=self.json_grammar,
                stop=["<|im_end|>"]
            )
            
            return json.loads(output['choices'][0]['text'])

        except Exception as e:
            logger.error(f"Scoring failed: {e}")
            raise AIProcessingError(str(e))

    def tailor_content(self, section_text: str, keywords: List[str]) -> str:
        """
        Task 3: Creative Writing.
        Strategy: High Creativity (Temp 0.7) + NO Grammar (Free Text).
        """
        SYS_PROMPT = (
            "You are a Professional Career Writer. Rewrite the provided section "
            "to reflect a professional tone and naturally include the target keywords. "
            "Do not hallucinate facts."
        )
        
        user_content = (
            f"ORIGINAL TEXT: \"{section_text}\"\n"
            f"TARGET KEYWORDS: {json.dumps(keywords)}"
        )
        
        prompt = self._build_chatml_prompt(SYS_PROMPT, user_content)
        
        try:
            output = self.llm.create_completion(
                prompt,
                max_tokens=512,
                temperature=0.7, # Creativity enabled
                stop=["<|im_end|>"]
            )
            
            return output['choices'][0]['text'].strip()

        except Exception as e:
            logger.error(f"Tailoring failed: {e}")
            return section_text # Fallback to original if AI fails


from unsloth import FastLanguageModel
import os
import torch

"""
=============================================================================
ApplyVortex Model Export Utility
=============================================================================
Purpose: Merges LoRA adapters with the base Qwen 2.5 model and exports to GGUF format.

INSTRUCTIONS FOR DEPLOYMENT:
1. Run this script in the training environment (Colab/RunPod).
2. Wait for the export to complete (merging takes RAM).
3. Download the generated file: `exported_models/ApplyVortex-Qwen2.5-7B-Instruct-Q4_K_M.gguf`
4. Place the file in the Agent's local directory:
   Local Path: `applyvortex/agent/models/`
5. Update your Modelfile or Ollama config to point to this new binary.
=============================================================================
"""

# --- Configuration ---
ADAPTER_PATH = "trained_models/ApplyVortex-Qwen2.5-7B-Adapter"
EXPORT_DIR = "exported_models"
QUANTIZATION_METHOD = "q4_k_m" # Balanced: ~4.8GB RAM, High Perplexity retention
MAX_SEQ_LENGTH = 8192 # Must match training config

def main():
    print("📦 Starting Model Export Pipeline...")

    # 1. Load Fine-Tuned Model
    # Note: load_in_4bit=True is fine; Unsloth handles the de-quantization/merge logic internally.
    print(f"Loading adapter from: {ADAPTER_PATH}")
    try:
        model, tokenizer = FastLanguageModel.from_pretrained(
            model_name = ADAPTER_PATH,
            max_seq_length = MAX_SEQ_LENGTH,
            dtype = None,
            load_in_4bit = True,
        )
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        print("Ensure the 'trained_models' directory exists and contains the adapter.")
        return

    # 2. Export to GGUF (Q4_K_M)
    print(f"Starting GGUF Export (Method: {QUANTIZATION_METHOD})...")
    print("⚠️  This process requires significant system RAM to perform the merge.")
    
    if not os.path.exists(EXPORT_DIR):
        os.makedirs(EXPORT_DIR)

    try:
        model.save_pretrained_gguf(
            EXPORT_DIR,
            tokenizer,
            quantization_method = QUANTIZATION_METHOD
        )
        print(f"✅ Export Successful!")
        print(f"File saved to: {EXPORT_DIR}/ApplyVortex-Qwen2.5-7B-Instruct-Q4_K_M.gguf")
        
    except RuntimeError as e:
        if "out of memory" in str(e).lower():
            print("❌ OOM Error during merge/export.")
            print("Tip: If on Colab free tier, restart the runtime to clear RAM before running export.")
        else:
            print(f"❌ Runtime Error during export: {e}")
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")

    # --- Optional: Export Full Precision (F16) ---
    # Useful for debugging if 4-bit syntax has issues.
    # Uncomment below to export f16 (Warning: File size ~14GB)
    
    # print("\nStarting F16 Export (Optional)...")
    # try:
    #     model.save_pretrained_gguf(
    #         EXPORT_DIR,
    #         tokenizer,
    #         quantization_method = "f16"
    #     )
    # except Exception as e:
    #     print(f"F16 Export skipped: {e}")

if __name__ == "__main__":
    main()

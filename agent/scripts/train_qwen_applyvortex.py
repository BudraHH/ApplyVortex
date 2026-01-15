from unsloth import FastLanguageModel
import torch
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments
from unsloth.chat_templates import get_chat_template
import os

# --- Configuration ---
# Using Unsloth for optimized training speed and memory usage.
MODEL_NAME = "unsloth/Qwen2.5-7B-Instruct" 
MAX_SEQ_LENGTH = 8192  # Extended Context Window: Critical for parsing long CVs and JDs
DTYPE = None # Auto-detect (Float16 vs Bfloat16)
LOAD_IN_4BIT = True # 4-bit Quantization to fit in standard GPU VRAM (T4/L4)

# Output Paths
# Output Paths
OUTPUT_DIR = "trained_models/ApplyVortex-Qwen2.5-7B-Adapter"
DATASET_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "applyvortex_qwen_train.jsonl") # Path to data from Phase 1

def main():
    print(f"🚀 Starting Fine-Tuning Pipeline for {MODEL_NAME}...")

    # 1. Load Base Model & Tokenizer
    # We use Unsloth's FastLanguageModel for efficient loading
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name = MODEL_NAME,
        max_seq_length = MAX_SEQ_LENGTH,
        dtype = DTYPE,
        load_in_4bit = LOAD_IN_4BIT,
    )

    # 2. Configure PEFT / LoRA
    # Decision: Rank (r) = 64. Standard is often 8 or 16.
    # Why 64? We need deep behavioral adaptation for complex reasoning tasks (Resume Scoring gaps).
    # Higher rank allows the model to learn more nuanced correlations between skills and requirements.
    # Target Modules: We target ALL linear layers ("all-linear") to allow full-network plasticity.
    model = FastLanguageModel.get_peft_model(
        model,
        r = 64, 
        target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                          "gate_proj", "up_proj", "down_proj"],
        lora_alpha = 16,
        lora_dropout = 0, # Optimized for Unsloth (0 is standard)
        bias = "none",    # "none" is optimized for Unsloth
        use_gradient_checkpointing = "unsloth", # True or "unsloth" for very long context
        random_state = 3407,
        use_rslora = False,  # We stick to standard LoRA
        loftq_config = None, 
    )

    # 3. Data Loading & Formatting (ChatML)
    # Qwen 2.5 is natively trained on ChatML format.
    # We ensure the tokenizer uses the correct mapping.
    tokenizer = get_chat_template(
        tokenizer,
        chat_template = "chatml",
        mapping = {"role": "from", "content": "value", "user": "human", "assistant": "gpt"},
    )

    def formatting_prompts_func(examples):
        """
        Applies ChatML template to the batch.
        Expects 'messages' key in dataset.
        """
        convos = examples["messages"]
        texts = [tokenizer.apply_chat_template(convo, tokenize=False, add_generation_prompt=False) for convo in convos]
        return {"text": texts}

    print("Loading Dataset...")
    try:
        # Load local JSONL file
        dataset = load_dataset("json", data_files=DATASET_PATH, split="train")
        
        # Validate structure
        if "messages" not in dataset.column_names:
            raise KeyError("Dataset missing 'messages' column. Ensure strict ChatML format.")
            
        dataset = dataset.map(formatting_prompts_func, batched=True)
    except Exception as e:
        print(f"CRITICAL DATA ERROR: {e}")
        return

    # 4. Training Hyperparameters
    print("Configuring Trainer...")
    trainer = SFTTrainer(
        model = model,
        tokenizer = tokenizer,
        train_dataset = dataset,
        dataset_text_field = "text",
        max_seq_length = MAX_SEQ_LENGTH,
        dataset_num_proc = 2,
        packing = False, # Can enable True for short sequences, but we have long docs
        args = TrainingArguments(
            per_device_train_batch_size = 2, # Small batch for 8k context
            gradient_accumulation_steps = 4, # Effective batch size = 8
            warmup_ratio = 0.05,
            num_train_epochs = 2, # Full coverage of the 5k dataset (approx 1250 steps)
            learning_rate = 5e-5, # Conservative rate to preserve reasoning capabilities
            fp16 = not torch.cuda.is_bf16_supported(),
            bf16 = torch.cuda.is_bf16_supported(),
            logging_steps = 1,
            optim = "adamw_8bit", # Key for memory efficiency
            weight_decay = 0.01,
            lr_scheduler_type = "cosine", # Smooth decay
            seed = 3407,
            output_dir = "outputs",
        ),
    )

    # 5. Execute Training
    print("Training Started...")
    gpu_stats = torch.cuda.get_device_properties(0)
    start_gpu_memory = round(torch.cuda.max_memory_reserved() / 1024 / 1024 / 1024, 3)
    max_memory = round(gpu_stats.total_memory / 1024 / 1024 / 1024, 3)
    print(f"GPU: {gpu_stats.name}, Max Memory: {max_memory} GB, Reserved: {start_gpu_memory} GB")
    
    trainer_stats = trainer.train()

    # 6. Save Artifacts
    print(f"Saving Adapted Model to {OUTPUT_DIR}...")
    model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    
    # 7. Final Stats
    used_memory = round(torch.cuda.max_memory_reserved() / 1024 / 1024 / 1024, 3)
    used_memory_for_lora = round(used_memory - start_gpu_memory, 3)
    used_percentage = round(used_memory / max_memory * 100, 3)
    lora_percentage = round(used_memory_for_lora / max_memory * 100, 3)
    
    print(f"\n--- Training Complete ---")
    print(f"Peak Memory Used: {used_memory} GB ({used_percentage}%)")
    print(f"LoRA Memory Used: {used_memory_for_lora} GB ({lora_percentage}%)")
    print("Training successfully finished.")

if __name__ == "__main__":
    main()
